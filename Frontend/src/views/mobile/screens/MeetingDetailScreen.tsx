import React from "react";
import { Screen, Meeting } from "../../../types/mobile";

interface MeetingDetailScreenProps {
  meeting: Meeting | null;
  goTo: (s: Screen) => void;
}

export const MeetingDetailScreen: React.FC<MeetingDetailScreenProps> = ({ meeting, goTo }) => {
  if (!meeting) return null;

  return (
    <div>
      <div className="bg-navy-900 px-5 pt-5 pb-10">
        <button
          onClick={() => goTo("meetings")}
          className="flex items-center gap-2 text-celeste-400 hover:text-white text-sm mb-4 transition-colors font-semibold"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Reuniones
        </button>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 inline-block ${
            meeting.virtual ? "bg-navy-700 text-navy-300" : "bg-navy-700 text-navy-300"
          }`}
        >
          {meeting.virtual ? "Virtual" : "Presencial"}
        </span>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-white text-3xl font-normal mt-1">
          {meeting.title}
        </h2>
        <p className="text-celeste-400 mt-1">{meeting.subtitle}</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Fecha", meeting.date],
              ["Hora", meeting.time],
              ["Lugar", meeting.loc],
              ["Tipo", meeting.subtitle],
            ].map(([l, v]) => (
              <div key={l as string}>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">{l}</p>
                <p className="font-semibold text-navy-900 text-sm leading-snug">{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-navy-900 mb-4">Agenda de la sesión</h3>
          <ol className="space-y-3">
            {meeting.agenda.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <button className="w-full bg-navy-900 hover:bg-navy-800 active:bg-navy-950 text-white font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Confirmar Asistencia
        </button>
        {meeting.virtual && (
          <button className="w-full border-2 border-navy-900 text-navy-900 hover:bg-navy-50 font-bold text-base py-3.5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Unirse a Videoconferencia
          </button>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default MeetingDetailScreen;
