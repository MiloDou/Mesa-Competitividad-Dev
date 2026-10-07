import React, { useState, useEffect, useRef } from "react";
import { HITO_IMAGES } from "../../../data/public";

interface TimelineSectionProps {
  hoveredHito?: number | null;
  setHoveredHito?: (n: number | null) => void;
}

export default function TimelineSection({ hoveredHito, setHoveredHito }: TimelineSectionProps) {
  const [activeHito, setActiveHito] = useState<number>(0);
  const [arrivedHito, setArrivedHito] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hitos = [
    { year: "2019", label: "Fundación", desc: "Decreto de creación y primera sesión constitutiva" },
    { year: "2021", label: "Plan Estratégico", desc: "Aprobación del primer Plan de Trabajo 2021–2024" },
    { year: "2022", label: "Q 100M", desc: "Primer portafolio de proyectos con Q 100M articulados" },
    { year: "2024", label: "47 aliados", desc: "Incorporación de 12 nuevas instituciones miembro" },
    { year: "2026", label: "Summit", desc: "Primer Summit de Competitividad Regional" },
  ];

  // Actualizar la estación activa al hacer hover o clic, sin regresar al salir con el mouse (estacionario)
  const handleSelectHito = (i: number) => {
    setActiveHito(i);
    if (setHoveredHito) {
      setHoveredHito(i);
    }
  };

  const currentPos = hoveredHito !== null && hoveredHito !== undefined ? hoveredHito : activeHito;

  // Sincronizar el despliegue del apartado de forma fluida e inmediata
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentPos === arrivedHito) return;

    timerRef.current = setTimeout(() => {
      setArrivedHito(currentPos);
    }, 150); // 150ms para respuesta inmediata y fluida

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentPos]);

  return (
    <div className="bg-[#F8FAFC] border-t border-b border-slate-200 py-8 lg:py-10 overflow-hidden">
      <div className="reveal max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="text-center mb-6">
          <h2 className="text-[#12005E] text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-wider leading-none mb-2">
            Hitos de la Mesa
          </h2>
          <p className="text-gold-600 text-lg lg:text-xl font-bold tracking-wide">
            Línea de Tiempo Institucional · 2019 – 2026
          </p>
        </div>

        {/* --- VISTA DESKTOP (HORIZONTAL CON TREN Y RIELES) --- */}
        <div className="hidden md:block relative pt-4 pb-60 px-4 overflow-x-auto sm:overflow-x-visible no-scrollbar">
          <div className="min-w-[640px] sm:min-w-0 relative">
            
            {/* --- RAILWAY TRACK (Rieles y Durmientes) --- */}
            <div className="absolute top-[44px] left-8 right-8 h-10 -translate-y-1/2 flex items-center z-0">
              <svg className="w-full h-10" preserveAspectRatio="none">
                <defs>
                  <pattern id="railway-ties" width="28" height="40" patternUnits="userSpaceOnUse">
                    <rect x="10" y="4" width="8" height="32" rx="2" fill="#93A1B8" />
                  </pattern>
                </defs>
                <rect width="100%" height="40" fill="url(#railway-ties)" />
                <rect x="0" y="11" width="100%" height="4" fill="#12005E" rx="1" />
                <rect x="0" y="25" width="100%" height="4" fill="#12005E" rx="1" />
              </svg>
            </div>

            {/* --- MOVING TRAIN (Estacionario en el último hito hovereado) --- */}
            <div
              className="absolute top-[-10px] left-[10%] z-20 transition-all duration-700 ease-in-out pointer-events-none"
              style={{
                left: `calc(${10 + currentPos * 20}% - 48px)`,
              }}
            >
              <div className="relative group">
                <div className="absolute -top-4 right-6 flex space-x-1 animate-bounce opacity-75">
                  <div className="w-2.5 h-2.5 bg-slate-300 rounded-full blur-[1px]" />
                  <div className="w-3.5 h-3.5 bg-slate-300 rounded-full blur-[1px] -mt-1" />
                  <div className="w-4 h-4 bg-slate-300 rounded-full blur-[1px] -mt-2" />
                </div>
                
                <svg width="96" height="56" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="14" y="16" width="34" height="36" rx="3" fill="#12005E" />
                  <rect x="12" y="13" width="36" height="4" rx="1" fill="#0C003D" />
                  <rect x="22" y="22" width="18" height="15" rx="2" fill="#FFFFFF" stroke="#93A1B8" strokeWidth="2" />
                  <rect x="44" y="24" width="58" height="28" rx="6" fill="#12005E" />
                  <rect x="48" y="32" width="50" height="3" fill="#93A1B8" />
                  <path d="M 60 24 C 60 16, 72 16, 72 24 Z" fill="#12005E" />
                  <path d="M 92 24 L 88 10 L 102 10 L 98 24 Z" fill="#12005E" />
                  <rect x="86" y="8" width="18" height="4" rx="2" fill="#12005E" />
                  <circle cx="105" cy="36" r="4" fill="#FFFFFF" stroke="#93A1B8" strokeWidth="2" />
                  <path d="M 109 36 L 118 30 L 118 42 Z" fill="#FFD700" opacity="0.6" />
                  <path d="M 104 50 L 116 56 L 104 56 Z" fill="#93A1B8" />
                  <rect x="12" y="50" width="96" height="6" rx="2" fill="#0C003D" />
                  <circle cx="30" cy="58" r="10" fill="#12005E" stroke="#93A1B8" strokeWidth="2" />
                  <circle cx="30" cy="58" r="4" fill="#FFFFFF" />
                  <circle cx="70" cy="58" r="10" fill="#12005E" stroke="#93A1B8" strokeWidth="2" />
                  <circle cx="70" cy="58" r="4" fill="#FFFFFF" />
                  <circle cx="92" cy="58" r="10" fill="#12005E" stroke="#93A1B8" strokeWidth="2" />
                  <circle cx="92" cy="58" r="4" fill="#FFFFFF" />
                  <line x1="30" y1="58" x2="92" y2="58" stroke="#93A1B8" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="30" cy="58" r="2" fill="#12005E" />
                  <circle cx="70" cy="58" r="2" fill="#12005E" />
                  <circle cx="92" cy="58" r="2" fill="#12005E" />
                </svg>
              </div>
            </div>

            {/* --- ESTACIONES / HITOS --- */}
            <div className="grid grid-cols-5 relative z-10">
              {hitos.map((h, i) => {
                const isActive = currentPos === i;
                return (
                  <div key={h.year} className="flex flex-col items-center text-center relative group">
                    
                    {/* Botón de Estación en los rieles */}
                    <button
                      onClick={() => handleSelectHito(i)}
                      onMouseEnter={() => handleSelectHito(i)}
                      onFocus={() => handleSelectHito(i)}
                      className={`relative z-10 w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-125 focus:outline-none ${
                        isActive
                          ? "bg-[#12005E] ring-4 ring-[#12005E]/20 scale-110 shadow-xl"
                          : "bg-[#93A1B8] hover:bg-[#12005E]"
                      }`}
                      aria-label={`Estación Hito ${h.year}: ${h.label}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${isActive ? "bg-gold-400" : "bg-white"}`} />
                    </button>

                    {/* Año y Título */}
                    <div className="mt-4 flex flex-col items-center cursor-pointer" onClick={() => handleSelectHito(i)}>
                      <span
                        style={{ fontFamily: "var(--font-mono)" }}
                        className={`text-base font-black tracking-widest transition-colors duration-200 ${
                          isActive ? "text-[#12005E]" : "text-slate-600"
                        }`}
                      >
                        {h.year}
                      </span>
                      <span className={`text-sm font-extrabold mt-1 px-2.5 py-0.5 rounded transition-all ${isActive ? "text-[#12005E] bg-gold-100 shadow-sm" : "text-slate-700"}`}>
                        {h.label}
                      </span>
                    </div>

                    {/* Tarjeta Informativa del Hito Seleccionado (Aparece únicamente cuando el tren ha llegado encima) */}
                    {arrivedHito === i && (
                      <div className="absolute top-[135px] left-1/2 -translate-x-1/2 w-64 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl z-30 animate-fadeup">
                        <img src={HITO_IMAGES[i]} alt={h.label} className="w-full h-32 object-cover" />
                        <div className="p-4 text-left">
                          <div className="flex items-center justify-between mb-1.5">
                            <span style={{ fontFamily: "var(--font-mono)" }} className="text-[#12005E] text-xs font-bold">
                              {h.year}
                            </span>
                            <span className="text-[10px] bg-gold-100 text-gold-800 font-bold px-2 py-0.5 rounded-full uppercase">
                              Estación {i + 1}
                            </span>
                          </div>
                          <p className="text-navy-950 font-extrabold text-sm mb-1">{h.label}</p>
                          <p className="text-slate-600 text-xs leading-relaxed">{h.desc}</p>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* --- VISTA MÓVIL (VERTICAL CON RIELES Y TREN ANIMADO) --- */}
        <div className="block md:hidden relative pl-12 pr-2 my-6 space-y-6">
          {/* Rieles de Tren Verticales */}
          <div className="absolute top-0 bottom-0 left-[18px] w-6 -translate-x-1/2 overflow-hidden pointer-events-none z-0">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <pattern id="railway-ties-v" width="24" height="20" patternUnits="userSpaceOnUse">
                  <rect x="2" y="7" width="20" height="6" rx="1.5" fill="#93A1B8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#railway-ties-v)" />
              <rect x="5" y="0" width="3" height="100%" fill="#12005E" rx="1" />
              <rect x="16" y="0" width="3" height="100%" fill="#12005E" rx="1" />
            </svg>
          </div>

          {hitos.map((h, i) => {
            const isActive = currentPos === i;
            return (
              <div key={h.year} className="relative z-10">
                
                {/* Tren en la Estación Activa en Móvil */}
                {isActive && (
                  <div className="absolute -left-[54px] -top-9 z-30 animate-fadeup pointer-events-none">
                    <div className="relative">
                      {/* Humo de la locomotora */}
                      <div className="absolute -top-3 left-3 flex space-x-1 animate-bounce opacity-75">
                        <div className="w-2 h-2 bg-slate-400 rounded-full blur-[1px]" />
                        <div className="w-3 h-3 bg-slate-300 rounded-full blur-[1px] -mt-1" />
                      </div>
                      
                      {/* Locomotora SVG */}
                      <svg width="60" height="36" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="14" y="16" width="34" height="36" rx="3" fill="#12005E" />
                        <rect x="12" y="13" width="36" height="4" rx="1" fill="#0C003D" />
                        <rect x="22" y="22" width="18" height="15" rx="2" fill="#FFFFFF" stroke="#93A1B8" strokeWidth="2" />
                        <rect x="44" y="24" width="58" height="28" rx="6" fill="#12005E" />
                        <rect x="48" y="32" width="50" height="3" fill="#93A1B8" />
                        <path d="M 60 24 C 60 16, 72 16, 72 24 Z" fill="#12005E" />
                        <path d="M 92 24 L 88 10 L 102 10 L 98 24 Z" fill="#12005E" />
                        <rect x="86" y="8" width="18" height="4" rx="2" fill="#12005E" />
                        <circle cx="105" cy="36" r="4" fill="#FFFFFF" stroke="#93A1B8" strokeWidth="2" />
                        <path d="M 109 36 L 118 30 L 118 42 Z" fill="#FFD700" opacity="0.6" />
                        <path d="M 104 50 L 116 56 L 104 56 Z" fill="#93A1B8" />
                        <rect x="12" y="50" width="96" height="6" rx="2" fill="#0C003D" />
                        <circle cx="30" cy="58" r="10" fill="#12005E" stroke="#93A1B8" strokeWidth="2" />
                        <circle cx="30" cy="58" r="4" fill="#FFFFFF" />
                        <circle cx="70" cy="58" r="10" fill="#12005E" stroke="#93A1B8" strokeWidth="2" />
                        <circle cx="70" cy="58" r="4" fill="#FFFFFF" />
                        <circle cx="92" cy="58" r="10" fill="#12005E" stroke="#93A1B8" strokeWidth="2" />
                        <circle cx="92" cy="58" r="4" fill="#FFFFFF" />
                        <line x1="30" y1="58" x2="92" y2="58" stroke="#93A1B8" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Botón de Estación en la línea vertical */}
                <button
                  onClick={() => handleSelectHito(i)}
                  className={`absolute -left-[42px] top-1.5 w-9 h-9 rounded-full border-4 border-white shadow-md flex items-center justify-center cursor-pointer transition-all ${
                    isActive
                      ? "bg-[#12005E] ring-4 ring-[#12005E]/20 scale-110 z-20"
                      : "bg-[#93A1B8] hover:bg-[#12005E]"
                  }`}
                  aria-label={`Estación ${h.year}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-gold-400" : "bg-white"}`} />
                </button>

                {/* Estación en Móvil: El cuadro informativo aparece ÚNICAMENTE cuando el tren llega a la estación */}
                {arrivedHito === i ? (
                  <div
                    onClick={() => handleSelectHito(i)}
                    className="bg-white border-2 border-[#12005E] ring-2 ring-[#12005E]/20 rounded-2xl p-4 shadow-xl cursor-pointer animate-fadeup"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontFamily: "var(--font-mono)" }} className="text-[#12005E] text-base font-black tracking-wider">
                        {h.year}
                      </span>
                      <span className="text-xs font-extrabold px-3 py-0.5 rounded-full bg-gold-100 text-gold-800">
                        {h.label}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-3">{h.desc}</p>

                    <div className="pt-2 border-t border-slate-100">
                      <img src={HITO_IMAGES[i]} alt={h.label} className="w-full h-36 object-cover rounded-xl shadow-sm" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectHito(i)}
                    className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span style={{ fontFamily: "var(--font-mono)" }} className="text-slate-600 group-hover:text-[#12005E] text-sm font-bold">
                      {h.year}
                    </span>
                    <span className="text-slate-700 font-semibold text-xs bg-slate-100 group-hover:bg-navy-50 px-2.5 py-1 rounded-lg transition-colors">
                      {h.label}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
