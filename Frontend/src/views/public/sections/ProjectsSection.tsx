import { useState, useEffect } from "react";
import { PUBLIC_PROJECTS, STATUS_MAP } from "../../../data/public";

interface ProjectsSectionProps {
  data?: Record<string, any>;
  onOpenArchive?: () => void;
}

export default function ProjectsSection({ data, onOpenArchive }: ProjectsSectionProps) {
  const [projectsList, setProjectsList] = useState<any[]>(() => {
    const saved = localStorage.getItem("site_projects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((p: any) => p.visibility !== "private");
      } catch (e) {
        return PUBLIC_PROJECTS;
      }
    }
    return PUBLIC_PROJECTS;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("site_projects");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProjectsList(parsed.filter((p: any) => p.visibility !== "private"));
        } catch (e) {}
      }
    };
    window.addEventListener("site_projects_updated", handleUpdate);
    return () => window.removeEventListener("site_projects_updated", handleUpdate);
  }, []);

  const title = data?.title || "Panel Ciudadano de Auditoría";
  const subtitle = data?.subtitle || "Iniciativas en Seguimiento";

  return (
    <section id="proyectos" className="py-6 lg:py-10 bg-white border-t border-gray-100">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div className="reveal-left">
            <h2 className="text-navy-950 text-3xl lg:text-4xl font-extrabold uppercase tracking-wide leading-tight mb-1">
              {title}
            </h2>
            <p className="text-gold-600 text-lg lg:text-xl font-semibold leading-snug">
              {subtitle}
            </p>
          </div>
          <div className="reveal-right flex items-center gap-2 bg-gray-50 border border-gold-500 rounded-full px-3.5 py-1.5 shadow-sm self-start sm:self-auto">
            <span className="w-2 h-2 bg-gold-600 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-gold-700 text-xs font-semibold">Actualizado en vivo</span>
          </div>
        </div>

        <div className="reveal-scale grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projectsList.map((p) => {
            const s = STATUS_MAP[p.status] || STATUS_MAP["activo"];
            const color = p.color || (p.cat === "Infraestructura" ? "#1E3A8A" : p.cat === "Modernización" ? "#0284C7" : "#059669");
            const dateStr = p.date || p.updated || "Hoy";
            return (
              <article key={p.id} className="card-lift bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden group flex flex-col justify-between">
                <div>
                  {/* Línea uniforme del 100% del ancho en la parte superior de todas las tarjetas */}
                  <div className="h-1.5 w-full" style={{ background: color }} />

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{p.cat}</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {p.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-navy-950 text-base leading-snug mb-3 group-hover:text-gold-600 transition-colors">
                      {p.title}
                    </h3>

                    <dl className="space-y-1 text-xs mb-4">
                      {[["Responsable", p.lead], ["Presupuesto", p.budget], ["Actualizado", dateStr]].map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="text-slate-500 w-20 flex-shrink-0 font-medium">{k}</dt>
                          <dd className="text-slate-700 font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600 font-medium">Avance</span>
                        <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: color }}>{p.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.pct}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <button onClick={onOpenArchive} className="text-xs font-bold text-slate-700 hover:text-gold-700 flex items-center gap-1 transition-colors group-hover:gap-1.5 min-h-[36px]">
                    <span>Ver expediente</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                  </button>
                  <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-slate-400 font-bold">{p.id}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
