import { PUBLIC_PROJECTS, STATUS_MAP } from "../../../data/public";

export default function ProjectsSection() {
  return (
    <section id="proyectos" className="py-24 bg-navy-950">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
          <div>
            <h2 style={{ fontFamily:"var(--font-display)" }} className="text-celeste-400 text-4xl lg:text-5xl font-bold uppercase tracking-wide leading-tight mb-2">Panel Ciudadano de Auditoría</h2>
            <p className="text-white text-xl lg:text-2xl font-normal leading-snug">Iniciativas en Seguimiento</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-green-200 rounded-full px-4 py-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-green-700 text-xs font-semibold">Actualizado · 10 Sep 2026</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {PUBLIC_PROJECTS.map(p => {
            const s = STATUS_MAP[p.status];
            return (
              <article key={p.id} className="card-lift bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden group">
                {/* Progress bar top stripe */}
                <div className="h-1 bg-navy-800">
                  <div className="h-full transition-all duration-700" style={{ width:`${p.pct}%`, background: p.color }} />
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{p.cat}</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-base leading-snug mb-4 group-hover:text-celeste-300 transition-colors">{p.title}</h3>

                  <dl className="space-y-1.5 text-xs mb-5">
                    {[["Responsable", p.lead],["Presupuesto", p.budget],["Actualizado", p.date]].map(([k,v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="text-navy-300 w-20 flex-shrink-0">{k}</dt>
                        <dd className="text-navy-200 font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-navy-300">Avance</span>
                      <span className="text-xs font-bold" style={{ fontFamily:"var(--font-mono)", color: p.color }}>{p.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width:`${p.pct}%`, background: p.color }} />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-navy-800/50 border-t border-navy-800 flex items-center justify-between">
                  <button className="text-xs font-semibold text-navy-300 hover:text-celeste-400 flex items-center gap-1 transition-colors group-hover:gap-1.5">
                    Ver expediente
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                  </button>
                  <span style={{ fontFamily:"var(--font-mono)" }} className="text-[10px] text-navy-400">{p.id}</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button className="btn-scale inline-flex items-center gap-2 border border-navy-700 hover:border-celeste-500 text-navy-300 hover:text-celeste-400 font-medium text-sm px-6 py-3 rounded-full transition-colors">
            Ver todos los proyectos (23)
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
