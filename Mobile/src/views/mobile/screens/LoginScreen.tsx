import React from "react";
import { LogoIsotype } from "../../../Logo";

interface LoginScreenProps {
  email: string;
  setEmail: (e: string) => void;
  pw: string;
  setPw: (p: string) => void;
  loginErr: boolean;
  logging: boolean;
  login: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  email,
  setEmail,
  pw,
  setPw,
  loginErr,
  logging,
  login,
}) => {
  return (
    <div className="min-h-full flex flex-col bg-navy-950">
      {/* Top decoration */}
      <div className="relative h-60 pt-[env(safe-area-inset-top,1.5rem)] flex-shrink-0 overflow-hidden bg-navy-950">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/30 via-navy-950 to-navy-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-3">
            <LogoIsotype size={88} />
          </div>
          <p className="text-white text-xl font-bold text-center leading-tight">
            Mesa Departamental de Competitividad
          </p>
          <p className="text-gold-400 text-sm text-center mt-1 font-semibold">Quetzaltenango · Guatemala</p>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-8">
        <h2 className="text-white font-bold text-xl mb-6">Iniciar sesión</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-navy-200 text-sm font-semibold mb-2">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-navy-900 rounded-2xl px-5 py-4 text-white text-base placeholder-navy-500 outline-none border-2 transition-colors ${
                loginErr && !email ? "border-brand-red" : "border-navy-800 focus:border-brand-blue"
              }`}
              placeholder="correo@organizacion.gt"
            />
          </div>
          <div>
            <label className="block text-navy-200 text-sm font-semibold mb-2">Contraseña</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className={`w-full bg-navy-900 rounded-2xl px-5 py-4 text-white text-base placeholder-navy-500 outline-none border-2 transition-colors ${
                loginErr && !pw ? "border-brand-red" : "border-navy-800 focus:border-brand-blue"
              }`}
              placeholder="••••••••"
            />
          </div>

          {loginErr && (
            <div className="flex items-center gap-3 bg-red-950/40 border border-brand-red/40 rounded-2xl px-4 py-3">
              <svg className="w-4 h-4 text-brand-red flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm font-semibold">Complete todos los campos para continuar.</p>
            </div>
          )}

          <button
            onClick={login}
            disabled={logging}
            className="w-full bg-gradient-to-r from-brand-blue to-navy-700 hover:from-navy-700 hover:to-brand-blue active:scale-[0.98] disabled:opacity-60 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg shadow-brand-blue/30 flex items-center justify-center gap-2 mt-2"
          >
            {logging ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Ingresando…
              </>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>

          <button className="w-full text-navy-300 text-sm py-2 hover:text-white transition-colors font-medium">¿Olvidó su contraseña?</button>
        </div>
      </div>

      <div className="px-6 pb-6 text-center">
        <p style={{ fontFamily: "var(--font-mono)" }} className="text-navy-500 text-[10px]">
          v2.4.1 · Solo para miembros acreditados
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
