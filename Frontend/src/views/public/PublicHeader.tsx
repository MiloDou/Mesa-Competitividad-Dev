import React from "react";
import { LogoIsotype } from "../../Logo";

export const NAV_ITEMS = [
  { label: "Inicio", id: "inicio" },
  { label: "La Mesa", id: "lamesa" },
  { label: "Hitos", id: "hitos" },
  { label: "Agenda", id: "agenda" },
  { label: "Noticias", id: "noticias" },
  { label: "Proyectos", id: "proyectos" },
  { label: "Transparencia", id: "transparencia" },
  { label: "Summit 2026", id: "summit" },
  { label: "Contacto", id: "contacto" },
];

interface PublicHeaderProps {
  scrolled: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onOpenLogin?: () => void;
}

export default function PublicHeader({
  scrolled,
  menuOpen,
  setMenuOpen,
  activeTab,
  setActiveTab,
  onOpenLogin,
}: PublicHeaderProps) {
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMenuOpen(false);
    const el = document.getElementById("pub-root");
    if (el) el.scrollTop = 0;
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/98 backdrop-blur-md shadow-md border-b border-gray-200" : "bg-white border-b border-gray-100"}`}>
      {/* Accessible Skip to Content Link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-navy-900 focus:text-white focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-2xl focus:ring-2 focus:ring-gold-400">
        Saltar al contenido principal (Teclado)
      </a>

      {/* Accent line top */}
      <div className="h-1 bg-[#E5B82E] w-full" />
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Wordmark / Logo */}
          <button
            onClick={() => handleTabClick("inicio")}
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none rounded-xl p-1 text-left"
          >
            <LogoIsotype size={44} className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <div className="hidden sm:block">
              <p className="text-navy-950 font-bold text-sm leading-none tracking-tight">Mesa Departamental de Competitividad</p>
              <p className="text-gold-600 text-xs font-semibold tracking-wider mt-0.5">Quetzaltenango · Guatemala</p>
            </div>
          </button>

          {/* Botones de navegación por páginas/módulos Desktop */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80" aria-label="Navegación por páginas modulares">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`px-3.5 py-2 text-xs font-bold transition-all rounded-xl relative focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none min-h-[38px] flex items-center justify-center ${
                    isActive
                      ? "bg-navy-900 text-gold-300 shadow-md scale-[1.02]"
                      : "text-slate-600 hover:text-navy-950 hover:bg-white/70"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-1 bg-gold-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Botón de Menú Móvil */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-700 hover:text-navy-950 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Menú de navegación por módulos"
              aria-expanded={menuOpen}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Barra de módulos para pantallas móviles */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-100 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all ${
                  isActive
                    ? "bg-navy-900 text-gold-300 shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menú desplegable móvil */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 p-4 space-y-1.5 animate-fadeup">
          <p className="text-[11px] font-bold text-slate-400 uppercase px-4 mb-2">Seleccionar Módulo / Página</p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`block w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                  isActive
                    ? "bg-navy-900 text-gold-300 font-extrabold"
                    : "text-slate-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
