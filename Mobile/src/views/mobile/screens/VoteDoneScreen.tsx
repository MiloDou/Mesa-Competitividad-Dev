import React from "react";
import { Screen, Proposal } from "../../../types/mobile";

interface VoteDoneScreenProps {
  proposal: Proposal | null;
  choice: "favor" | "contra" | "abstencion" | null;
  goTo: (s: Screen) => void;
  setProposal?: (p: Proposal | null) => void;
  setChoice?: (c: "favor" | "contra" | "abstencion" | null) => void;
}

export const VoteDoneScreen: React.FC<VoteDoneScreenProps> = ({
  proposal,
  choice,
  goTo,
  setProposal,
  setChoice,
}) => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 text-center py-10">
      <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
        <svg className="w-14 h-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 style={{ fontFamily: "var(--font-display)" }} className="text-navy-900 text-3xl font-normal mb-2">
        ¡Voto registrado!
      </h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-2 max-w-[260px]">
        Su voto para <strong className="text-navy-800">{proposal?.title}</strong> fue registrado exitosamente.
      </p>
      <p style={{ fontFamily: "var(--font-mono)" }} className="text-slate-400 text-xs mb-8">
        10 Sep 2026 · {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
      </p>

      {/* Vote badge */}
      <div
        className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-xl mb-8 ${
          choice === "favor" ? "bg-green-100 text-green-700" : choice === "contra" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
        }`}
      >
        {choice === "favor" ? (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : choice === "contra" ? (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl font-bold">—</span>
        )}
        {choice === "favor" ? "A Favor" : choice === "contra" ? "En Contra" : "Abstención"}
      </div>

      <div className="w-full space-y-2">
        <button
          onClick={() => {
            if (setProposal) setProposal(null);
            if (setChoice) setChoice(null);
            goTo("vote-list");
          }}
          className="w-full bg-navy-900 text-white font-bold py-4 rounded-2xl text-base active:scale-[0.98] transition-all"
        >
          Ver otras propuestas
        </button>
        <button onClick={() => goTo("home")} className="w-full text-slate-400 text-sm py-2">
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default VoteDoneScreen;
