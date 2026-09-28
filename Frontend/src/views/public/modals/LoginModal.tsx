import React, { useState } from "react";
import { LogoIsotype } from "../../../Logo";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [logging, setLogging] = useState(false);
  const [loginErr, setLoginErr] = useState(false);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) {
      setLoginErr(true);
      return;
    }
    setLoginErr(false);
    setLogging(true);
    setTimeout(() => {
      setLogging(false);
      onLoginSuccess();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 modal-backdrop animate-fadeup" onClick={onClose}>
      <div className="relative w-full max-w-md bg-navy-900 border border-navy-700 rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Top close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-navy-400 hover:text-white p-2 rounded-xl hover:bg-navy-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header decoration */}
        <div className="p-8 pb-6 text-center border-b border-navy-800 bg-navy-950/50">
          <div className="inline-block mb-3">
            <LogoIsotype size={64} />
          </div>
          <h3 style={{ fontFamily: "var(--font-display)" }} className="text-white text-2xl font-normal">
            Acceso Administrativo
          </h3>
          <p className="text-navy-400 text-xs mt-1">
            Sistema Interno de la Mesa de Competitividad
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4" noValidate>
          {loginErr && (
            <div className="flex items-center gap-3 bg-red-900/40 border border-red-700/40 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-xs">Complete todos los campos obligatorios.</p>
            </div>
          )}

          <div>
            <label className="block text-navy-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Correo Institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mesa-quetzaltenango.gt"
              className="w-full bg-navy-950 border border-navy-700 focus:border-celeste-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-navy-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-navy-950 border border-navy-700 focus:border-celeste-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={logging}
            className="w-full bg-celeste-500 hover:bg-celeste-400 active:bg-celeste-600 disabled:opacity-60 text-navy-950 font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-celeste-500/20 flex items-center justify-center gap-2 mt-4"
          >
            {logging ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-navy-950/30 border-t-navy-950 animate-spin" />
                Validando credenciales…
              </>
            ) : (
              "Ingresar al Dashboard"
            )}
          </button>

          <p className="text-[11px] text-navy-500 text-center mt-3">
            Acceso restringido únicamente para personal autorizado.
          </p>
        </form>
      </div>
    </div>
  );
}
