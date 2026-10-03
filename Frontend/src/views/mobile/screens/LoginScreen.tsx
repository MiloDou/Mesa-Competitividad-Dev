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
      <div className="relative h-56 flex-shrink-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&h=600&fit=crop&auto=format"
          alt="Vista aérea Quetzaltenango"
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 to-navy-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-3">
            <LogoIsotype size={88} />
          </div>
          <p style={{ fontFamily: "var(--font-display)" }} className="text-white text-xl font-normal text-center leading-tight">
            Mesa Departamental de Competitividad
          </p>
          <p className="text-celeste-400 text-sm text-center mt-1">Quetzaltenango · Guatemala</p>
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
              className={`w-full bg-navy-800 rounded-2xl px-5 py-4 text-white text-base placeholder-navy-600 outline-none border-2 transition-colors ${
                loginErr && !email ? "border-red-500" : "border-transparent focus:border-navy-500"
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
              className={`w-full bg-navy-800 rounded-2xl px-5 py-4 text-white text-base placeholder-navy-600 outline-none border-2 transition-colors ${
                loginErr && !pw ? "border-red-500" : "border-transparent focus:border-navy-500"
              }`}
              placeholder="••••••••"
            />
          </div>

          {loginErr && (
            <div className="flex items-center gap-3 bg-red-900/40 border border-red-700/40 rounded-2xl px-4 py-3">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm">Complete todos los campos para continuar.</p>
            </div>
          )}

          <button
            onClick={login}
            disabled={logging}
            className="w-full bg-celeste-500 hover:bg-celeste-400 active:bg-celeste-600 disabled:opacity-60 text-navy-950 font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-celeste-500/30 flex items-center justify-center gap-2 mt-2"
          >
            {logging ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-navy-900/30 border-t-navy-900 animate-spin" />
                Ingresando…
              </>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>

          <button className="w-full text-navy-300 text-sm py-2 hover:text-white transition-colors">¿Olvidó su contraseña?</button>
        </div>
      </div>

      <div className="px-6 pb-6 text-center">
        <p style={{ fontFamily: "var(--font-mono)" }} className="text-navy-700 text-[10px]">
          v2.4.1 · Solo para miembros acreditados
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
