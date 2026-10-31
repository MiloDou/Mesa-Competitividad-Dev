import React, { useState } from "react";
import { LogoIsotype } from "../../../Logo";
import { STATUS_MAP } from "../../../data/public";
import { PublicProject } from "../../../types/public";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import type { PublicProjectRecord } from "../../../api/client";

interface ProjectsArchiveModalProps {
  onClose: () => void;
  initialProject?: any | null;
  projects: PublicProjectRecord[];
}

export function ProjectsArchiveModal({ onClose, initialProject, projects }: ProjectsArchiveModalProps) {
  const [selectedCat, setSelectedCat] = useState<string>("Todas");
  const [selectedStatus, setSelectedStatus] = useState<string>("Todos");
  const [detailProject, setDetailProject] = useState<PublicProject | null>(initialProject || null);

  const projectsList: PublicProject[] = projects.map((project) => {
    const status = ({ active: "En Ejecución", paused: "Pausado", completed: "Completado", draft: "Borrador", archived: "Archivado" } as Record<string, string>)[project.status] || project.status;
    return {
      id: project.code,
      title: project.title,
      cat: project.sector || "Iniciativa pública",
      status,
      pct: project.progress,
      lead: project.responsible_name?.trim() || "No especificado",
      budget: project.budget == null || project.budget === "" ? "No publicado" : `Q ${Number(project.budget).toLocaleString("es-GT")}`,
      date: project.target_date || new Date(project.updated_at).toLocaleDateString("es-GT"),
      color: "#c69a36",
    };
  });

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const categories = ["Todas", "Infraestructura", "Modernización", "Desarrollo Humano", "Inversión", "Medio Ambiente", "Economía Local"];
  const statuses = ["Todos", "En Ejecución", "Planificación", "Completado"];

  const filteredProjects = projectsList.filter(p => {
    const matchCat = selectedCat === "Todas" || p.cat.toLowerCase() === selectedCat.toLowerCase();
    const stLow = (p.status || "").toLowerCase();
    const selLow = selectedStatus.toLowerCase();
    const matchStatus = selectedStatus === "Todos" || 
      stLow === selLow ||
      ((stLow === "activo" || stLow === "en ejecución") && selLow === "en ejecución") ||
      ((stLow === "borrador" || stLow === "revision" || stLow === "revisión" || stLow === "planificación") && selLow === "planificación") ||
      (stLow === "completado" && selLow === "completado");
    return matchCat && matchStatus;
  });

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 modal-backdrop animate-fadeup overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-5xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <LogoIsotype size={40} className="flex-shrink-0" />
            <div>
              <h2 className="text-navy-950 text-xl md:text-2xl font-extrabold tracking-tight">
                Panel Ciudadano de Auditoría — Portafolio Completo
              </h2>
              <p className="text-gold-600 text-xs font-semibold">
                Transparencia de Proyectos · Mesa Departamental de Competitividad de Quetzaltenango
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-navy-950 p-2.5 rounded-xl hover:bg-gray-200/60 transition-colors focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none"
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 md:px-8 py-4 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mr-2 flex-shrink-0">Categoría:</span>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none ${
                  selectedCat === c
                    ? "bg-navy-900 text-white shadow-md font-bold"
                    : "bg-gray-100 text-slate-700 hover:bg-gray-200 hover:text-navy-950 border border-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex-shrink-0">Estado:</span>
            <CustomSelect
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={statuses}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white">
          {detailProject ? (
            /* Detail View */
            <div className="animate-fadeup max-w-3xl mx-auto">
              <button
                onClick={() => setDetailProject(null)}
                className="inline-flex items-center gap-2 text-navy-900 hover:text-gold-600 text-xs font-bold mb-6 hover:-translate-x-1 transition-all focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none rounded-lg p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a la lista de proyectos
              </button>

              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 md:p-8 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{detailProject.cat}</span>
                  <span className="text-xs font-bold text-gold-700" style={{ fontFamily: "var(--font-mono)" }}>
                    ID: {detailProject.id}
                  </span>
                </div>

                <h2 className="text-navy-950 text-2xl font-extrabold mb-6 leading-snug">
                  {detailProject.title}
                </h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-8 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <div>
                    <p className="text-slate-500 text-xs font-medium">Institución Responsable</p>
                    <p className="text-navy-950 font-bold text-sm mt-0.5">{detailProject.lead}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-medium">Presupuesto Estimado</p>
                    <p className="text-gold-700 font-bold text-sm mt-0.5">{detailProject.budget}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-medium">Última Actualización</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{detailProject.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-medium">Estado del Proyecto</p>
                    <p className="text-navy-950 font-bold text-sm mt-0.5">{detailProject.status}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-700 font-semibold">Porcentaje de Avance Físico</span>
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: detailProject.color }}>
                      {detailProject.pct}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden p-0.5 border border-gray-300">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${detailProject.pct}%`, background: detailProject.color }}
                    />
                  </div>
                </div>

                <div className="text-slate-600 text-sm leading-relaxed space-y-3 font-normal border-t border-gray-200 pt-6">
                  <p>
                    <strong>Descripción del expediente:</strong> Este proyecto forma parte del portafolio priorizado de la Mesa Departamental de Competitividad de Quetzaltenango. Su avance es auditado trimestralmente por la comisión técnica correspondiente.
                  </p>
                  <p>
                    Los ciudadanos pueden solicitar copias certificadas de los avances o dictámenes técnicos a través de la sección de Transparencia Institucional.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map(p => {
                const s = (p.status && STATUS_MAP[p.status]) || 
                          (p.status && STATUS_MAP[p.status.toLowerCase()]) || 
                          STATUS_MAP["activo"] || 
                          { bg: "bg-gray-100", text: "text-slate-700", dot: "bg-slate-500", label: "En Ejecución" };
                return (
                  <article
                    key={p.id}
                    onClick={() => setDetailProject(p)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailProject(p);
                      }
                    }}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden group cursor-pointer hover:border-gold-500 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top progress stripe */}
                      <div className="h-1.5 bg-gray-100">
                        <div className="h-full transition-all duration-700" style={{ width: `${p.pct}%`, background: p.color }} />
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{p.cat}</span>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label || p.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-navy-950 text-base leading-snug mb-3 group-hover:text-navy-700 transition-colors line-clamp-2">
                          {p.title}
                        </h3>

                        <dl className="space-y-1 text-xs mb-4">
                          <div className="flex gap-2">
                            <dt className="text-slate-500 w-16 flex-shrink-0 font-medium">Líder:</dt>
                            <dd className="text-slate-800 font-semibold truncate">{p.lead}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="text-slate-500 w-16 flex-shrink-0 font-medium">Monto:</dt>
                            <dd className="text-gold-700 font-bold">{p.budget}</dd>
                          </div>
                        </dl>

                        <div>
                          <div className="flex justify-between items-center mb-1 text-[10px]">
                            <span className="text-slate-500 font-medium">Avance</span>
                            <span className="font-bold" style={{ fontFamily: "var(--font-mono)", color: p.color }}>{p.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-900 group-hover:text-gold-700 flex items-center gap-1 transition-colors">
                        Ver expediente →
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-slate-400 font-bold">{p.id}</span>
                    </div>
                  </article>
                );
              })}
              {filteredProjects.length === 0 && (
                <p className="col-span-full rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-slate-600">
                  No hay proyectos públicos publicados por el momento.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
