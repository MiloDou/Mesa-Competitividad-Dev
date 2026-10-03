export default function NewsSection() {
  return (
    <section id="noticias" className="py-24 bg-navy-950">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
          <div>
            <h2 style={{ fontFamily:"var(--font-display)" }} className="text-celeste-400 text-4xl lg:text-5xl font-bold uppercase tracking-wide leading-tight mb-2">Comunicados y Noticias</h2>
            <p className="text-white text-xl lg:text-2xl font-normal leading-snug">Lo más reciente</p>
          </div>
          <a href="#" className="text-navy-400 hover:text-celeste-400 text-sm font-medium transition-colors self-end flex items-center gap-1.5">
            Ver archivo completo
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
          </a>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr_1fr] gap-5">
          {/* Featured */}
          <article className="relative rounded-2xl overflow-hidden group cursor-pointer">
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=700&fit=crop&auto=format"
                 alt="Sesión de la Mesa" className="w-full h-80 lg:h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/60 to-transparent"/>
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <span className="inline-block bg-celeste-500 text-navy-950 text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 self-start uppercase tracking-wide">Sesión Ordinaria</span>
              <h3 style={{ fontFamily:"var(--font-display)" }} className="text-white text-2xl font-normal leading-snug mb-2">
                Mesa aprueba nuevo corredor logístico con inversión de Q 45 millones
              </h3>
              <p className="text-navy-300 text-sm leading-relaxed line-clamp-2 mb-4">
                La Sesión Ordinaria No. 020 aprobó por unanimidad el expediente técnico del Corredor Logístico del Altiplano Occidental, marcando un hito para la conectividad regional.
              </p>
              <div className="flex items-center gap-3 text-xs text-navy-400">
                <span>21 agosto 2026</span>
                <span>·</span>
                <span>5 min de lectura</span>
              </div>
            </div>
          </article>

          {/* Cards */}
          {[
            { tag:"Convocatoria", img:"https://images.unsplash.com/photo-1560523160-754a9e25c68f?w=600&h=400&fit=crop&auto=format", title:"Abiertas inscripciones para el Summit de Competitividad 2026", excerpt:"400 cupos disponibles para dos jornadas de conferencias y mesas de trabajo con líderes del sector empresarial y académico.", date:"05 sep 2026", read:"3 min" },
            { tag:"Informe",      img:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format", title:"Informe de avance Q3 2026: 68% de ejecución en proyectos prioritarios", excerpt:"El tercer informe trimestral revela una ejecución presupuestaria del 68% en los proyectos de la cartera activa de la Mesa.", date:"02 sep 2026", read:"4 min" },
          ].map(n => (
            <article key={n.title} className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden group cursor-pointer hover:border-navy-600 transition-all duration-200">
              <div className="overflow-hidden h-40">
                <img src={n.img} alt={n.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
              </div>
              <div className="p-5">
                <span className="inline-block bg-navy-800 text-celeste-400 text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 uppercase tracking-wide">{n.tag}</span>
                <h3 className="font-semibold text-white text-[14px] leading-snug mb-2 group-hover:text-celeste-300 transition-colors line-clamp-2">{n.title}</h3>
                <p className="text-navy-400 text-xs leading-relaxed mb-4 line-clamp-2">{n.excerpt}</p>
                <div className="flex items-center gap-2 text-[10px] text-navy-300">
                  <span>{n.date}</span><span>·</span><span>{n.read} de lectura</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
