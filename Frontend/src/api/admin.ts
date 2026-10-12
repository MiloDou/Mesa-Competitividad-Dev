import { apiRequest, type Page } from "./client";
import type { Project } from "../types/admin";

export interface ProjectRecord {
  id: number;
  code: string;
  title: string;
  summary: string;
  description: string;
  sector: string;
  budget: string | null;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  confidentiality: "public" | "internal" | "temporary_confidential";
  is_public: boolean;
  lead_member: number | null;
  updated_at: string;
}

const statusLabels: Record<ProjectRecord["status"], string> = {
  draft: "borrador", active: "activo", paused: "pausado", completed: "completado", archived: "archivado",
};
const statusValues: Record<string, ProjectRecord["status"]> = {
  borrador: "draft", activo: "active", pausado: "paused", completado: "completed", archivado: "archived",
  revision: "draft",
};

export function projectFromApi(row: ProjectRecord): Project {
  return {
    id: String(row.id), title: row.title, cat: row.sector || "Sin sector",
    status: statusLabels[row.status] || row.status, pct: 0,
    lead: row.lead_member ? `Miembro ${row.lead_member}` : "Sin responsable asignado",
    budget: row.budget ? `Q ${Number(row.budget).toLocaleString("es-GT")}` : "Sin presupuesto registrado",
    updated: new Date(row.updated_at).toLocaleDateString("es-GT"),
    visibility: row.is_public ? "public" : "private", desc: row.description || row.summary,
  };
}

export async function getProjects(): Promise<Project[]> {
  const first = await apiRequest<Page<ProjectRecord> | ProjectRecord[]>("/projects/");
  if (Array.isArray(first)) return first.map(projectFromApi);
  const records = [...first.results];
  const pageSize = first.results.length;
  const pageCount = pageSize ? Math.ceil(first.count / pageSize) : 1;
  for (let page = 2; page <= pageCount; page += 1) {
    const next = await apiRequest<Page<ProjectRecord>>(`/projects/?page=${page}`);
    records.push(...next.results);
  }
  return records.map(projectFromApi);
}

export async function updateProject(id: string, changes: { status?: string; confidentiality?: "public" | "internal" }): Promise<Project> {
  const body: Record<string, string | boolean> = {};
  if (changes.status) body.status = statusValues[changes.status] || "draft";
  if (changes.confidentiality) body.confidentiality = changes.confidentiality;
  const row = await apiRequest<ProjectRecord>(`/projects/${encodeURIComponent(id)}/`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return projectFromApi(row);
}
