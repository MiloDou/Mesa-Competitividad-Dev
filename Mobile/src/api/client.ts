import * as SecureStore from "expo-secure-store";
import type { ApiErrorBody, AuthUser, TokenResponse } from "./types";

const configuredBase = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
export const apiBase = configuredBase || "http://127.0.0.1:8000/api/v1";

const REFRESH_KEY = "mesa_refresh";
let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Primera clave de `error.detail` cuando el servidor señala un campo (p. ej. `vote`, `option`). */
    readonly field: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 401 en una solicitud que no se reenvía sola (el voto): la sesión ya se renovó y la persona debe confirmar otra vez. */
export const MANUAL_RETRY_CODE = "manual_retry_required";
export const SESSION_EXPIRED_CODE = "session_expired";
export const NETWORK_ERROR_CODE = "network_error";

async function readRefresh(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(REFRESH_KEY); } catch { return null; }
}

async function writeRefresh(token: string | null) {
  try {
    if (token) await SecureStore.setItemAsync(REFRESH_KEY, token);
    else await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    // Sin almacenamiento seguro la sesión vive solo en memoria.
  }
}

async function storeTokens(tokens: TokenResponse) {
  accessToken = tokens.access;
  await writeRefresh(tokens.refresh);
}

export async function clearSession() {
  accessToken = null;
  await writeRefresh(null);
}

export function toApiError(status: number, body: unknown): ApiError {
  const envelope = (body as ApiErrorBody | null)?.error;
  const code = envelope?.code ?? `http_${status}`;
  const detail = envelope?.detail ?? body;
  if (typeof detail === "string") return new ApiError(status, code, detail);
  if (detail && typeof detail === "object") {
    const record = detail as Record<string, unknown>;
    if (typeof record.detail === "string") return new ApiError(status, code, record.detail);
    const [field, value] = Object.entries(record)[0] ?? [];
    const first = Array.isArray(value) ? value[0] : value;
    if (field) return new ApiError(status, code, typeof first === "string" ? first : "Revisa los datos e intenta de nuevo.", field);
  }
  return new ApiError(status, code, "No se pudo completar la solicitud.");
}

/** Renueva el access con el refresh rotativo. Una sola renovación a la vez: el refresh anterior deja de servir. */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refresh = await readRefresh();
      if (!refresh) return false;
      try {
        const response = await fetch(`${apiBase}/auth/refresh/`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (!response.ok) {
          // Un refresh rechazado llega como 403 (la vista no declara autenticación), no como 401.
          if (response.status === 401 || response.status === 403) await clearSession();
          return false;
        }
        await storeTokens(await response.json() as TokenResponse);
        return true;
      } catch {
        return false;
      }
    })().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** Reenviar tras renovar la sesión. Solo para lecturas; el voto nunca se reenvía automáticamente. */
  retryAfterRefresh?: boolean;
}

export async function apiRequest<T>(pathOrUrl: string, { method = "GET", body, retryAfterRefresh = method === "GET" }: RequestOptions = {}): Promise<T> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${apiBase}${pathOrUrl}`;
  const send = () => fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let response: Response;
  try {
    response = await send();
  } catch {
    throw new ApiError(0, NETWORK_ERROR_CODE, "No hay conexión con el servidor.");
  }

  if (response.status === 401) {
    const renewed = await refreshSession();
    if (!renewed) throw new ApiError(401, SESSION_EXPIRED_CODE, "La sesión expiró. Inicia sesión de nuevo.");
    if (!retryAfterRefresh) throw new ApiError(401, MANUAL_RETRY_CODE, "La sesión se renovó. Confirma de nuevo para continuar.");
    try {
      response = await send();
    } catch {
      throw new ApiError(0, NETWORK_ERROR_CODE, "No hay conexión con el servidor.");
    }
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, payload);
  return payload as T;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}/auth/login/`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.replace(/\s+/g, "").toLowerCase(), password, device_label: "App móvil Expo" }),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_CODE, "No hay conexión con el servidor.");
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 429) throw new ApiError(429, "throttled", "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.");
    throw toApiError(response.status, payload);
  }
  const tokens = payload as TokenResponse;
  await storeTokens(tokens);
  return tokens.user;
}

/** Recupera la sesión guardada al abrir la app. */
export async function restoreSession(): Promise<AuthUser | null> {
  if (!(await refreshSession())) return null;
  try {
    return await apiRequest<AuthUser>("/auth/me/");
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    if (accessToken) await apiRequest<void>("/auth/logout/", { method: "POST", retryAfterRefresh: false });
  } catch {
    // La sesión local se borra aunque el servidor no responda.
  } finally {
    await clearSession();
  }
}
