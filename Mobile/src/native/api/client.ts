import type { DocumentItem, Initiative, Meeting, Notice, Proposal } from "../types";

const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

export interface MobileSession {
  access: string;
  refresh: string;
  user: { id: number; email: string; display_name: string; roles: Array<{ key: string; name: string }> };
}

type Page<T> = { count: number; next: string | null; results: T[] };
type ApiRecord = Record<string, any>;
let session: MobileSession | null = null;

export function setMobileSession(value: MobileSession | null) { session = value; }
export function getMobileSession() { return session; }

async function errorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  const detail = body?.error?.detail ?? body?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const first = Object.values(detail)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return response.status === 401 ? "La sesión expiró. Inicia sesión de nuevo." : "No fue posible completar la solicitud.";
}

async function rawRequest<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  const isCredentialRequest = path === "/auth/login/" || path === "/auth/refresh/";
  const send = (access?: string) => fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(access && !isCredentialRequest ? { Authorization: `Bearer ${access}` } : {}),
      ...init.headers,
    },
  });
  let response = await send(session?.access);
  if (response.status === 401 && allowRefresh && session?.refresh && !isCredentialRequest) {
    try {
      const refreshed = await rawRequest<MobileSession>("/auth/refresh/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: session.refresh }),
      }, false);
      session = refreshed;
      response = await send(session.access);
    } catch {
      session = null;
      throw new Error("La sesión expiró. Inicia sesión de nuevo.");
    }
  }
  if (!response.ok) throw new Error(await errorMessage(response));
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function login(email: string, password: string): Promise<MobileSession> {
  const result = await rawRequest<MobileSession>("/auth/login/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, device_label: "Mesa móvil" }),
  }, false);
  setMobileSession(result);
  return result;
}

export async function logout(): Promise<void> {
  try { if (session) await rawRequest<void>("/auth/logout/", { method: "POST" }); }
  finally { session = null; }
}

async function list<T>(path: string): Promise<T[]> {
  const page = await rawRequest<Page<T> | T[]>(path);
  return Array.isArray(page) ? page : page.results;
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const rows = await list<ApiRecord>("/meetings/");
  return rows.map((row) => {
    const date = new Date(row.scheduled_at);
    return {
      id: String(row.id), title: row.title,
      date: date.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }),
      time: date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }),
      place: row.location || row.meeting_link || "Lugar por confirmar",
      mode: ({ in_person: "Presencial", virtual: "Virtual", hybrid: "Híbrida" } as Record<string, string>)[row.modality] || row.modality,
      agenda: Array.isArray(row.agenda) ? row.agenda : [],
    };
  });
}

export async function fetchInitiatives(): Promise<Initiative[]> {
  const rows = await list<ApiRecord>("/projects/");
  return rows.map((row) => ({
    id: String(row.id), area: row.sector || "Iniciativa",
    title: row.title, summary: row.summary || row.description || "Sin resumen disponible.",
    description: row.description || row.summary || "Sin descripción disponible.",
  }));
}

export async function fetchVotings(): Promise<Proposal[]> {
  const rows = await list<ApiRecord>("/votings/");
  return rows.filter((row) => row.status === "open" || row.status === "closed").map((row) => ({
    id: String(row.id), title: row.subject?.title || "Votación de la Mesa",
    summary: row.subject?.summary || "Consulta la propuesta antes de participar.",
    deadline: row.closes_at ? new Date(row.closes_at).toLocaleString("es-GT") : "Sin fecha de cierre",
    status: row.status === "closed" ? "cerrada" as const : "abierta" as const,
    options: Array.isArray(row.options) ? row.options : [],
    memberHasVoted: Boolean(row.member_has_voted),
    rawStatus: row.status,
  }));
}

export async function castVote(votingId: string, option: string, clientRequestId: string): Promise<void> {
  await rawRequest<void>(`/votings/${encodeURIComponent(votingId)}/cast/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ option, client_request_id: clientRequestId }),
  });
}

export function createRequestId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export async function fetchResults(votingId: string): Promise<{ total_votes: number; results: Record<string, number>; percentages: Record<string, number> }> {
  return rawRequest(`/votings/${encodeURIComponent(votingId)}/results/`);
}

export async function fetchNotifications(): Promise<Notice[]> {
  const rows = await list<ApiRecord>("/notifications/");
  return rows.map((row) => ({
    id: String(row.id), kind: row.kind || "Aviso", title: row.title,
    detail: row.read_at ? "Leído" : "Pendiente de lectura", body: row.body || "",
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await rawRequest<void>(`/notifications/${encodeURIComponent(id)}/mark_read/`, { method: "POST" });
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const rows = await list<ApiRecord>("/documents/");
  return rows.map((row) => ({
    id: String(row.id), kind: row.minute ? "Minuta" : "Iniciativa", title: row.title,
    detail: row.original_name || "Archivo disponible con permisos", preview: row.description || row.title,
  }));
}

export async function fetchPublicInitiatives(): Promise<Initiative[]> {
  const rows = await list<ApiRecord>("/public/projects/");
  return rows.map((row) => ({
    id: String(row.id), area: row.sector || "Iniciativa pública", title: row.title,
    summary: row.summary || row.description || "Consulta el detalle de esta iniciativa.",
    description: row.description || row.summary || "Sin descripción publicada.",
  }));
}
