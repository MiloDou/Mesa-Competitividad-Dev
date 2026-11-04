import React, { useEffect, useRef } from "react";
import { AgendaActivity } from "../../../types/public";
import { CalSvg, PinSvg, ClockIcon } from "../../../components/icons/PublicIcons";

interface ActivityDetailModalProps {
  activity: AgendaActivity | null;
  onClose: () => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activity, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Manejo de la tecla Esc para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Atrapar foco inicial en el botón de cierre para accesibilidad
  useEffect(() => {
    if (activity && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [activity]);

  if (!activity) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/70 backdrop-blur-sm animate-fadeup"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="bg-navy-900 px-6 py-5 flex items-start justify-between border-b border-navy-800 flex-shrink-0">
          <div>
            <span className="inline-block bg-gold-400/20 text-gold-300 border border-gold-400/40 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
              {activity.modality} · {activity.id}
            </span>
            <h3 id="activity-modal-title" className="text-white text-xl sm:text-2xl font-extrabold leading-snug">
              {activity.title}
            </h3>
            {activity.subtitle && (
              <p className="text-gold-400 text-xs sm:text-sm mt-1 font-semibold">{activity.subtitle}</p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-xl transition-colors focus:ring-2 focus:ring-gold-400 focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar modal de detalle"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll interno */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
          {/* Metadatos en cuadrícula */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center flex-shrink-0">
                <CalSvg />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Fecha</p>
                <p className="text-sm font-bold text-navy-950">{activity.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-800 flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Horario</p>
                <p className="text-sm font-bold text-navy-950">{activity.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                <PinSvg />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Ubicación / Medio</p>
                <p className="text-sm font-bold text-navy-950">{activity.location}</p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Descripción General</h4>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
              {activity.description}
            </p>
          </div>

          {/* Agenda / Puntos a tratar */}
          {activity.agendaTopics && activity.agendaTopics.length > 0 && (
            <div>
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Agenda de la Sesión</h4>
              <ul className="space-y-2">
                {activity.agendaTopics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-gold-500 text-navy-950 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-slate-700 font-medium">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activity.organizer && (
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Organizado por: <strong className="text-navy-900 font-semibold">{activity.organizer}</strong></span>
              <span className="capitalize bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-semibold">
                Estado: {activity.status || "programada"}
              </span>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all min-h-[44px] shadow-md focus:ring-2 focus:ring-gold-400 focus:outline-none"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
