const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const apiBase = configuredBase || "http://127.0.0.1:8000/api/v1";
let accessToken: string | null = null;

export interface AuthResponse { access: string; refresh: string; token_type: string; expires_in: number; user: { id: number; email: string; display_name: string; roles: Array<{ key: string; name: string }> } }
export function setAccessToken(token: string | null) { accessToken = token; }

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
  status: string;
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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const send = () => fetch(`${apiBase}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(accessToken && !path.startsWith("/public/") ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers },
  });
  let response = await send();
  const refreshToken = sessionStorage.getItem("mesa_refresh");
  if (response.status === 401 && refreshToken && !path.startsWith("/auth/")) {
    try {
      const refreshed = await fetch(`${apiBase}/auth/refresh/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: refreshToken }) });
      if (!refreshed.ok) throw new Error("La sesión expiró.");
      const tokens = await refreshed.json() as AuthResponse;
      setAccessToken(tokens.access);
      sessionStorage.setItem("mesa_access", tokens.access);
      sessionStorage.setItem("mesa_refresh", tokens.refresh);
      response = await send();
    } catch {
      setAccessToken(null);
      sessionStorage.removeItem("mesa_access");
      sessionStorage.removeItem("mesa_refresh");
      throw new Error("La sesión expiró. Inicia sesión de nuevo.");
    }
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const errorDetail = body?.error?.detail;
    const firstFieldError = errorDetail && typeof errorDetail === "object" ? Object.values(errorDetail)[0] : null;
    const detail = (typeof errorDetail === "string" ? errorDetail : errorDetail?.detail || (Array.isArray(firstFieldError) ? firstFieldError[0] : firstFieldError)) || body?.detail || "No se pudo completar la solicitud.";
    throw new Error(typeof detail === "string" ? detail : "Revisa los datos e intenta de nuevo.");
  }
  return body as T;
}

export async function fetchAllPages<T>(path: string): Promise<T[]> {
  const records: T[] = [];
  let next: string | null = `${apiBase}${path}`;
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
  return `${apiBase.replace(/\/api\/v1$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
