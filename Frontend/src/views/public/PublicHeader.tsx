import React from "react";
import { LogoIsotype } from "../../Logo";

const NAV = ["Inicio","La Mesa","Noticias","Proyectos","Summit 2026","Transparencia","Contacto"];

interface PublicHeaderProps {
  scrolled: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  onOpenLogin?: () => void;
}

export default function PublicHeader({ scrolled, menuOpen, setMenuOpen, onOpenLogin }: PublicHeaderProps) {
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/98 backdrop-blur-md shadow-md border-b border-gray-200" : "bg-white border-b border-gray-100"}`}>
      {/* Accessible Skip to Content Link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-navy-900 focus:text-white focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-2xl focus:ring-2 focus:ring-gold-400">
        Saltar al contenido principal (Teclado)
      </a>

      {/* Solid gold accent line top */}
      <div className="h-1 bg-[#E5B82E] w-full" />
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Wordmark */}
          <a href="#inicio" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none rounded-xl p-1">
            <LogoIsotype size={48} className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <div className="hidden sm:block">
              <p className="text-navy-950 font-bold text-sm leading-none tracking-tight">Mesa Departamental de Competitividad</p>
              <p className="text-gold-600 text-xs font-semibold tracking-wider mt-0.5">Quetzaltenango · Guatemala</p>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
            {NAV.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(" ","").replace("ú","u")}`}
                 className="relative px-3 py-2 text-sm text-slate-700 hover:text-navy-950 font-medium transition-colors group focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none rounded-lg">
                {l}
                <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-gold-500 scale-x-0 group-hover:scale-x-100 focus-visible:scale-x-100 transition-transform duration-200 origin-left" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href="#summit-2026"
               className="hidden sm:inline-flex items-center justify-center gap-1.5 bg-[#E5B82E] hover:bg-[#F5C418] text-navy-950 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-150 shadow-sm active:scale-95 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none select-none">
              <span>Pre-registro Summit</span>
              <span className="text-xs font-bold">→</span>
            </a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-slate-700 hover:text-navy-950 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none" aria-label="Menú" aria-expanded={menuOpen}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 p-4 space-y-1">
          {NAV.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(" ","").replace("ú","u")}`}
               onClick={() => setMenuOpen(false)}
               className="block px-4 py-3 text-sm font-medium text-slate-700 hover:text-navy-950 hover:bg-gray-50 rounded-xl transition-colors focus-visible:bg-gray-100 focus-visible:outline-none">
              {l}
            </a>
          ))}
          <div className="pt-2">
            <a href="#summit-2026"
               onClick={() => setMenuOpen(false)}
               className="flex items-center justify-center gap-2 w-full bg-[#E5B82E] hover:bg-[#F5C418] text-navy-950 text-xs font-extrabold px-5 py-3 rounded-xl shadow-sm whitespace-nowrap">
              <span>Pre-registro Summit</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
