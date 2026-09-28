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
                <p className="text-white font-semibold text-sm">Mesa Departamental de Competitividad</p>
                <p className="text-navy-500 text-xs">Quetzaltenango · Guatemala</p>
              </div>
            </div>
            <p className="text-navy-400 text-sm leading-relaxed max-w-xs">
              Construyendo la agenda de competitividad territorial para un Quetzaltenango más próspero, inclusivo y sostenible.
            </p>
          </div>
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-widest mb-4">Navegación</p>
            <ul className="space-y-2">
              {NAV.map(l => <li key={l}><a href="#" className="text-navy-400 hover:text-celeste-400 text-sm transition-colors">{l}</a></li>)}
            </ul>
          </div>
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-widest mb-4">Recursos</p>
            <ul className="space-y-2">
              <li><a href="#" className="text-navy-400 hover:text-celeste-400 text-sm transition-colors">Política de Transparencia</a></li>
              <li><a href="#" className="text-navy-400 hover:text-celeste-400 text-sm transition-colors">Aviso de Privacidad</a></li>
              <li>
                <button onClick={onOpenLogin} className="text-navy-400 hover:text-celeste-400 text-sm transition-colors text-left">
                  Acceso al Sistema Interno (Admin)
                </button>
              </li>
              <li><a href="#" className="text-navy-400 hover:text-celeste-400 text-sm transition-colors">API de Datos Abiertos</a></li>
              <li><a href="#" className="text-navy-400 hover:text-celeste-400 text-sm transition-colors">Mapa del sitio</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-navy-900 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-navy-600 text-xs">© 2026 Mesa Departamental de Competitividad de Quetzaltenango. Todos los derechos reservados.</p>
          <p className="text-navy-700 text-xs">Estándares de Gobierno Abierto · Guatemala</p>
        </div>
      </div>
    </footer>
  );
}
