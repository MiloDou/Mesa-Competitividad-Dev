import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { SummitSpeaker } from "../../../types/public"
import { SUMMIT_SPEAKERS } from "../../../data/public"
import { LogoIsotype } from "../../../Logo"
import {
  CalSvg,
  PinSvg,
  ClockIcon,
} from "../../../components/icons/PublicIcons"

interface SummitAgendaModalProps {
  onClose: () => void
  speakers?: SummitSpeaker[]
  onSelectSpeakerToRegister?: (speaker: SummitSpeaker) => void
  initialSpeaker?: SummitSpeaker | null
}

export function SummitAgendaModal({
  onClose,
  speakers = SUMMIT_SPEAKERS,
  onSelectSpeakerToRegister,
  initialSpeaker,
}: SummitAgendaModalProps) {
  const [dayFilter, setDayFilter] = useState<number>(0)
  const [periodFilter, setPeriodFilter] = useState<"todos" | "mañana" | "tarde">("todos")
  const [selectedSpeaker, setSelectedSpeaker] = useState<SummitSpeaker | null>(
    initialSpeaker ?? null,
  )

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selectedSpeaker) {
          setSelectedSpeaker(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, selectedSpeaker])

  // Filtrado por día/evento, por horario (matutino/vespertino) y orden cronológico
  const filteredSpeakers = speakers
    .filter((spk) => {
      if (dayFilter !== 0 && spk.day !== dayFilter) return false
      if (periodFilter !== "todos" && spk.period !== periodFilter) return false
      return true
    })
    .sort((a, b) => {
      return a.talkTime.localeCompare(b.talkTime)
    })

  const handleRegister = (spk: SummitSpeaker) => {
    onClose()
    if (onSelectSpeakerToRegister) {
      onSelectSpeakerToRegister(spk)
    }
  }

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
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filter Bar: Exactamente como Comunicados y Noticias con Horarios Matutino/Vespertino */}
        <div className="px-6 md:px-8 py-3.5 bg-white border-b border-gray-200 flex flex-wrap items-center gap-2 overflow-x-auto flex-shrink-0">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mr-1 flex-shrink-0">
            Filtrar:
          </span>
          {[
            { id: 0, label: "Todo el Evento" },
            { id: 1, label: "Pre-Congreso" },
            { id: 2, label: "Summit 2026" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDayFilter(d.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none cursor-pointer ${
                dayFilter === d.id
                  ? "bg-navy-900 text-white shadow-md font-bold"
                  : "bg-gray-100 text-slate-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              {d.label}
            </button>
          ))}

          <span className="h-4 w-px bg-gray-300 mx-1 hidden sm:inline-block flex-shrink-0" />

          {/* Filtros de Jornada Horaria: Matutino / Vespertino */}
          {[
            { id: "todos", label: "Todas las horas" },
            { id: "mañana", label: "Matutino (Mañana)" },
            { id: "tarde", label: "Vespertino (Tarde)" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodFilter(p.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none cursor-pointer ${
                periodFilter === p.id
                  ? "bg-gold-500 text-navy-950 shadow-md font-extrabold"
                  : "bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}

          <span className="ml-auto text-xs font-semibold text-slate-400 hidden md:inline">
            {filteredSpeakers.length} actividades
          </span>
        </div>

        {/* Content Body: Grid or Selected Speaker Detail */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white">
          {selectedSpeaker ? (
            /* Vista Detallada de la Actividad / Ponencia dentro del modal */
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl animate-fadeup max-w-3xl mx-auto">
              <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-[#172554] text-white p-6 md:p-8 relative">
                <button
                  onClick={() => setSelectedSpeaker(null)}
                  className="inline-flex items-center gap-2 text-gold-300 hover:text-white text-xs font-bold mb-4 transition-colors group cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>Volver a la agenda</span>
                </button>

                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {selectedSpeaker.photo && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-gold-400 flex-shrink-0 shadow-lg bg-navy-900">
                      <img
                        src={selectedSpeaker.photo}
                        alt={selectedSpeaker.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                      <span className="bg-[#E5B82E] text-navy-950 text-[11px] font-black px-3 py-0.5 rounded-md uppercase tracking-wider">
                        {selectedSpeaker.category}
                      </span>
                      <span className="bg-white/10 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-white/15">
                        {selectedSpeaker.day === 1 ? "Pre-Congreso" : "Summit 2026"}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight mb-2">
                      {selectedSpeaker.talkTitle}
                    </h3>
                    <p className="text-sm sm:text-base text-gold-200 font-semibold">
                      {selectedSpeaker.name}
                    </p>
                    {selectedSpeaker.role && (
                      <p className="text-xs text-slate-300 font-normal">
                        {selectedSpeaker.role} · <span className="text-white font-medium">{selectedSpeaker.org}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6 text-slate-700 bg-white">
                {/* Cuadros informativos de horario y sala */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-navy-100 text-navy-950 flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="w-4 h-4 text-navy-900" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Horario</p>
                      <p className="text-xs sm:text-sm font-bold text-navy-950">{selectedSpeaker.talkTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-navy-100 text-navy-950 flex items-center justify-center flex-shrink-0">
                      <CalSvg />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Fecha</p>
                      <p className="text-xs sm:text-sm font-bold text-navy-950">{selectedSpeaker.talkDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-navy-100 text-navy-950 flex items-center justify-center flex-shrink-0">
                      <PinSvg />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Ubicación / Sala</p>
                      <p className="text-xs sm:text-sm font-bold text-navy-950 truncate">{selectedSpeaker.room}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Descripción y Objetivos
                  </h5>
                  <p className="text-sm leading-relaxed text-slate-700 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                    {selectedSpeaker.summary}
                  </p>
                </div>

                {selectedSpeaker.bio && (
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Acerca del Participante o Entidad
                    </h5>
                    <p className="text-sm leading-relaxed text-slate-600 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
                      {selectedSpeaker.bio}
                    </p>
                  </div>
                )}

                {selectedSpeaker.topics && selectedSpeaker.topics.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Temas Clave
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpeaker.topics.map((tp) => (
                        <span
                          key={tp}
                          className="text-xs bg-navy-50 text-navy-900 font-semibold px-3 py-1 rounded-lg border border-navy-100"
                        >
                          #{tp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedSpeaker(null)}
                    className="w-full sm:w-auto text-slate-600 hover:text-navy-950 font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    ← Volver a la agenda
                  </button>
                  <button
                    onClick={() => handleRegister(selectedSpeaker)}
                    className="w-full sm:w-auto bg-navy-950 hover:bg-navy-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Pre-registrarse al evento</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Grid view estilo Comunicados y Noticias */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpeakers.map((spk) => (
                <article
                  key={spk.id}
                  onClick={() => setSelectedSpeaker(spk)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedSpeaker(spk)
                    }
                  }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden group cursor-pointer hover:border-gold-500 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:outline-none transition-all duration-300 flex flex-col"
                >
                  {/* Imagen superior con badges de categoría y evento bien separados */}
                  <div className="overflow-hidden h-44 relative bg-slate-50 flex items-center justify-center p-2 flex-shrink-0 border-b border-gray-100">
                    <img
                      src={spk.photo || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&h=450&fit=crop&auto=format"}
                      alt={spk.talkTitle}
                      loading="lazy"
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                      <span className="bg-[#E5B82E] text-navy-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm max-w-[60%] truncate">
                        {spk.category}
                      </span>
                      <span className="bg-navy-950/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-sm shrink-0">
                        {spk.day === 1 ? "Pre-Congreso" : "Summit 2026"}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-navy-950 text-base leading-snug mb-2 group-hover:text-navy-700 transition-colors line-clamp-2">
                        {spk.talkTitle}
                      </h3>

                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 mb-3 font-normal">
                        {spk.summary}
                      </p>

                      <div className="text-[11px] text-slate-500 font-medium mb-1 truncate">
                        <span className="font-bold text-navy-900">{spk.name}</span>
                        {spk.org && <span className="text-slate-400"> · {spk.org}</span>}
                      </div>
                    </div>

                    {/* Footer de la tarjeta: Horario y Enlace de acción */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[11px] text-slate-500 font-medium mt-3">
                      <span className="flex items-center gap-1.5 font-bold text-navy-900">
                        <ClockIcon className="w-3.5 h-3.5 text-gold-600" />
                        <span>{spk.talkTime}</span>
                      </span>
                      <span className="text-gold-700 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Ver detalles →
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {filteredSpeakers.length === 0 && !selectedSpeaker && (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 max-w-md mx-auto my-6">
              <p className="text-navy-900 font-bold text-base mb-1">
                No hay actividades registradas para esta jornada
              </p>
              <p className="text-slate-500 text-xs">
                Seleccione otra opción para visualizar la programación.
              </p>
              <button
                onClick={() => {
                  setDayFilter(0)
                  setPeriodFilter("todos")
                }}
                className="mt-4 bg-navy-950 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl cursor-pointer hover:bg-navy-900 transition-colors"
              >
                Restablecer Vista
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default SummitAgendaModal

