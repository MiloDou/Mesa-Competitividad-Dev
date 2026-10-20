import React, { useState } from "react";
import { Project } from "../../../types/admin";
import { PROJECTS, STATUS_CHIP } from "../../../data/admin";
import { PlusIcon, EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from "../../../components/icons/AdminIcons";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { archiveProject, createProject, getProjects, updateProject } from "../../../api/admin";
import { useFeedback } from "../../../components/ui/FeedbackProvider";

interface ProjectsTabProps {
  canEdit: boolean;
  canPublish?: boolean;
  vis: Record<string, "public" | "private">;
  setVis: (id: string, v: "public" | "private") => void;
  onEdit: (p: Project) => void;
  projectList: Project[];
  setProjectList: React.Dispatch<React.SetStateAction<Project[]>>;
  apiConnected?: boolean;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  canEdit,
  canPublish = false,
  vis,
  setVis,
  onEdit,
  projectList,
  setProjectList,
  apiConnected = false,
}) => {
  const { showSuccess, showError, confirm } = useFeedback();
  const [filter, setFilter] = useState("todos");
  const [view, setView] = useState<"list" | "create">("list");
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("Infraestructura");
  const [newLead, setNewLead] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVis, setNewVis] = useState<"public" | "private">("private");
  const [newStatus, setNewStatus] = useState<"activo" | "borrador" | "pausado" | "completado">("activo");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const filtered = projectList.filter((p) => {
    const matchesStatus = filter === "todos" || p.status === filter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cat.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  const hasApiProjectId = (project: Project) => apiConnected && /^\d+$/.test(project.id);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreateError("");
    if (newVis === "public" && newStatus === "borrador") {
      setCreateError("Los borradores no se pueden publicar. Cambia el estado o crea el proyecto como privado.");
      return;
    }
    if (apiConnected) {
      const date = new Date();
      const code = `PRY-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${Date.now().toString().slice(-5)}`;
      try {
        setCreating(true);
        const created = await createProject({
          code,
          title: newTitle.trim(),
          summary: newDesc.trim(),
          description: newDesc.trim(),
          sector: newCat,
          budget: newBudget || null,
          responsible_name: newLead.trim(),
          status: ({ activo: "active", borrador: "draft", pausado: "paused", completado: "completed" } as const)[newStatus],
          confidentiality: newVis === "public" ? "public" : "internal",
          is_public: false,
        });
        let saved = created;
        if (newVis === "public") {
          try {
            saved = await updateProject(created.id, { is_public: true });
          } catch (error) {
            setProjectList((prev) => [created, ...prev]);
            setActionError(`El proyecto se creó, pero no se pudo publicar: ${error instanceof Error ? error.message : "intenta publicar desde su ficha."}`);
            resetForm();
            return;
          }
        }
        setProjectList((prev) => [saved, ...prev]);
        showSuccess(`Proyecto "${saved.title}" creado con éxito.`);
        resetForm();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "No se pudo crear el proyecto en el servidor.";
        setCreateError(msg);
        showError(msg);
      } finally {
        setCreating(false);
      }
      return;
    }
    setCreateError("La API no está disponible. El proyecto no se guardó.");
    showError("La API no está disponible. El proyecto no se guardó.");
  }

  function resetForm() {
    setView("list");
    setNewTitle("");
    setNewLead("");
    setNewBudget("");
    setNewDesc("");
    setNewStatus("activo");
    setNewVis("private");
  }

  async function handleDeleteProject(id: string, title: string) {
    if (!canEdit) return;
    const ok = await confirm({
      title: "Archivar Proyecto",
      message: `¿Deseas archivar el proyecto "${title}" (${id})?\n\nSe ocultará de la lista activa; el registro se conservará de forma segura en el sistema.`,
      confirmText: "Archivar proyecto",
      cancelText: "Cancelar",
      type: "danger",
    });
    if (!ok) return;

    setActionError("");
    try {
      if (!apiConnected) throw new Error("La API no está disponible. El proyecto no se archivó.");
      await archiveProject(id);
      setProjectList((prev) => prev.filter((p) => p.id !== id));
      showSuccess(`El proyecto "${title}" fue archivado exitosamente.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo archivar el proyecto.";
      setActionError(msg);
      showError(msg);
    }
  }

  async function refreshFromApi() {
    setRefreshing(true);
    setActionError("");
    try {
      const projects = await getProjects();
      setProjectList(projects);
      projects.forEach((project) => setVis(project.id, project.visibility));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudieron actualizar los proyectos.");
    } finally {
      setRefreshing(false);
    }
  }

  if (view === "create") {
    return (
    <div className="space-y-4 animate-fadeup max-w-3xl">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Proyectos
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="font-semibold text-navy-900 text-lg">Crear Nuevo Proyecto</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ingrese los detalles iniciales del proyecto en el sistema</p>
          </div>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre del Proyecto *</label>
              <input
                required
                type="text"
                className="input text-sm"
                placeholder="Ej. Modernización del Parque Industrial"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Categoría *</label>
                <CustomSelect
                  value={newCat}
                  onChange={(val) => setNewCat(val)}
                  options={[
                    "Infraestructura",
                    "Modernización",
                    "Desarrollo Humano",
                    "Inversión",
                    "Medio Ambiente",
                    "Economía Local",
                  ]}
                />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre del responsable</label>
                  <input
                  type="text"
                  className="input text-sm"
                  placeholder="Ej. Ing. Carlos Montúfar"
                  value={newLead}
                  onChange={(e) => setNewLead(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Presupuesto Estimado</label>
                <input
                  type={apiConnected ? "number" : "text"}
                  min={apiConnected ? 0 : undefined}
                  step={apiConnected ? "0.01" : undefined}
                  className="input text-sm"
                  placeholder={apiConnected ? "Monto en quetzales" : "Ej. Q 15.0M"}
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estado Inicial *</label>
                <CustomSelect
                  value={newStatus}
                  onChange={(val) => setNewStatus(val as any)}
                  options={[
                    { value: "activo", label: "Activo" },
                    { value: "borrador", label: "Borrador" },
                    { value: "completado", label: "Completado" },
                  ]}
                />
              </div>
              {canPublish && apiConnected && <label className="block text-xs font-semibold text-slate-600">Visibilidad inicial
                <select className="input text-sm" value={newVis} onChange={(event) => setNewVis(event.target.value as "public" | "private")}>
                  <option value="private">Privado · oculto en la página</option>
                  <option value="public">Público · publicar en la página</option>
                </select>
              </label>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descripción corta / Alcance</label>
              <textarea
                rows={4}
                className="input text-sm resize-none"
                placeholder="Objetivos clave y alcance del proyecto..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            {createError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</p>}
            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-sm"
              >
                {creating ? "Guardando…" : "Guardar Proyecto"}
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                disabled={creating}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-5 py-3 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeup">
      <div className={`rounded-lg border px-3 py-2 text-xs ${apiConnected ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
        {apiConnected ? "Proyectos conectados a la API. Crear, editar, publicar y archivar envía los cambios al servidor; el avance se deriva del estado." : "No se pudo conectar con la API. Se muestra una lista de demostración y las acciones de escritura están deshabilitadas."}
      </div>
      {actionError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{actionError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar proyecto, categoría o responsable…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-3.5 py-2 pl-9.5 text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800 shadow-sm"
              style={{ paddingLeft: "2.35rem" }}
              aria-label="Buscar proyectos"
            />
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-x-auto" role="tablist" aria-label="Filtros de estado">
            {["todos", "activo", ...(apiConnected ? ["pausado"] : ["revision"]), "borrador", "completado"].map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none ${
                  filter === f ? "bg-navy-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {apiConnected && <button type="button" onClick={() => void refreshFromApi()} disabled={refreshing} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-800 shadow-sm hover:bg-slate-50 disabled:opacity-60">{refreshing ? "Actualizando…" : "Actualizar desde API"}</button>}
        </div>

        {canEdit && apiConnected && (
          <button
            onClick={() => setView("create")}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Nuevo Proyecto
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="font-semibold text-sm text-navy-950">No se encontraron proyectos</p>
              <p className="text-xs text-slate-400 mt-1">Intente cambiando el término de búsqueda o seleccionando otro filtro.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["ID", "Proyecto", "Responsable", "Estado", "Presupuesto", "Visibilidad", ""].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest ${
                        h === "" ? "w-8" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    tabIndex={hasApiProjectId(p) ? 0 : -1}
                    onKeyDown={(e) => {
                      if (hasApiProjectId(p) && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onEdit(p);
                      }
                    }}
                    className={`hover:bg-slate-50/70 focus-visible:bg-navy-50/70 focus-visible:outline-none transition-colors group ${hasApiProjectId(p) ? "cursor-pointer" : "cursor-default"}`}
                    onClick={() => { if (hasApiProjectId(p)) onEdit(p); }}
                  >
                    <td className="px-4 py-3.5">
                      <span style={{ fontFamily: "var(--font-mono)" }} className="text-[11px] text-slate-400">
                        {p.id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-navy-900 text-[13px] leading-snug max-w-[220px]">{p.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p.cat} · {p.updated}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs hidden md:table-cell">{p.lead}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_CHIP[p.status] || "bg-slate-100 text-slate-700"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 text-xs hidden lg:table-cell">{p.budget}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const isPublic = (vis[p.id] ?? p.visibility) === "public";
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (!canEdit || !hasApiProjectId(p)) return;
                              onEdit(p);
                            }}
                            disabled={!canEdit || !hasApiProjectId(p)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none ${
                              isPublic
                              ? `bg-green-100 text-green-700 ${canEdit && apiConnected ? "hover:bg-green-600 hover:text-white cursor-pointer" : "cursor-default opacity-60"}`
                              : `bg-slate-100 text-slate-700 ${canEdit && apiConnected ? "hover:bg-slate-200 cursor-pointer" : "cursor-default opacity-60"}`
                            }`}
                          >
                            {isPublic ? (
                              <>
                                <EyeIcon className="w-3 h-3" />
                                Público
                              </>
                            ) : (
                              <>
                                <EyeOffIcon className="w-3 h-3" />
                                Privado
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {canEdit && apiConnected && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none"
                            aria-label={`Editar ${p.title}`}
                            title="Editar proyecto"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(p.id, p.title)}
                            className="p-1.5 text-red-700 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
                            aria-label={`Archivar ${p.title}`}
                            title="Archivar proyecto"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsTab;
