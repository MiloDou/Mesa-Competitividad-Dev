import React from "react";
import { Screen, Proposal } from "../../../types/mobile";

interface VoteCastScreenProps {
  proposal: Proposal | null;
  choice: "favor" | "contra" | "abstencion" | null;
  setChoice: (c: "favor" | "contra" | "abstencion" | null) => void;
  goTo: (s: Screen) => void;
  castVote: () => void;
}

export const VoteCastScreen: React.FC<VoteCastScreenProps> = ({
  proposal,
  choice,
  setChoice,
  goTo,
  castVote,
}) => {
  if (!proposal) return null;

  return (
    <div>
      <div className="bg-navy-900 px-5 pt-5 pb-8">
        <button
          onClick={() => goTo("vote-list")}
          className="flex items-center gap-2 text-celeste-400 text-sm mb-4 transition-colors hover:text-white font-semibold"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Propuestas
        </button>
        <p className="text-celeste-400 text-xs font-bold uppercase tracking-widest mb-2">Emitir Voto</p>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-white text-2xl font-normal leading-snug">
          {proposal.title}
        </h2>
        <p className="text-celeste-400 text-sm mt-2">
          {proposal.category} · Cierre: {proposal.deadline}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-3">
        <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-2xl p-4">{proposal.desc}</p>

        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">Seleccione su opción:</p>

        {[
          {
            val: "favor" as const,
            label: "A Favor",
            sub: "Apruebo la propuesta",
            icon: "✓",
            idle: "bg-white border-2 border-slate-200 text-slate-700 hover:border-green-400",
            sel: "bg-green-600 border-2 border-green-600 text-white shadow-lg shadow-green-500/30",
          },
          {
            val: "contra" as const,
            label: "En Contra",
            sub: "Rechazo la propuesta",
            icon: "✗",
            idle: "bg-white border-2 border-slate-200 text-slate-700 hover:border-red-400",
            sel: "bg-red-600 border-2 border-red-600 text-white shadow-lg shadow-red-500/30",
          },
          {
            val: "abstencion" as const,
            label: "Abstención",
            sub: "Me abstengo de votar",
            icon: "—",
            idle: "bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-400",
            sel: "bg-slate-700 border-2 border-slate-700 text-white shadow-lg shadow-slate-500/30",
          },
        ].map((opt) => (
          <button
            key={opt.val}
            onClick={() => setChoice(opt.val)}
            className={`w-full flex items-center gap-5 rounded-2xl px-5 py-4 transition-all duration-150 active:scale-[0.98] ${
              choice === opt.val ? opt.sel : opt.idle
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${
                choice === opt.val ? "bg-white/20" : "bg-slate-100"
              }`}
            >
              <span>{opt.icon}</span>
            </div>
            <div className="text-left">
              <p className={`font-bold text-lg leading-tight ${choice === opt.val ? "" : "text-navy-900"}`}>{opt.label}</p>
              <p className={`text-sm mt-0.5 ${choice === opt.val ? "opacity-80" : "text-slate-500"}`}>{opt.sub}</p>
            </div>
            {choice === opt.val && (
              <div className="ml-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}

        <div className="pt-2 space-y-2">
          <button
            onClick={castVote}
            disabled={!choice}
            className="w-full bg-navy-900 hover:bg-navy-800 active:bg-navy-950 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-md"
          >
            Confirmar Voto
          </button>
          {!choice && <p className="text-center text-xs text-slate-400">Seleccione una opción para continuar</p>}
          <button onClick={() => goTo("vote-list")} className="w-full text-slate-400 text-sm py-2 hover:text-slate-600 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteCastScreen;
