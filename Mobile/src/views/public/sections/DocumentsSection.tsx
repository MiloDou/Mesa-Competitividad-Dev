import { DOCS } from "../../../data/public";

export default function DocumentsSection() {
  return (
    <section id="transparencia" className="py-24 bg-navy-900 border-t border-navy-800">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="mb-14">
          <h2 style={{ fontFamily:"var(--font-display)" }} className="text-celeste-400 text-4xl lg:text-5xl font-bold uppercase tracking-wide mb-2">Transparencia Institucional</h2>
          <p className="text-white text-xl lg:text-2xl font-normal">Documentos y Registros Públicos</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DOCS.map(d => (
            <button key={d.title}
                    className="text-left p-6 rounded-2xl border border-navy-800 bg-navy-950 hover:border-celeste-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="mb-4"><span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-black tracking-wide ${d.abbr_color}`}>{d.abbr}</span></div>
              <h3 className="font-bold text-white mb-1 text-[15px] group-hover:text-celeste-300">{d.title}</h3>
              <p className="text-xs text-navy-400 mb-0.5">{d.count}</p>
              <p className="text-xs text-navy-500">{d.tag}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-navy-400 group-hover:text-celeste-400 group-hover:gap-1.5 transition-all">
                Acceder
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
