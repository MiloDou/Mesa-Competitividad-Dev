import React from "react";
import { Screen, Meeting } from "../../../types/mobile";
import { MOBILE_MEETINGS, MOBILE_PROPOSALS } from "../../../data/mobile";
import { CalIcon, VoteIcon, DocIcon, UserIcon } from "../../../components/icons/MobileIcons";

interface HomeScreenProps {
  pendingVotes: number;
  goTo: (s: Screen) => void;
  setMeeting?: (m: Meeting) => void;
  setProposal?: (p: any) => void;
  setChoice?: (c: any) => void;
  voted?: Set<string>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  pendingVotes,
  goTo,
  setMeeting,
  setProposal,
  setChoice,
  voted = new Set(),
}) => {
  const MEETINGS = MOBILE_MEETINGS;
  const PROPOSALS = MOBILE_PROPOSALS;

  return (
    <div>
      {/* Header */}
      <div className="bg-navy-950 px-5 pt-5 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-navy-800/40 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center justify-between mb-5 relative">
          <div>
            <p className="text-celeste-400 text-sm">Buenos días,</p>
            <p className="text-white font-bold text-xl leading-tight">Carlos Montúfar</p>
            <p className="text-navy-300 text-xs mt-0.5">Presidente · Comisión</p>
          </div>
          <button
            onClick={() => goTo("profile")}
            className="w-11 h-11 bg-navy-700 rounded-full border-2 border-navy-600 flex items-center justify-center hover:border-celeste-500 transition-colors"
          >
            <span style={{ fontFamily: "var(--font-mono)" }} className="text-celeste-400 text-xs font-bold">
              CM
            </span>
          </button>
        </div>

        {/* Next meeting card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-celeste-400 rounded-full animate-pulse" />
            <p className="text-celeste-300 text-xs font-bold uppercase tracking-widest">Próxima Sesión</p>
          </div>
          <p className="text-white font-bold text-base">Sesión Ordinaria No. 021</p>
          <p className="text-navy-300 text-sm mt-0.5">Mañana · 9:00 AM · CUNOC</p>
          <button
            onClick={() => {
              if (setMeeting) setMeeting(MEETINGS[0]);
              goTo("meeting-detail");
            }}
            className="mt-3 w-full bg-celeste-500 hover:bg-celeste-400 active:bg-celeste-600 text-navy-950 font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
          >
            Ver detalles →
          </button>
        </div>
      </div>

      <div className="px-5 -mt-5 space-y-5">
        {/* Quick action grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Mis Reuniones", icon: <CalIcon className="w-7 h-7" />, id: "meetings" as Screen, bg: "bg-navy-900 text-white", badge: 0 },
            { label: "Votar Ahora", icon: <VoteIcon className="w-7 h-7" />, id: "vote-list" as Screen, bg: "bg-celeste-500 text-navy-950", badge: pendingVotes },
            { label: "Documentos", icon: <DocIcon className="w-7 h-7" />, id: "documents" as Screen, bg: "bg-slate-100 text-slate-700", badge: 0 },
            { label: "Mi Perfil", icon: <UserIcon className="w-7 h-7" />, id: "profile" as Screen, bg: "bg-slate-100 text-slate-700", badge: 0 },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => goTo(a.id)}
              className={`relative flex flex-col items-center justify-center gap-3 py-6 rounded-2xl font-bold text-sm transition-all active:scale-[0.96] ${a.bg}`}
            >
              {a.icon}
              {a.label}
              {a.badge > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {a.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending votes */}
        {pendingVotes > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pendiente de su voto</p>
            {PROPOSALS.filter((p) => !voted.has(p.id)).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  if (setProposal) setProposal(p);
                  if (setChoice) setChoice(null);
                  goTo("vote-cast");
                }}
                className="w-full text-left bg-celeste-50 border-2 border-celeste-300 hover:border-celeste-500 rounded-2xl p-4 mb-2 transition-all active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-celeste-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-navy-950 font-bold text-base">!</span>
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-sm leading-snug">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Cierra: {p.deadline}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="h-2" />
      </div>
    </div>
  );
};

export default HomeScreen;
