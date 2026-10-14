import React, { useCallback, useEffect, useState } from "react";
import { archiveDocument, downloadDocument, getDocuments, getMinutes, type MinuteReference, type ProjectDocument, updateDocument, uploadDocument } from "../../../api/admin";
import type { Project } from "../../../types/admin";

interface DocumentsTabProps {
  canEdit: boolean;
  apiConnected: boolean;
  projects: Project[];
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ canEdit, apiConnected, projects }) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [minutes, setMinutes] = useState<MinuteReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [parentType, setParentType] = useState<"project" | "minute">("project");
  const [parentId, setParentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const [documentResult, minuteResult] = await Promise.allSettled([getDocuments(), getMinutes()]);
    if (documentResult.status === "fulfilled") setDocuments(documentResult.value);
    else setError(documentResult.reason instanceof Error ? documentResult.reason.message : "No se pudieron cargar los documentos.");
    if (minuteResult.status === "fulfilled") setMinutes(minuteResult.value);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function saveMetadata(record: ProjectDocument) {
    setError("");
    try {
      const saved = await updateDocument(record.id, { title: editingTitle.trim(), description: editingDescription.trim() });
      setDocuments((current) => current.map((item) => item.id === record.id ? saved : item));
      setEditingId(null);
      setNotice("Se guardaron los cambios del documento.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron guardar los cambios.");
    }
  }

  async function upload() {
    if (!parentId || !title.trim() || !file) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = await uploadDocument({
        projectId: parentType === "project" ? parentId : undefined,
        minuteId: parentType === "minute" ? parentId : undefined,
        title: title.trim(), description: description.trim(), file,
      });
      setDocuments((current) => [saved, ...current]);
      setTitle("");
      setDescription("");
      setFile(null);
      const input = window.document.getElementById("document-manager-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setNotice("El documento se cargó en el servidor.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cargar el documento.");
    } finally {
      setBusy(false);
    }
  }

  async function archive(record: ProjectDocument) {
    if (!window.confirm(`¿Archivar el documento “${record.title}”?`)) return;
    setError("");
    try {
      await archiveDocument(record.id);
      setDocuments((current) => current.filter((item) => item.id !== record.id));
      setNotice("El documento quedó archivado en el servidor.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo archivar el documento.");
    }
  }

  const availableProjects = apiConnected ? projects.filter((project) => /^\d+$/.test(project.id)) : [];
  const options = parentType === "project" ? availableProjects.map((project) => ({ id: project.id, name: `${project.title} (#${project.id})` })) : minutes.map((minute) => ({ id: String(minute.id), name: `Minuta #${minute.id} · reunión #${minute.meeting} · ${minute.status}` }));

  return (
    <div className="space-y-5 animate-fadeup">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-navy-900">Documentos</h2><p className="text-xs text-slate-600">Archivos asociados a proyectos o minutas. La API controla el acceso y la descarga.</p></div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-800 shadow-sm hover:bg-slate-50 disabled:opacity-60">{loading ? "Actualizando…" : "Actualizar"}</button>
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</p>}

      {canEdit && <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-navy-900">Cargar un documento</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Vincular a
            <select className="input mt-1 text-sm" value={parentType} onChange={(event) => { setParentType(event.target.value as "project" | "minute"); setParentId(""); }}><option value="project">Proyecto</option><option value="minute">Minuta</option></select>
          </label>
          <label className="text-xs font-semibold text-slate-600">{parentType === "project" ? "Proyecto" : "Minuta"}
            <select className="input mt-1 text-sm" value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">Selecciona un registro</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Título
            <input className="input mt-1 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={220} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Descripción
            <input className="input mt-1 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3"><input id="document-manager-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block min-w-0 flex-1 text-xs text-slate-700" /><button type="button" onClick={() => void upload()} disabled={busy || !parentId || !title.trim() || !file} className="rounded-lg bg-navy-900 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50">{busy ? "Cargando…" : "Cargar"}</button></div>
        {!options.length && <p className="text-xs text-slate-600">No hay registros disponibles para este tipo. Si la API deniega la operación, se mostrará su respuesta.</p>}
      </section>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-8 text-center text-sm text-slate-600">Cargando documentos…</p> : !documents.length ? <p className="p-8 text-center text-sm text-slate-600">No hay documentos disponibles para esta cuenta.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50">{["Documento", "Vinculado a", "Clasificación", "Tamaño", "Acciones"].map((heading) => <th key={heading} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{documents.map((record) => <tr key={record.id}>
            <td className="min-w-[230px] px-4 py-3">
              {editingId === record.id ? <div className="space-y-1.5"><input className="input text-sm" value={editingTitle} aria-label="Título" onChange={(event) => setEditingTitle(event.target.value)} /><input className="input text-xs" value={editingDescription} aria-label="Descripción" onChange={(event) => setEditingDescription(event.target.value)} /></div> : <><p className="font-semibold text-navy-900">{record.title}</p><p className="text-xs text-slate-600">{record.original_name || "Sin nombre de archivo"}</p>{record.description && <p className="text-xs text-slate-600">{record.description}</p>}</>}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">{record.project ? `Proyecto #${record.project}` : `Minuta #${record.minute}`}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">{record.confidentiality === "temporary_confidential" ? "Confidencial temporal" : record.confidentiality === "public" ? "Público" : "Interno"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">{new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 }).format(record.size_bytes / 1024)} KB</td>
            <td className="whitespace-nowrap px-4 py-3"><div className="flex items-center gap-2">
              {editingId === record.id ? <><button type="button" onClick={() => void saveMetadata(record)} disabled={!editingTitle.trim()} className="text-xs font-semibold text-navy-800 disabled:opacity-50">Guardar</button><button type="button" onClick={() => setEditingId(null)} className="text-xs font-semibold text-slate-600">Cancelar</button></> : <>
                <button type="button" onClick={() => void downloadDocument(record).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "No se pudo descargar el documento."))} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-navy-800 hover:bg-slate-50">Descargar</button>
                {canEdit && <><button type="button" onClick={() => { setEditingId(record.id); setEditingTitle(record.title); setEditingDescription(record.description); }} className="text-xs font-semibold text-navy-800">Editar</button><button type="button" onClick={() => void archive(record)} className="text-xs font-semibold text-red-700">Archivar</button></>}
              </>}
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      </section>
    </div>
  );
};
