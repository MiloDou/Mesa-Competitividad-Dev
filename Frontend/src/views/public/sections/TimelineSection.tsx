import React, { useState } from "react";
import { HITO_IMAGES } from "../../../data/public";

interface TimelineSectionProps {
  hoveredHito: number | null;
  setHoveredHito: (n: number | null) => void;
}

export default function TimelineSection({ hoveredHito, setHoveredHito }: TimelineSectionProps) {
  const [activeHito, setActiveHito] = useState<number>(0);

  const hitos = [
    { year: "2019", label: "Fundación", desc: "Decreto de creación y primera sesión constitutiva" },
    { year: "2021", label: "Plan Estratégico", desc: "Aprobación del primer Plan de Trabajo 2021–2024" },
    { year: "2022", label: "Q 100M", desc: "Primer portafolio de proyectos con Q 100M articulados" },
    { year: "2024", label: "47 aliados", desc: "Incorporación de 12 nuevas instituciones miembro" },
    { year: "2026", label: "Summit", desc: "Primer Summit de Competitividad Regional" },
  ];

  // Current active or hovered station index
  const currentPos = hoveredHito !== null ? hoveredHito : activeHito;

  return (
    <div className="bg-[#F8FAFC] border-t border-b border-slate-200 py-16 overflow-hidden">
      <div className="reveal max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="text-center mb-8">
          <h2 className="text-[#12005E] text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wider leading-none mb-3">
            Hitos de la Mesa
          </h2>
          <p className="text-gold-600 text-xl lg:text-2xl font-bold tracking-wide">
            Línea de Tiempo Institucional · 2019 – 2026
          </p>
        </div>

        {/* Railway Timeline Container - Increased height & padding to fit the card comfortably */}
        <div className="relative pt-6 pb-72 px-4 overflow-x-auto sm:overflow-x-visible no-scrollbar">
          <div className="min-w-[640px] sm:min-w-0 relative">
            
            {/* --- RAILWAY TRACK (Rieles y Durmientes) --- */}
            <div className="absolute top-[44px] left-8 right-8 h-10 -translate-y-1/2 flex items-center z-0">
              <svg className="w-full h-10" preserveAspectRatio="none">
                <defs>
                  <pattern id="railway-ties" width="28" height="40" patternUnits="userSpaceOnUse">
                    {/* Durmiente transversal (#93A1B8) */}
                    <rect x="10" y="4" width="8" height="32" rx="2" fill="#93A1B8" />
                  </pattern>
                </defs>
                {/* Fondo de durmientes */}
                <rect width="100%" height="40" fill="url(#railway-ties)" />
                {/* Riel Superior (#12005E) */}
                <rect x="0" y="11" width="100%" height="4" fill="#12005E" rx="1" />
                {/* Riel Inferior (#12005E) */}
                <rect x="0" y="25" width="100%" height="4" fill="#12005E" rx="1" />
              </svg>
            </div>

            {/* --- MOVING TRAIN (Locomotora orientada hacia la derecha) --- */}
            <div
              className="absolute top-[-10px] left-[10%] z-20 transition-all duration-700 ease-in-out pointer-events-none"
              style={{
                left: `calc(${10 + currentPos * 20}% - 48px)`,
              }}
            >
              {/* SVG Locomotive */}
              <div className="relative group">
                <div className="absolute -top-4 right-6 flex space-x-1 animate-bounce opacity-75">
                  <div className="w-2.5 h-2.5 bg-slate-300 rounded-full blur-[1px]" />
                  <div className="w-3.5 h-3.5 bg-slate-300 rounded-full blur-[1px] -mt-1" />
                  <div className="w-4 h-4 bg-slate-300 rounded-full blur-[1px] -mt-2" />
                </div>
                
                <svg width="96" height="56" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Cabina */}
                  <rect x="14" y="16" width="34" height="36" rx="3" fill="#12005E" />
                  <rect x="12" y="13" width="36" height="4" rx="1" fill="#0C003D" />
                  <rect x="22" y="22" width="18" height="15" rx="2" fill="#FFFFFF" stroke="#93A1B8" strokeWidth="2" />

                  {/* Caldera */}
                  <rect x="44" y="24" width="58" height="28" rx="6" fill="#12005E" />
                  <rect x="48" y="32" width="50" height="3" fill="#93A1B8" />

                  {/* Domo */}
                  <path d="M 60 24 C 60 16, 72 16, 72 24 Z" fill="#12005E" />

                  {/* Chimenea */}
                  <path d="M 92 24 L 88 10 L 102 10 L 98 24 Z" fill="#12005E" />
                  <rect x="86" y="8" width="18" height="4" rx="2" fill="#12005E" />

                  {/* Farol */}
                  <circle cx="105" cy="36" r="4" fill="#FFFFFF" stroke="#93A1B8" strokeWidth="2" />
                  <path d="M 109 36 L 118 30 L 118 42 Z" fill="#FFD700" opacity="0.6" />

                  {/* Deflector */}
                  <path d="M 104 50 L 116 56 L 104 56 Z" fill="#93A1B8" />

                  {/* Base */}
                  <rect x="12" y="50" width="96" height="6" rx="2" fill="#0C003D" />

                  {/* Ruedas */}
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

            {/* --- STATIONS / HITOS --- */}
            <div className="grid grid-cols-5 relative z-10">
              {hitos.map((h, i) => {
                const isActive = currentPos === i;
                return (
                  <div key={h.year} className="flex flex-col items-center text-center relative group">
                    
                    {/* Botón de Estación en los rieles */}
                    <button
                      onClick={() => setActiveHito(i)}
                      onMouseEnter={() => setHoveredHito(i)}
                      onMouseLeave={() => setHoveredHito(null)}
                      className={`relative z-10 w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-125 focus:outline-none ${
                        isActive
                          ? "bg-[#12005E] ring-4 ring-[#12005E]/20 scale-110 shadow-xl"
                          : "bg-[#93A1B8] hover:bg-[#12005E]"
                      }`}
                      aria-label={`Estación Hito ${h.year}: ${h.label}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${isActive ? "bg-gold-400" : "bg-white"}`} />
                    </button>

                    {/* Año y Título DEBAJO de los rieles */}
                    <div className="mt-4 flex flex-col items-center">
                      <span
                        style={{ fontFamily: "var(--font-mono)" }}
                        className={`text-base font-black tracking-widest transition-colors duration-200 ${
                          isActive ? "text-[#12005E]" : "text-slate-600"
                        }`}
                      >
                        {h.year}
                      </span>
                      <span className={`text-sm font-extrabold mt-1 px-2.5 py-0.5 rounded ${isActive ? "text-[#12005E] bg-gold-100" : "text-slate-700"}`}>
                        {h.label}
                      </span>
                    </div>

                    {/* Tarjeta Informativa Completa (Desplegada en el espacio ampliado inferior) */}
                    {(hoveredHito === i || (hoveredHito === null && activeHito === i)) && (
                      <div className="absolute top-[135px] left-1/2 -translate-x-1/2 w-64 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl z-30 pointer-events-none animate-fadeup">
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

      </div>
    </div>
  );
}
