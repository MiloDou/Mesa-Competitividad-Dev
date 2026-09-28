import { LogoIsotype } from "../../../Logo";

const NAV = ["Inicio","La Mesa","Noticias","Proyectos","Summit 2026","Transparencia","Contacto"];

interface FooterSectionProps {
  onOpenLogin?: () => void;
}

export default function FooterSection({ onOpenLogin }: FooterSectionProps) {
  return (
    <footer className="bg-navy-950 border-t border-navy-900 pt-12 pb-24">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <LogoIsotype size={44} className="flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">Mesa Departamental de Competitividad</p>
                <p className="text-gold-400 text-xs font-semibold">Quetzaltenango · Guatemala</p>
              </div>
            </div>
            <p className="text-navy-300 text-sm leading-relaxed max-w-xs font-normal">
              Construyendo la agenda de competitividad territorial para un Quetzaltenango más próspero, inclusivo y sostenible.
            </p>
          </div>
          <div>
            <p className="text-gold-400 text-xs font-extrabold uppercase tracking-widest mb-4">Navegación</p>
            <ul className="space-y-2">
              {NAV.map(l => <li key={l}><a href="#" className="text-navy-300 hover:text-gold-300 text-sm font-medium transition-colors">{l}</a></li>)}
            </ul>
          </div>
          <div>
            <p className="text-gold-400 text-xs font-extrabold uppercase tracking-widest mb-4">Recursos</p>
            <ul className="space-y-2">
              <li><a href="#" className="text-navy-300 hover:text-gold-300 text-sm font-medium transition-colors">Política de Transparencia</a></li>
              <li><a href="#" className="text-navy-300 hover:text-gold-300 text-sm font-medium transition-colors">Aviso de Privacidad</a></li>
              <li>
                <button onClick={onOpenLogin} className="text-navy-400 hover:text-gold-400 text-xs font-normal transition-colors text-left flex items-center gap-1.5 opacity-60 hover:opacity-100">
                  <svg className="w-3 h-3 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Acceso Administrativo
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-navy-900 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-navy-400 text-xs font-medium">© 2026 Mesa Departamental de Competitividad de Quetzaltenango. Todos los derechos reservados.</p>
          <p className="text-navy-400 text-xs font-semibold">Estándares de Gobierno Abierto · Guatemala</p>
        </div>
      </div>
    </footer>
  );
}
