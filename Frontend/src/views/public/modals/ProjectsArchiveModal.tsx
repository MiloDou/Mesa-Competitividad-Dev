import React, { useState } from "react";
import { LogoIsotype } from "../../../Logo";
import { PUBLIC_PROJECTS, STATUS_MAP } from "../../../data/public";
import { PublicProject } from "../../../types/public";
import { CustomSelect } from "../../../components/ui/CustomSelect";

export const ALL_PUBLIC_PROJECTS: PublicProject[] = [
  ...PUBLIC_PROJECTS,
  { id: "PRY-007", title: "Centro de Innovación y Tecnología de Occidente", cat: "Modernización", status: "Planificación", pct: 15, lead: "CUNOC / Agexport", budget: "Q 18.5M", date: "Sep 2026", color: "#D97706" },
  { id: "PRY-008", title: "Programa de Fortalecimiento a Pymes Exportadoras", cat: "Inversión", status: "En Ejecución", pct: 75, lead: "MINECO / Agexport", budget: "Q 5.4M", date: "Ago 2026", color: "#1A4280" },
  { id: "PRY-009", title: "Mejoramiento del Alumbrado Solar en Vías Principales", cat: "Infraestructura", status: "Completado", pct: 100, lead: "Muni Xela", budget: "Q 4.2M", date: "Jun 2026", color: "#15803D" },
  { id: "PRY-010", title: "Certificación de Competencias Laborales para Turismo", cat: "Desarrollo Humano", status: "En Ejecución", pct: 50, lead: "INGUAT / INTECAP", budget: "Q 2.8M", date: "Sep 2026", color: "#1A4280" },
  { id: "PRY-011", title: "Sistema de Alerta Temprana e Infraestructura Resiliente", cat: "Medio Ambiente", status: "En Ejecución", pct: 40, lead: "CONRED / MARN", budget: "Q 14.1M", date: "Jul 2026", color: "#1A4280" },
  { id: "PRY-012", title: "Parque Industrial y Logístico del Sur del Municipio", cat: "Inversión", status: "Planificación", pct: 10, lead: "Gobierno Central / Muni", budget: "Q 210M", date: "Sep 2026", color: "#D97706" },
];

interface ProjectsArchiveModalProps {
  onClose: () => void;
}

export function ProjectsArchiveModal({ onClose }: ProjectsArchiveModalProps) {
  const [selectedCat, setSelectedCat] = useState<string>("Todas");
  const [selectedStatus, setSelectedStatus] = useState<string>("Todos");
  const [detailProject, setDetailProject] = useState<PublicProject | null>(null);

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

  const filteredProjects = ALL_PUBLIC_PROJECTS.filter(p => {
    const matchCat = selectedCat === "Todas" || p.cat.toLowerCase() === selectedCat.toLowerCase();
    const matchStatus = selectedStatus === "Todos" || p.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchCat && matchStatus;
  });

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 modal-backdrop animate-fadeup overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-5xl bg-navy-900 border border-navy-700 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-navy-800 bg-navy-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <LogoIsotype size={40} className="flex-shrink-0" />
            <div>
              <h2 className="text-white text-xl md:text-2xl font-extrabold tracking-tight">
                Panel Ciudadano de Auditoría — Portafolio Completo
              </h2>
              <p className="text-gold-400 text-xs font-semibold">
                Transparencia de Proyectos · Mesa de Competitividad Quetzaltenango
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-navy-400 hover:text-white p-2.5 rounded-xl hover:bg-navy-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 md:px-8 py-4 bg-navy-950 border-b border-navy-800 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-navy-400 text-xs font-bold uppercase tracking-wider mr-2 flex-shrink-0">Categoría:</span>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                  selectedCat === c
                    ? "bg-gold-500 text-navy-950 shadow font-bold"
                    : "bg-navy-900 text-navy-300 hover:text-white hover:bg-navy-800 border border-navy-800"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-navy-400 text-xs font-bold uppercase tracking-wider flex-shrink-0">Estado:</span>
            <CustomSelect
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={statuses}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {detailProject ? (
            /* Detail View */
            <div className="animate-fadeup max-w-3xl mx-auto">
              <button
                onClick={() => setDetailProject(null)}
                className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-xs font-bold mb-6 hover:-translate-x-1 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a la lista de proyectos
              </button>

              <div className="bg-navy-950 border border-navy-800 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-navy-400 uppercase tracking-wider">{detailProject.cat}</span>
                  <span className="text-xs font-bold text-gold-400" style={{ fontFamily: "var(--font-mono)" }}>
                    ID: {detailProject.id}
                  </span>
                </div>

                <h2 className="text-white text-2xl font-extrabold mb-6 leading-snug">
                  {detailProject.title}
                </h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-8 bg-navy-900/80 p-4 rounded-2xl border border-navy-800">
                  <div>
                    <p className="text-navy-400 text-xs font-medium">Institución Responsable</p>
                    <p className="text-navy-100 font-bold text-sm mt-0.5">{detailProject.lead}</p>
                  </div>
                  <div>
                    <p className="text-navy-400 text-xs font-medium">Presupuesto Estimado</p>
                    <p className="text-gold-400 font-bold text-sm mt-0.5">{detailProject.budget}</p>
                  </div>
                  <div>
                    <p className="text-navy-400 text-xs font-medium">Última Actualización</p>
                    <p className="text-navy-200 font-bold text-sm mt-0.5">{detailProject.date}</p>
                  </div>
                  <div>
                    <p className="text-navy-400 text-xs font-medium">Estado del Proyecto</p>
                    <p className="text-navy-100 font-bold text-sm mt-0.5">{detailProject.status}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-navy-200 font-semibold">Porcentaje de Avance Físico</span>
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: detailProject.color }}>
                      {detailProject.pct}%
                    </span>
                  </div>
                  <div className="h-3 bg-navy-900 rounded-full overflow-hidden p-0.5 border border-navy-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${detailProject.pct}%`, background: detailProject.color }}
                    />
                  </div>
                </div>

                <div className="text-navy-300 text-sm leading-relaxed space-y-3 font-normal border-t border-navy-800/80 pt-6">
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
                const s = STATUS_MAP[p.status] || { bg: "bg-navy-100", text: "text-navy-700", dot: "bg-navy-500" };
                return (
                  <article key={p.id} className="bg-navy-950 border border-navy-800 rounded-2xl overflow-hidden group flex flex-col justify-between hover:border-gold-500/50 transition-all duration-300">
                    <div>
                      {/* Top progress stripe */}
                      <div className="h-1 bg-navy-900">
                        <div className="h-full transition-all duration-700" style={{ width: `${p.pct}%`, background: p.color }} />
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold text-navy-400 uppercase tracking-wider">{p.cat}</span>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {p.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-navy-100 text-sm leading-snug mb-3 group-hover:text-gold-300 transition-colors line-clamp-2">
                          {p.title}
                        </h3>

                        <dl className="space-y-1 text-[11px] mb-4">
                          <div className="flex gap-2">
                            <dt className="text-navy-400 w-16 flex-shrink-0 font-medium">Líder:</dt>
                            <dd className="text-navy-200 font-semibold truncate">{p.lead}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="text-navy-400 w-16 flex-shrink-0 font-medium">Monto:</dt>
                            <dd className="text-gold-400 font-semibold">{p.budget}</dd>
                          </div>
                        </dl>

                        <div>
                          <div className="flex justify-between items-center mb-1 text-[10px]">
                            <span className="text-navy-400 font-medium">Avance</span>
                            <span className="font-bold" style={{ fontFamily: "var(--font-mono)", color: p.color }}>{p.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-navy-900 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-navy-900/60 border-t border-navy-800/80 flex items-center justify-between">
                      <button
                        onClick={() => setDetailProject(p)}
                        className="text-xs font-bold text-navy-300 hover:text-gold-400 flex items-center gap-1 transition-colors"
                      >
                        Ver expediente →
                      </button>
                      <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-navy-400 font-bold">{p.id}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
