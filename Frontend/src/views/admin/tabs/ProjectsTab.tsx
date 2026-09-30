import React, { useState } from "react";
import { Project } from "../../../types/admin";
import { PROJECTS, STATUS_CHIP } from "../../../data/admin";
import { PlusIcon, EyeIcon, EyeOffIcon, PencilIcon } from "../../../components/icons/AdminIcons";
import { CustomSelect } from "../../../components/ui/CustomSelect";

interface ProjectsTabProps {
  canEdit: boolean;
  vis: Record<string, "public" | "private">;
  setVis: (id: string, v: "public" | "private") => void;
  onEdit: (p: Project) => void;
  projectList: Project[];
  setProjectList: React.Dispatch<React.SetStateAction<Project[]>>;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  canEdit,
  vis,
  setVis,
  onEdit,
  projectList,
  setProjectList,
}) => {
  const [filter, setFilter] = useState("todos");
  const [view, setView] = useState<"list" | "create">("list");
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("Infraestructura");
  const [newLead, setNewLead] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVis, setNewVis] = useState<"public" | "private">("public");

  const [searchTerm, setSearchTerm] = useState("");

  const filtered = projectList.filter((p) => {
    const matchesStatus = filter === "todos" || p.status === filter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cat.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newLead.trim()) return;
    const createdProject: Project = {
      id: `PRY-00${projectList.length + 1}`,
      title: newTitle,
      cat: newCat,
      status: "borrador",
      pct: 0,
      lead: newLead,
      budget: newBudget || "Q 0.0M",
      updated: "Hoy",
      visibility: newVis,
      desc: newDesc || "Proyecto recién creado en el sistema administrativo.",
    };
    setProjectList([createdProject, ...projectList]);
    setVis(createdProject.id, newVis);
    setView("list");
    setNewTitle("");
    setNewLead("");
    setNewBudget("");
    setNewDesc("");
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Responsable *</label>
                <input
                  required
                  type="text"
                  className="input text-sm"
                  placeholder="Ej. Ing. Carlos Montúfar"
                  value={newLead}
                  onChange={(e) => setNewLead(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Presupuesto Estimado</label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="Ej. Q 15.0M"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Visibilidad Inicial</label>
                <CustomSelect
                  value={newVis}
                  onChange={(val) => setNewVis(val as "public" | "private")}
                  options={[
                    { value: "public", label: "Público" },
                    { value: "private", label: "Privado (Borrador)" },
                  ]}
                />
              </div>
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
            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-sm"
              >
                Guardar Proyecto
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <input
              type="text"
              placeholder="Buscar proyecto, categoría o responsable…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pl-9 text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800 shadow-sm"
              aria-label="Buscar proyectos"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-x-auto" role="tablist" aria-label="Filtros de estado">
            {["todos", "activo", "revision", "borrador", "completado"].map((f) => (
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
        </div>

        {canEdit && (
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
                  {["ID", "Proyecto", "Responsable", "Estado", "Avance", "Visibilidad", ""].map((h) => (
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
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onEdit(p);
                      }
                    }}
                    className="hover:bg-slate-50/70 focus-visible:bg-navy-50/70 focus-visible:outline-none transition-colors group cursor-pointer"
                    onClick={() => onEdit(p)}
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
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2.5 min-w-[90px]">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.status === "completado" ? "bg-green-500" : "bg-navy-600"}`}
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)" }} className="text-[11px] text-slate-500 w-7 text-right">
                          {p.pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => canEdit && setVis(p.id, (vis[p.id] || p.visibility) === "public" ? "private" : "public")}
                        disabled={!canEdit}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none ${
                          (vis[p.id] || p.visibility) === "public"
                            ? `bg-green-100 text-green-700 ${canEdit ? "hover:bg-green-600 hover:text-white cursor-pointer" : "cursor-default opacity-60"}`
                            : `bg-slate-100 text-slate-500 ${canEdit ? "hover:bg-slate-200 cursor-pointer" : "cursor-default opacity-60"}`
                        }`}
                      >
                        {(vis[p.id] || p.visibility) === "public" ? (
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
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {canEdit && (
                        <button
                          onClick={() => onEdit(p)}
                          className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 p-1.5 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none"
                          aria-label={`Editar ${p.title}`}
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
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
