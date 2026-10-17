import { apiFetch, apiRequest, type Page } from "./client";
import type { Project } from "../types/admin";

export interface ProjectRecord {
  id: number;
  code: string;
  title: string;
  summary: string;
  description: string;
  sector: string;
  budget: string | null;
  progress: number;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  confidentiality: "public" | "internal" | "temporary_confidential";
  is_public: boolean;
  responsible_name: string;
  starts_at: string | null;
  target_date: string | null;
  updated_at: string;
}

const statusLabels: Record<ProjectRecord["status"], string> = {
  draft: "borrador", active: "activo", paused: "pausado", completed: "completado", archived: "archivado",
};

function assertProjectId(id: string): void {
  if (!/^\d+$/.test(id)) throw new Error("El proyecto no tiene un ID válido de la API. Actualiza la lista e inténtalo de nuevo.");
}

export function projectFromApi(row: ProjectRecord): Project {
  return {
    id: String(row.id), title: row.title, cat: row.sector || "Sin sector",
    status: statusLabels[row.status] || row.status, pct: row.progress,
    lead: row.responsible_name || "Sin responsable asignado",
    budget: row.budget ? `Q ${Number(row.budget).toLocaleString("es-GT")}` : "Sin presupuesto registrado",
    updated: new Date(row.updated_at).toLocaleDateString("es-GT"),
    visibility: row.is_public ? "public" : "private", desc: row.description || row.summary,
    code: row.code, summary: row.summary, budgetAmount: row.budget,
    responsibleName: row.responsible_name, startsAt: row.starts_at, targetDate: row.target_date,
    confidentiality: row.confidentiality,
  };
}

async function getAllPages<T>(path: string): Promise<T[]> {
  const records: T[] = [];
  let page = 1;
  let count = Infinity;
  while (records.length < count) {
    const response = await apiRequest<Page<T> | T[]>(`${path}?page=${page}`);
    if (Array.isArray(response)) return response;
    records.push(...response.results);
    count = response.count;
    if (!response.results.length) break;
    page += 1;
  }
  return records;
}

export async function getProjects(): Promise<Project[]> {
  return (await getAllPages<ProjectRecord>("/projects/")).map(projectFromApi);
}

export interface ProjectInput {
  code?: string;
  title: string;
  summary?: string;
  description?: string;
  sector?: string;
  budget?: string | null;
  progress?: number;
  status?: ProjectRecord["status"];
  confidentiality?: ProjectRecord["confidentiality"];
  is_public?: boolean;
  responsible_name?: string;
  starts_at?: string | null;
  target_date?: string | null;
}

export async function createProject(input: ProjectInput & { code: string }): Promise<Project> {
  const row = await apiRequest<ProjectRecord>("/projects/", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  return projectFromApi(row);
}

export async function updateProject(id: string, changes: Partial<ProjectInput>): Promise<Project> {
  assertProjectId(id);
  const { is_public: shouldPublish, ...fields } = changes;
  const body = shouldPublish === false ? { ...fields, is_public: false } : fields;
  const row = await apiRequest<ProjectRecord>(`/projects/${encodeURIComponent(id)}/`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (shouldPublish === true && !row.is_public) {
    const published = await apiRequest<ProjectRecord>(`/projects/${encodeURIComponent(id)}/publish/`, { method: "POST" });
    return projectFromApi(published);
  }
  return projectFromApi(row);
}

export async function archiveProject(id: string): Promise<void> {
  assertProjectId(id);
  await apiRequest<void>(`/projects/${encodeURIComponent(id)}/`, { method: "DELETE" });
}

export interface ProjectDocument {
  id: number;
  project: number | null;
  minute: number | null;
  title: string;
  description: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  confidentiality: "public" | "internal" | "temporary_confidential";
  uploaded_at: string;
}

export interface MinuteReference { id: number; meeting: number; status: string; }

export async function getDocuments(): Promise<ProjectDocument[]> {
  return getAllPages<ProjectDocument>("/documents/");
}

export async function getMinutes(): Promise<MinuteReference[]> {
  return getAllPages<MinuteReference>("/minutes/");
}

export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const rows = await getDocuments();
  return rows.filter((row) => row.project === Number(projectId));
}

export async function uploadProjectDocument(projectId: string, title: string, file: File, description = ""): Promise<ProjectDocument> {
  return uploadDocument({ projectId, title, file, description });
}

export async function uploadDocument(input: { projectId?: string; minuteId?: string; title: string; file: File; description?: string }): Promise<ProjectDocument> {
  const body = new FormData();
  if (input.projectId) body.set("project", input.projectId);
  if (input.minuteId) body.set("minute", input.minuteId);
  body.set("title", input.title);
  body.set("description", input.description || "");
  body.set("file", input.file);
  return apiRequest<ProjectDocument>("/documents/", { method: "POST", body });
}

export async function archiveDocument(id: number): Promise<void> {
  await apiRequest<void>(`/documents/${id}/`, { method: "DELETE" });
}

export async function updateDocument(id: number, changes: Pick<ProjectDocument, "title" | "description">): Promise<ProjectDocument> {
  return apiRequest<ProjectDocument>(`/documents/${id}/`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes),
  });
}

export async function downloadDocument(record: ProjectDocument): Promise<void> {
  const response = await apiFetch(`/documents/${record.id}/download/`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = record.original_name || record.title;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
