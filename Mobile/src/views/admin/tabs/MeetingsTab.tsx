import React from "react";
import { ADMIN_MEETINGS } from "../../../data/admin";
import { PlusIcon, CalIcon, ClockIcon, PinIcon, DocIcon } from "../../../components/icons/AdminIcons";

interface MeetingsTabProps {
  canEdit: boolean;
  newMeeting: boolean;
  setNewMeeting: (v: boolean) => void;
  openMinute: (id: string) => void;
}

export const MeetingsTab: React.FC<MeetingsTabProps> = ({
  canEdit,
  newMeeting,
  setNewMeeting,
  openMinute,
}) => {
  const MEETINGS = ADMIN_MEETINGS;

  return (
    <div className="space-y-5 animate-fadeup">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy-900">Calendario de Sesiones</h2>
        {canEdit && (
          <button
            onClick={() => setNewMeeting(true)}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Programar Reunión
          </button>
        )}
      </div>
      {newMeeting && (
        <div className="bg-white border border-navy-200 rounded-xl p-6 shadow-sm animate-fadeup">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-navy-900">Nueva Reunión</h3>
            <button onClick={() => setNewMeeting(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ["Título de la sesión", "text", "Ej. Sesión Ordinaria No. 023"],
              ["Fecha", "date", ""],
              ["Hora de inicio", "time", ""],
              ["Lugar / enlace", "text", "Sala de sesiones / URL zoom"],
            ].map(([l, t, p]) => (
              <div key={l as string}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{l as string}</label>
                <input
                  type={t as string}
                  className="input text-sm"
                  placeholder={p as string}
                  defaultValue={t === "date" ? "2026-10-01" : t === "time" ? "09:00" : ""}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo</label>
              <select className="input text-sm">
                <option>Sesión Ordinaria</option>
                <option>Mesa de Trabajo</option>
                <option>Comisión Especial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Modalidad</label>
              <select className="input text-sm">
                <option>Presencial</option>
                <option>Virtual</option>
                <option>Híbrida</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
              Guardar y Notificar
            </button>
            <button
              onClick={() => setNewMeeting(false)}
              className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        {MEETINGS.map((m) => (
          <div key={m.id} className={`bg-white rounded-xl border overflow-hidden ${m.status === "upcoming" ? "border-navy-200" : "border-slate-200"}`}>
            <div className={`px-5 py-3 flex items-center justify-between ${m.status === "upcoming" ? "bg-navy-50" : "bg-slate-50"}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === "upcoming" ? "bg-navy-800 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {m.status === "upcoming" ? "Programada" : "Realizada"}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-slate-400">
                  {m.id}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">{m.n} participantes</span>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-navy-900 mb-3 leading-snug">{m.title}</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <CalIcon className="w-3 h-3 flex-shrink-0" />
                  {m.date}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <ClockIcon className="w-3 h-3 flex-shrink-0" />
                  {m.time}
                </div>
                <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
                  <PinIcon className="w-3 h-3 flex-shrink-0" />
                  {m.loc}
                </div>
              </dl>
              <div className="flex gap-2 flex-wrap">
                {m.status === "done" ? (
                  <>
                    {m.file && (
                      <a
                        href="#"
                        className="flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-900 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <DocIcon className="w-3.5 h-3.5" />
                        Acta PDF
                      </a>
                    )}
                    {!m.file && canEdit && (
                      <button
                        onClick={() => openMinute(m.id)}
                        className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Generar Acta
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button className="text-xs font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors">
                      Ver Convocatoria
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => openMinute(m.id)}
                        className="text-xs font-semibold text-celeste-700 bg-celeste-50 hover:bg-celeste-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Preparar Acta
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingsTab;
