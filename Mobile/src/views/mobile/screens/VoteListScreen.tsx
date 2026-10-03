import React from "react";
import { Screen, Proposal } from "../../../types/mobile";
import { MOBILE_PROPOSALS } from "../../../data/mobile";

interface VoteListScreenProps {
  goTo: (s: Screen) => void;
  setProposal: (p: Proposal) => void;
  voted: Set<string>;
}

const ScreenHeader: React.FC<{ title: string; sub: string; onBack: () => void }> = ({ title, sub, onBack }) => (
  <div className="bg-navy-950 px-5 pt-5 pb-6">
    <button onClick={onBack} className="flex items-center gap-2 text-celeste-400 hover:text-white text-sm mb-3 transition-colors font-semibold">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Inicio
    </button>
    <h2 style={{ fontFamily: "var(--font-display)" }} className="text-white text-3xl font-normal">
      {title}
    </h2>
    <p className="text-celeste-400 text-sm mt-0.5 font-medium">{sub}</p>
  </div>
);

export const VoteListScreen: React.FC<VoteListScreenProps> = ({ goTo, setProposal, voted }) => {
  const PROPOSALS = MOBILE_PROPOSALS;
  const pendingVotes = PROPOSALS.filter((p) => !voted.has(p.id)).length;

  return (
    <div>
      <ScreenHeader title="Votar en Propuestas" sub={`${pendingVotes} propuesta(s) pendiente(s)`} onBack={() => goTo("home")} />
      <div className="px-4 pt-3 space-y-4">
        {PROPOSALS.map((p) => {
          const v = voted.has(p.id);
          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                v ? "border-green-300 opacity-80" : "border-slate-200 hover:border-navy-300"
              }`}
            >
              <div className={`px-5 pt-4 pb-3 ${v ? "bg-green-50" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{p.category}</span>
                  {v ? (
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Votado
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-0.5 rounded-full">Pendiente</span>
                  )}
                </div>
                <h3 className="font-bold text-navy-900 text-base leading-snug mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-3">{p.desc}</p>

                {/* Results bar */}
                <div className="h-2 rounded-full overflow-hidden flex mb-1.5" style={{ background: "#f1f5f9" }}>
                  <div className="bg-green-500 h-full" style={{ width: `${(p.favor / p.total) * 100}%` }} />
                  <div className="bg-red-500 h-full" style={{ width: `${(p.contra / p.total) * 100}%` }} />
                  <div className="bg-slate-300 h-full" style={{ width: `${(p.abstencion / p.total) * 100}%` }} />
                </div>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="text-green-600 font-semibold">A favor: {p.favor}</span>
                  <span className="text-red-600 font-semibold">En contra: {p.contra}</span>
                  <span>Abs.: {p.abstencion}</span>
                  <span className="ml-auto text-slate-400">de {p.total}</span>
                </div>
              </div>
              {!v && (
                <div className="px-5 pb-4">
                  <button
                    onClick={() => {
                      setProposal(p);
                      goTo("vote-cast");
                    }}
                    className="w-full bg-navy-900 hover:bg-navy-800 active:bg-navy-950 text-white font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                  >
                    Emitir mi voto →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoteListScreen;
