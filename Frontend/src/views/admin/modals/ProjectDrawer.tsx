import React, { useEffect, useState } from "react";
import type { Project } from "../../../types/admin";
import { STATUS_CHIP } from "../../../data/admin";
import { archiveDocument, downloadDocument, getProjectDocuments, type ProjectDocument, updateDocument, uploadProjectDocument } from "../../../api/admin";
import { EyeIcon, EyeOffIcon, TrashIcon } from "../../../components/icons/AdminIcons";
import { useFeedback } from "../../../components/ui/FeedbackProvider";

type ProjectChanges = {
  title: string;
  summary: string;
  description: string;
  sector: string;
  budget: string | null;
  progress: number;
  responsible_name: string;
  starts_at: string | null;
  target_date: string | null;
  status: "draft" | "active" | "paused" | "completed";
  confidentiality: "public" | "internal";
  is_public: boolean;
};

interface ProjectDrawerProps {
  project: Project;
  onClose: () => void;
  canEdit: boolean;
  canPublish?: boolean;
  apiConnected?: boolean;
  onSave?: (id: string, changes: ProjectChanges) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}

const statusValues: Record<string, ProjectChanges["status"]> = {
  activo: "active", pausado: "paused", borrador: "draft", completado: "completed",
};
export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({ project, onClose, canEdit, canPublish = false, apiConnected = false, onSave, onDelete }) => {
  const { showSuccess, showError, confirm } = useFeedback();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.desc || "");
  const [sector, setSector] = useState(project.cat === "Sin sector" ? "" : project.cat);
  const [budget, setBudget] = useState(project.budgetAmount || "");
  const [progress, setProgress] = useState(project.pct);
  const [responsibleName, setResponsibleName] = useState(project.responsibleName || (
    project.lead === "Sin responsable asignado" || /^Miembro #\d+$/.test(project.lead) ? "" : project.lead
  ));
  const [startsAt, setStartsAt] = useState(project.startsAt || "");
  const [targetDate, setTargetDate] = useState(project.targetDate || "");
  const [status, setStatus] = useState(project.status);
  const [visibility, setVisibility] = useState(project.visibility || "private");
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentDescription, setDocumentDescription] = useState("");
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null);
  const [editingDocumentTitle, setEditingDocumentTitle] = useState("");
  const [editingDocumentDescription, setEditingDocumentDescription] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function refreshDocuments() {
    setLoadingDocuments(true);
    try {
      setDocuments(await getProjectDocuments(project.id));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudieron cargar los documentos.");
    } finally {
      setLoadingDocuments(false);
    }
  }

  useEffect(() => {
    if (apiConnected) void refreshDocuments();
  }, [apiConnected, project.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const apiStatus = statusValues[status] || "draft";
      await onSave?.(project.id, {
        title: title.trim(), summary: description.trim(), description: description.trim(), sector: sector.trim(),
        budget: budget || null, progress, responsible_name: responsibleName.trim(),
        starts_at: startsAt || null, target_date: targetDate || null, status: apiStatus,
        confidentiality: visibility === "public" ? "public" : "internal", is_public: visibility === "public",
      });
      setSaved(true);
      window.setTimeout(onClose, 700);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  }

  async function upload() {
    if (!documentFile || !documentTitle.trim()) return;
    setUploading(true);
    setSaveError("");
    try {
      const savedDocument = await uploadProjectDocument(project.id, documentTitle.trim(), documentFile, documentDescription.trim());
      setDocuments((current) => [savedDocument, ...current]);
      setDocumentTitle("");
      setDocumentDescription("");
      setDocumentFile(null);
      const input = window.document.getElementById(`project-document-file-${project.id}`) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo cargar el documento.");
    } finally {
      setUploading(false);
    }
  }

  async function removeDocument(record: ProjectDocument) {
    const ok = await confirm({
      title: "Archivar Documento",
      message: `¿Archivar el documento “${record.title}”?\n\nEl documento se ocultará de la ficha del proyecto y quedará archivado en el servidor.`,
      confirmText: "Archivar documento",
      cancelText: "Cancelar",
      type: "danger",
    });
    if (!ok) return;

    setSaveError("");
    try {
      await archiveDocument(record.id);
      setDocuments((current) => current.filter((item) => item.id !== record.id));
      showSuccess(`Documento “${record.title}” archivado con éxito.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo archivar el documento.";
      setSaveError(msg);
      showError(msg);
    }
  }

  async function saveDocumentMetadata(record: ProjectDocument) {
    setSaveError("");
    try {
      const savedDocument = await updateDocument(record.id, { title: editingDocumentTitle.trim(), description: editingDocumentDescription.trim() });
      setDocuments((current) => current.map((item) => item.id === record.id ? savedDocument : item));
      setEditingDocumentId(null);
      showSuccess(`Metadatos del documento “${savedDocument.title}” actualizados.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudieron guardar los datos del documento.";
      setSaveError(msg);
      showError(msg);
    }
  }

  async function archive() {
    const ok = await confirm({
      title: "Archivar Proyecto",
      message: `¿Archivar el proyecto “${project.title}”?\n\nEl registro se conservará de forma segura en el sistema.`,
      confirmText: "Sí, archivar proyecto",
      cancelText: "Cancelar",
      type: "danger",
    });
    if (!ok) return;

    setSaving(true);
    setSaveError("");
    try {
      await onDelete?.(project.id);
      showSuccess(`Proyecto “${project.title}” archivado con éxito.`);
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo archivar el proyecto.";
      setSaveError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <section className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" aria-labelledby="project-drawer-title">
        <header className="flex items-start justify-between border-b border-slate-200 bg-navy-50 px-6 py-5">
          <div>
            <span className="text-[11px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>{project.code || project.id}</span>
            <h2 id="project-drawer-title" className="mt-1 text-base font-semibold leading-snug text-navy-900">{project.title}</h2>
            <p className="mt-0.5 text-xs text-slate-600">{project.cat} · Actualizado {project.updated}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {saveError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</p>}
          {saved ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Cambios guardados.</p> : (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-navy-900">Datos del proyecto</h3>
                <label className="block text-xs font-semibold text-slate-600">Nombre<input className="input mt-1 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} disabled={!canEdit} /></label>
                <label className="block text-xs font-semibold text-slate-600">Descripción<textarea rows={3} className="input mt-1 resize-y text-sm" value={description} onChange={(event) => setDescription(event.target.value)} disabled={!canEdit} /></label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-600">Sector<input className="input mt-1 text-sm" value={sector} onChange={(event) => setSector(event.target.value)} disabled={!canEdit} /></label>
                  <label className="block text-xs font-semibold text-slate-600">Presupuesto (Q)<input type="number" min="0" step="0.01" className="input mt-1 text-sm" value={budget} onChange={(event) => setBudget(event.target.value)} disabled={!canEdit} /></label>
                  <label className="block text-xs font-semibold text-slate-600">Nombre del responsable<input type="text" className="input mt-1 text-sm" value={responsibleName} onChange={(event) => setResponsibleName(event.target.value)} disabled={!canEdit} /></label>
                  {apiConnected && <>
                    <label className="block text-xs font-semibold text-slate-600">Fecha de inicio<input type="date" className="input mt-1 text-sm" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} disabled={!canEdit} /></label>
                    <label className="block text-xs font-semibold text-slate-600">Fecha objetivo<input type="date" className="input mt-1 text-sm" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} disabled={!canEdit} /></label>
                  </>}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600">Estado</p>
                  <div className="flex flex-wrap gap-2">
                    {(["activo", "pausado", "borrador", "completado"] as const).map((value) => (
                      <button type="button" key={value} onClick={() => canEdit && setStatus(value)} disabled={!canEdit} aria-pressed={status === value} className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${status === value ? `${STATUS_CHIP[value]} border-current` : "border-slate-200 text-slate-600 hover:border-slate-400"} disabled:cursor-not-allowed disabled:opacity-60`}>{value}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="project-progress" className="text-xs font-semibold text-slate-600">Porcentaje de avance</label>
                    <output htmlFor="project-progress" className="text-sm font-bold text-navy-800">{progress}%</output>
                  </div>
                  <input id="project-progress" aria-label="Porcentaje de avance del proyecto" type="range" min={0} max={100} step={1} value={progress} onChange={(event) => setProgress(Number(event.target.value))} disabled={!canEdit} className="h-2 w-full cursor-pointer accent-navy-700 disabled:cursor-not-allowed disabled:opacity-60" />
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div className="h-full rounded-full bg-navy-600 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600">Visibilidad pública</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => canPublish && setVisibility("public")} disabled={!canPublish || status === "borrador"} aria-pressed={visibility === "public"} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${visibility === "public" ? "border-green-300 bg-green-100 text-green-800" : "border-slate-200 text-slate-600 hover:border-slate-400"} disabled:cursor-not-allowed disabled:opacity-60`}><EyeIcon className="h-3.5 w-3.5" />Publicar en el portal</button>
                    <button type="button" onClick={() => canPublish && setVisibility("private")} disabled={!canPublish} aria-pressed={visibility === "private"} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${visibility === "private" ? "border-slate-400 bg-slate-200 text-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"} disabled:cursor-not-allowed disabled:opacity-60`}><EyeOffIcon className="h-3.5 w-3.5" />Mantener interno</button>
                  </div>
                  {status === "borrador" && <p className="mt-1 text-xs text-slate-600">Activa el proyecto antes de publicarlo.</p>}
                </div>
              </section>

              {apiConnected && <section className="space-y-3 border-t border-slate-200 pt-5">
                <div><h3 className="text-sm font-semibold text-navy-900">Documentos del proyecto</h3><p className="text-xs text-slate-600">Los archivos quedan protegidos y solo pueden consultarlos personas autorizadas.</p></div>
                {canEdit && <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="block text-xs font-semibold text-slate-600">Título<input className="input mt-1 text-sm" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} /></label>
                  <label className="block text-xs font-semibold text-slate-600">Descripción<input className="input mt-1 text-sm" value={documentDescription} onChange={(event) => setDocumentDescription(event.target.value)} /></label>
                  <input id={`project-document-file-${project.id}`} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} className="block w-full text-xs text-slate-700" />
                  <button type="button" onClick={upload} disabled={uploading || !documentTitle.trim() || !documentFile} className="rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50">{uploading ? "Cargando…" : "Cargar documento"}</button>
                </div>}
                {loadingDocuments ? <p className="text-xs text-slate-600">Cargando documentos…</p> : documents.length ? <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {documents.map((record) => <li key={record.id} className="flex flex-wrap items-center gap-3 p-3">
                    {editingDocumentId === record.id ? <div className="min-w-0 flex-1 space-y-1.5">
                      <input className="input text-sm" aria-label="Título del documento" value={editingDocumentTitle} onChange={(event) => setEditingDocumentTitle(event.target.value)} />
                      <input className="input text-xs" aria-label="Descripción del documento" value={editingDocumentDescription} onChange={(event) => setEditingDocumentDescription(event.target.value)} />
                    </div> : <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-navy-900">{record.title}</p><p className="truncate text-xs text-slate-600">{record.original_name} · {new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 }).format(record.size_bytes / 1024)} KB</p></div>}
                    {editingDocumentId === record.id ? <>
                      <button type="button" onClick={() => void saveDocumentMetadata(record)} disabled={!editingDocumentTitle.trim()} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-navy-800 disabled:opacity-50">Guardar</button>
                      <button type="button" onClick={() => setEditingDocumentId(null)} className="text-xs font-semibold text-slate-600">Cancelar</button>
                    </> : <>
                      <button type="button" onClick={() => void downloadDocument(record).catch((error: unknown) => setSaveError(error instanceof Error ? error.message : "No se pudo descargar el documento."))} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-navy-800 hover:bg-slate-50">Descargar</button>
                      {canEdit && <button type="button" onClick={() => { setEditingDocumentId(record.id); setEditingDocumentTitle(record.title); setEditingDocumentDescription(record.description); }} className="text-xs font-semibold text-navy-800">Editar</button>}
                      {canEdit && <button type="button" onClick={() => void removeDocument(record)} aria-label={`Archivar ${record.title}`} className="rounded-md p-1.5 text-red-700 hover:bg-red-50 hover:text-red-800"><TrashIcon className="h-4 w-4" /></button>}
                    </>}
                  </li>)}
                </ul> : <p className="text-xs text-slate-600">No hay documentos asociados.</p>}
                <button type="button" onClick={() => void refreshDocuments()} className="text-xs font-semibold text-navy-800 underline">Actualizar documentos</button>
              </section>}
            </>
          )}
        </div>
        {!saved && canEdit && <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <button type="button" onClick={archive} disabled={saving} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" title="Archivar proyecto"><TrashIcon className="h-4 w-4" />Archivar</button>
          <div className="ml-auto flex items-center gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Cancelar</button><button type="button" onClick={save} disabled={saving || !title.trim()} className="rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-navy-800 disabled:opacity-60">{saving ? "Guardando…" : "Guardar cambios"}</button></div>
        </footer>}
      </section>
    </div>
  );
};

export default ProjectDrawer;
