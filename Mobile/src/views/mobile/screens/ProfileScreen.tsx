import React from "react";
import { Screen } from "../../../types/mobile";

interface ProfileScreenProps {
  goTo: (s: Screen) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ goTo }) => {
  return (
    <div>
      <div className="bg-navy-950 px-5 pt-5 pb-12">
        <button
          onClick={() => goTo("home")}
          className="flex items-center gap-2 text-celeste-400 text-sm mb-5 hover:text-white transition-colors font-semibold"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Inicio
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-navy-700 rounded-2xl border-2 border-navy-600 flex items-center justify-center">
            <span style={{ fontFamily: "var(--font-mono)" }} className="text-celeste-400 text-lg font-bold">
              CM
            </span>
          </div>
          <div>
            <p className="text-white font-bold text-xl">Carlos Montúfar</p>
            <p className="text-celeste-400 text-sm font-semibold">Presidente · Comisión</p>
            <p className="text-navy-300 text-xs mt-0.5">Cámara de Comercio de Occidente</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {[
            ["Correo electrónico", "c.montufa@camaraxela.gt"],
            ["Teléfono", "+502 4567-8901"],
            ["Rol en el sistema", "Comisión — Nivel 1"],
            ["Miembro desde", "Marzo 2022"],
          ].map(([l, v], i, arr) => (
            <div key={l as string} className={`px-5 py-4 ${i < arr.length - 1 ? "border-b border-slate-100" : ""}`}>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-0.5">{l}</p>
              <p className="text-navy-900 font-semibold text-sm">{v}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => goTo("login")}
          className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold py-4 rounded-2xl text-base transition-all active:scale-[0.98]"
        >
          Cerrar sesión
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
};

export default ProfileScreen;
