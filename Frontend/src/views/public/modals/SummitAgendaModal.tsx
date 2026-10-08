import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SummitSpeaker } from "../../../types/public";
import { SUMMIT_SPEAKERS } from "../../../data/public";
import { LogoIsotype } from "../../../Logo";
import { CalSvg, PinSvg, ClockIcon } from "../../../components/icons/PublicIcons";

interface SummitAgendaModalProps {
  onClose: () => void;
  onSelectSpeakerToRegister?: (speaker: SummitSpeaker) => void;
}

export function SummitAgendaModal({ onClose, onSelectSpeakerToRegister }: SummitAgendaModalProps) {
  const [dayFilter, setDayFilter] = useState<number>(0);
  const [catFilter, setCatFilter] = useState<string>("Todas");
  const [selectedSpeaker, setSelectedSpeaker] = useState<SummitSpeaker | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selectedSpeaker) {
          setSelectedSpeaker(null);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, selectedSpeaker]);

  const categories = [
    "Todas",
    "Infraestructura & Logística",
    "Innovación & Smart Cities",
    "Desarrollo Humano",
    "Inversión & Comercio",
    "Sostenibilidad & Medio Ambiente",
  ];

  const filteredSpeakers = SUMMIT_SPEAKERS.filter((spk) => {
    const matchDay = dayFilter === 0 || spk.day === dayFilter;
    const matchCat = catFilter === "Todas" || spk.category === catFilter;
    return matchDay && matchCat;
  });

  const handleRegister = (spk: SummitSpeaker) => {
    onClose();
    if (onSelectSpeakerToRegister) {
      onSelectSpeakerToRegister(spk);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md animate-fadeup overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal - Estilo idéntico a Noticias */}
        <div className="p-5 md:p-7 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <LogoIsotype size={40} className="flex-shrink-0" />
            <div>
              <h2 className="text-navy-950 text-xl md:text-2xl font-extrabold tracking-tight">
                Agenda de Conferencias y Ponentes
              </h2>
              <p className="text-gold-600 text-xs font-semibold">
                Mesa Departamental de Competitividad de Quetzaltenango
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-navy-950 p-2.5 rounded-xl hover:bg-gray-200/60 transition-colors focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none"
            aria-label="Cerrar agenda"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Bar (Días y Categorías) */}
        <div className="px-5 md:px-7 py-3 bg-white border-b border-gray-200 space-y-2.5 flex-shrink-0">
          {/* Días */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mr-2 flex-shrink-0">Filtrar Día:</span>
            {[
              { id: 0, label: "Todos los Días" },
              { id: 1, label: "Día 1 · 14 Nov 2026" },
              { id: 2, label: "Día 2 · 15 Nov 2026" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDayFilter(d.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0 focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none ${
                  dayFilter === d.id
                    ? "bg-navy-900 text-white shadow-md font-bold"
                    : "bg-gray-100 text-slate-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mr-2 flex-shrink-0">Área Temática:</span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0 focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none ${
                  catFilter === c
                    ? "bg-navy-900 text-white shadow-md font-bold"
                    : "bg-gray-100 text-slate-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Grid or Selected Speaker Detail */}
        <div className="p-5 md:p-7 overflow-y-auto flex-1 bg-white">
          {selectedSpeaker ? (
            /* Vista Detallada de la Charla y Ponente dentro del modal */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg animate-fadeup">
              <div className="bg-navy-950 text-white p-5 md:p-6 relative">
                <button
                  onClick={() => setSelectedSpeaker(null)}
                  className="inline-flex items-center gap-1.5 text-gold-300 hover:text-white text-xs font-bold mb-4 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver al programa completo
                </button>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-gold-400 flex-shrink-0 shadow-lg">
                    <img src={selectedSpeaker.photo} alt={selectedSpeaker.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <span className="inline-block bg-gold-500 text-navy-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                      {selectedSpeaker.category}
                    </span>
                    <h3 className="text-lg sm:text-2xl font-extrabold text-white">{selectedSpeaker.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium">{selectedSpeaker.role}</p>
                    <p className="text-xs text-gold-300 font-bold uppercase tracking-wider">{selectedSpeaker.org}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6 space-y-5 text-slate-700">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Conferencia Confirmada</span>
                  <h4 className="text-base sm:text-lg font-extrabold text-navy-950 leading-snug">
                    {selectedSpeaker.talkTitle}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 text-navy-900">
                      <CalSvg />
                      <span>{selectedSpeaker.talkDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-navy-900">
                      <ClockIcon className="w-4 h-4 text-gold-600" />
                      <span>{selectedSpeaker.talkTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <PinSvg />
                      <span>{selectedSpeaker.room}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Resumen de la Ponencia</h5>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{selectedSpeaker.summary}</p>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Acerca del Conferencista</h5>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 bg-gray-50 p-3.5 rounded-xl border border-slate-100">{selectedSpeaker.bio}</p>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ejes Clave</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSpeaker.topics.map((tp) => (
                      <span key={tp} className="text-xs bg-navy-50 text-navy-800 font-semibold px-2.5 py-0.5 rounded-lg border border-navy-100">
                        #{tp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    onClick={() => setSelectedSpeaker(null)}
                    className="w-full sm:w-auto border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Volver al listado
                  </button>
                  <button
                    onClick={() => handleRegister(selectedSpeaker)}
                    className="w-full sm:w-auto bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Pre-registrarse al Summit</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Listado / Grid de Ponencias del Summit */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filteredSpeakers.map((spk) => (
                <article
                  key={spk.id}
                  onClick={() => setSelectedSpeaker(spk)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSpeaker(spk);
                    }
                  }}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-gold-500 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="relative bg-slate-900 h-36 overflow-hidden">
                      <img
                        src={spk.photo}
                        alt={spk.name}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />

                      <span className="absolute top-2.5 left-2.5 bg-navy-900/90 backdrop-blur-md border border-navy-700 text-gold-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Día {spk.day} · 14-15 Nov
                      </span>

                      <span className="absolute top-2.5 right-2.5 bg-gold-500 text-navy-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        {spk.category}
                      </span>

                      <div className="absolute bottom-2.5 left-3 right-3 text-white">
                        <p className="text-sm font-extrabold leading-snug drop-shadow-sm">{spk.name}</p>
                        <p className="text-[10px] text-slate-300 font-medium line-clamp-1">{spk.role}</p>
                        <p className="text-[10px] text-gold-300 font-bold uppercase tracking-wide line-clamp-1">{spk.org}</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-bold text-navy-950 group-hover:text-navy-700 transition-colors leading-snug line-clamp-2">
                        {spk.talkTitle}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-gray-100 font-medium">
                        <div className="flex items-center gap-1.5 text-navy-900 font-semibold">
                          <ClockIcon className="w-3.5 h-3.5 text-gold-600" />
                          <span>{spk.talkTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 line-clamp-1">
                          <PinSvg />
                          <span>{spk.room}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-normal">
                        {spk.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button className="w-full bg-slate-100 group-hover:bg-navy-900 group-hover:text-white text-navy-950 font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5">
                      <span>Ver Ficha Completa</span>
                      <span className="text-sm">→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {filteredSpeakers.length === 0 && !selectedSpeaker && (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 max-w-md mx-auto my-6">
              <p className="text-navy-900 font-bold text-base mb-1">No hay conferencias con los filtros seleccionados</p>
              <p className="text-slate-500 text-xs">Intente seleccionar otro día o área temática.</p>
              <button
                onClick={() => {
                  setDayFilter(0);
                  setCatFilter("Todas");
                }}
                className="mt-4 bg-navy-900 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl"
              >
                Restablecer Filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

