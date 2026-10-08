import { LogoIsotype } from "../../../Logo";

interface FooterSectionProps {
  onOpenLogin?: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export default function FooterSection({ onOpenLogin, onNavigateTab }: FooterSectionProps) {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <LogoIsotype size={40} className="flex-shrink-0" />
              <div>
                <p className="text-navy-950 font-bold text-sm">Mesa Departamental de Competitividad</p>
                <p className="text-gold-600 text-xs font-semibold">Quetzaltenango · Guatemala</p>
              </div>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md font-normal">
              Mecanismo de coordinación interinstitucional para construir la agenda de competitividad territorial y desarrollo sostenible del occidente guatemalteco.
            </p>
          </div>
          <div>
            <p className="text-gold-700 text-xs font-extrabold uppercase tracking-widest mb-3">Recursos & Acceso</p>
            <ul className="space-y-2 text-xs">
              <li className="mb-2">
                <button
                  onClick={() => (onNavigateTab ? onNavigateTab("summit") : null)}
                  className="inline-flex items-center gap-2 bg-[#E5B82E] hover:bg-[#F5C418] text-navy-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all group border border-amber-400 active:scale-95 focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none"
                >
                  <span>Ir al Summit 2026</span>
                  <span className="group-hover:translate-x-1 transition-transform font-bold">→</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => (onNavigateTab ? onNavigateTab("transparencia") : null)}
                  className="text-slate-600 hover:text-navy-950 font-medium transition-colors text-left"
                >
                  Política de Transparencia
                </button>
              </li>
              <li>
                <button
                  onClick={() => (onNavigateTab ? onNavigateTab("contacto") : null)}
                  className="text-slate-600 hover:text-navy-950 font-medium transition-colors text-left"
                >
                  Contacto e Información
                </button>
              </li>
              <li>
                <button onClick={onOpenLogin} className="text-slate-500 hover:text-navy-950 font-semibold transition-colors text-left flex items-center gap-1.5 opacity-90 hover:opacity-100 mt-2">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Acceso Administrativo
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-slate-500 text-[11px] font-medium">© 2026 Mesa Departamental de Competitividad de Quetzaltenango.</p>
          <p className="text-slate-500 text-[11px] font-semibold">Estándares de Gobierno Abierto · Guatemala</p>
        </div>
      </div>
    </footer>
  );
}
