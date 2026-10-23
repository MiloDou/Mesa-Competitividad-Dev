const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const apiBase = configuredBase || (import.meta.env.DEV ? "http://127.0.0.1:8000/api/v1" : "");
let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshInFlight: Promise<void> | null = null;

function apiUrl(path: string): string {
  if (!apiBase) throw new Error("El sitio no está disponible en este momento. Intenta de nuevo más tarde.");
  return `${apiBase}${path}`;
}

export interface AuthResponse { access: string; refresh: string; token_type: string; expires_in: number; user: { id: number; email: string; display_name: string; roles: Array<{ key: string; name: string }> } }
export function setSessionTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
}

async function refreshSession(): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  const token = refreshToken;
  if (!token) throw new Error("La sesión expiró.");

  refreshInFlight = (async () => {
    const response = await fetch(apiUrl("/auth/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: token }),
    });
    if (!response.ok) throw new Error("La sesión expiró.");
    const tokens = await response.json() as AuthResponse;
    setSessionTokens(tokens.access, tokens.refresh);
  })().catch((error) => {
    setSessionTokens(null, null);
    throw error;
  }).finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export interface Page<T> {
  count: number;
  results: T[];
}

export interface PublicProjectRecord {
  id: number;
  code: string;
  title: string;
  summary: string;
  description: string;
  sector: string;
  budget: string | number | null;
  responsible_name: string;
  status: string;
  progress: number;
  target_date: string | null;
  updated_at: string;
  follow_up_topics: Array<{ title: string; description: string; progress: string }>;
}

export interface PublicPublicationRecord {
  id: number;
  title: string;
  slug: string;
  summary: string;
  body: string;
  section: string;
  published_at: string | null;
}
export interface PublicEventRecord { id: number; title: string; slug: string; description: string; starts_at: string; ends_at: string | null; modality: string; location: string; capacity: number | null; registration_required: boolean; }
export interface PublicSiteProfileRecord { name: string; summary: string; mission: string; vision: string; objectives: string[]; represented_sectors: string[]; work_framework: string; updated_at: string; }

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const send = () => fetch(apiUrl(path), {
    ...init,
    headers: { Accept: "application/json", ...(accessToken && !path.startsWith("/public/") ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers },
  });
  let response = await send();
  if (response.status === 401 && refreshToken && !path.startsWith("/auth/")) {
    try {
      await refreshSession();
      response = await send();
    } catch {
      setSessionTokens(null, null);
      throw new Error("La sesión expiró. Inicia sesión de nuevo.");
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const errorDetail = body?.error?.detail;
    const firstFieldError = errorDetail && typeof errorDetail === "object" ? Object.values(errorDetail)[0] : null;
    const detail = (typeof errorDetail === "string" ? errorDetail : errorDetail?.detail || (Array.isArray(firstFieldError) ? firstFieldError[0] : firstFieldError)) || body?.detail || "No se pudo completar la solicitud.";
    throw new Error(typeof detail === "string" ? detail : "Revisa los datos e intenta de nuevo.");
  }
  return response;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function fetchAllPages<T>(path: string): Promise<T[]> {
  const records: T[] = [];
  let next: string | null = apiUrl(path);
  while (next) {
    const response: Response = await fetch(next, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("No se pudo cargar el contenido público.");
    const page = await response.json() as Page<T>;
    records.push(...page.results);
    next = (page as Page<T> & { next: string | null }).next;
  }
  return records;
}

export function apiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!apiBase) return path;
  return `${apiBase.replace(/\/api\/v1$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
