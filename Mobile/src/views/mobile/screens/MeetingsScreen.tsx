import React from "react";
import { Screen, Meeting } from "../../../types/mobile";
import { MOBILE_MEETINGS } from "../../../data/mobile";
import { ClockIcon, PinIcon } from "../../../components/icons/MobileIcons";

interface MeetingsScreenProps {
  goTo: (s: Screen) => void;
  setMeeting: (m: Meeting) => void;
}

const ScreenHeader: React.FC<{ title: string; sub: string; onBack: () => void }> = ({ title, sub, onBack }) => (
  <div className="bg-navy-950 px-5 pt-5 pb-6">
    <button onClick={onBack} className="flex items-center gap-2 text-celeste-400 hover:text-white text-sm mb-3 transition-colors font-semibold">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Inicio
    </button>
    <h2 style={{ fontFamily: "var(--font-display)" }} className="text-white text-2xl font-normal">
      {title}
    </h2>
    <p className="text-navy-300 text-xs mt-0.5">{sub}</p>
  </div>
);

export const MeetingsScreen: React.FC<MeetingsScreenProps> = ({ goTo, setMeeting }) => {
  const MEETINGS = MOBILE_MEETINGS;

  return (
    <div>
      <ScreenHeader title="Mis Reuniones" sub="Sesiones programadas" onBack={() => goTo("home")} />
      <div className="px-4 pt-3 space-y-3">
        {MEETINGS.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMeeting(m);
              goTo("meeting-detail");
            }}
            className="w-full text-left bg-white border border-slate-200 hover:border-navy-300 hover:shadow-md rounded-2xl p-4 transition-all active:scale-[0.98] group"
          >
            <div className="flex gap-4 items-start">
              <div className={`rounded-2xl p-3 text-center flex-shrink-0 min-w-[54px] ${m.urgent ? "bg-navy-900" : "bg-navy-50"}`}>
                <p
                  style={{ fontFamily: "var(--font-display)" }}
                  className={`text-2xl font-normal leading-none ${m.urgent ? "text-celeste-400" : "text-navy-700"}`}
                >
                  {m.dateNum}
                </p>
                <p className={`text-xs mt-0.5 font-semibold ${m.urgent ? "text-navy-400" : "text-navy-400"}`}>{m.dateMonth}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy-900 text-base">{m.title}</p>
                    <p className="text-xs text-slate-500">{m.subtitle}</p>
                  </div>
                  {m.urgent && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">Mañana</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {m.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <PinIcon className="w-3 h-3" />
                    {m.loc}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.virtual ? "bg-slate-100 text-slate-600" : "bg-navy-50 text-navy-700"}`}>
                    {m.virtual ? "Virtual" : "Presencial"}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MeetingsScreen;
