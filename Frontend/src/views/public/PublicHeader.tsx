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
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-navy-950/98 backdrop-blur-md shadow-xl border-b border-navy-800" : "bg-navy-950"}`}>
      {/* Metallic gold accent line top */}
      <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 w-full" />
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Wordmark */}
          <a href="#inicio" className="flex items-center gap-3 group">
            <LogoIsotype size={48} className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-none tracking-tight">Mesa Departamental de Competitividad</p>
              <p className="text-gold-400 text-xs font-semibold tracking-wider mt-0.5">Quetzaltenango · Guatemala</p>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(" ","").replace("ú","u")}`}
                 className="relative px-3 py-2 text-sm text-navy-200 hover:text-gold-300 font-medium transition-colors group">
                {l}
                <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-gold-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href="#summit-2026"
               className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 text-xs font-extrabold px-4.5 py-2.5 rounded-xl transition-all duration-150 shadow-md shadow-gold-500/20 active:scale-95">
              Pre-registro Summit →
            </a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-navy-200 hover:text-gold-300 hover:bg-navy-800 rounded-lg transition-colors" aria-label="Menú">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="lg:hidden bg-navy-950 border-t border-navy-800">
          {NAV.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(" ","").replace("ú","u")}`}
               onClick={() => setMenuOpen(false)}
               className="block px-6 py-3.5 text-sm font-medium text-navy-200 hover:text-gold-400 hover:bg-navy-900 border-b border-navy-800/50 transition-colors">
              {l}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
