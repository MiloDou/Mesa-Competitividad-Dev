import React from "react";
import { LogoIsotype } from "../../Logo";

const NAV = ["Inicio","La Mesa","Noticias","Proyectos","Summit 2026","Transparencia","Contacto"];

interface PublicHeaderProps {
  scrolled: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  onOpenLogin: () => void;
}

export default function PublicHeader({ scrolled, menuOpen, setMenuOpen, onOpenLogin }: PublicHeaderProps) {
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-navy-900/98 backdrop-blur-md shadow-lg" : "bg-navy-900"}`}>
      {/* Thin gold accent line */}
      <div className="h-0.5 bg-gold-500 w-full" />
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Wordmark */}
          <a href="#inicio" className="flex items-center gap-3 group">
            <LogoIsotype size={48} className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <div className="hidden sm:block">
              <p className="text-white font-semibold text-sm leading-none">Mesa Departamental de Competitividad</p>
              <p className="text-navy-300 text-xs tracking-wide mt-0.5">Quetzaltenango · Guatemala</p>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(" ","").replace("ú","u")}`}
                 className="relative px-3 py-2 text-sm text-navy-200 hover:text-white transition-colors group">
                {l}
                <span className="absolute bottom-1 left-3 right-3 h-px bg-gold-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLogin}
              className="hidden sm:inline-flex items-center gap-1.5 border border-navy-700 hover:border-celeste-500/50 bg-navy-950 text-navy-200 hover:text-celeste-400 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-celeste-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Acceso Admin
            </button>
            <a href="#summit-2026"
               className="hidden sm:inline-flex items-center gap-1.5 bg-celeste-500 hover:bg-celeste-400 active:bg-celeste-600 text-navy-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors duration-150 shadow-md shadow-celeste-500/20">
              Pre-registro Summit →
            </a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-navy-200 hover:text-white hover:bg-navy-800 rounded-lg transition-colors" aria-label="Menú">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="lg:hidden bg-navy-900 border-t border-navy-800">
          {NAV.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(" ","").replace("ú","u")}`}
               onClick={() => setMenuOpen(false)}
               className="block px-6 py-3.5 text-sm text-navy-200 hover:text-celeste-400 hover:bg-navy-800 border-b border-navy-800/50 transition-colors">
              {l}
            </a>
          ))}
          <button
            onClick={() => { setMenuOpen(false); onOpenLogin(); }}
            className="w-full text-left px-6 py-3.5 text-sm text-celeste-400 hover:bg-navy-800 border-b border-navy-800/50 font-semibold transition-colors"
          >
            Acceso Admin
          </button>
        </div>
      )}
    </header>
  );
}
