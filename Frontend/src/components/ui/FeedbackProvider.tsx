import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface FeedbackContextType {
  toast: (opts: ToastOptions | string, type?: ToastType) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

let globalFeedback: FeedbackContextType | null = null;

/** Helper para invocar toasts o confirmación fuera de componentes si fuera necesario */
export const feedback = {
  toast: (opts: ToastOptions | string, type?: ToastType) => globalFeedback?.toast(opts, type),
  success: (message: string, title?: string) => globalFeedback?.showSuccess(message, title),
  error: (message: string, title?: string) => globalFeedback?.showError(message, title),
  warning: (message: string, title?: string) => globalFeedback?.showWarning(message, title),
  info: (message: string, title?: string) => globalFeedback?.showInfo(message, title),
  confirm: (opts: ConfirmOptions | string) => globalFeedback ? globalFeedback.confirm(opts) : Promise.resolve(window.confirm(typeof opts === "string" ? opts : opts.message)),
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: ToastOptions | string, typeOverride?: ToastType) => {
    const isString = typeof opts === "string";
    const message = isString ? opts : opts.message;
    const type = typeOverride || (!isString && opts.type) || "info";
    const title = !isString && opts.title ? opts.title : (
      type === "success" ? "Operación exitosa" :
      type === "error" ? "Error en la solicitud" :
      type === "warning" ? "Advertencia" : "Información"
    );
    const duration = (!isString && opts.duration) || (type === "error" ? 5000 : 3500);

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = { id, title, message, type };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Máximo 5 toasts en pantalla

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showSuccess = useCallback((message: string, title?: string) => {
    toast({ message, title: title || "Operación exitosa", type: "success" });
  }, [toast]);

  const showError = useCallback((message: string, title?: string) => {
    toast({ message, title: title || "Error en la solicitud", type: "error" });
  }, [toast]);

  const showWarning = useCallback((message: string, title?: string) => {
    toast({ message, title: title || "Atención", type: "warning" });
  }, [toast]);

  const showInfo = useCallback((message: string, title?: string) => {
    toast({ message, title: title || "Información del sistema", type: "info" });
  }, [toast]);

  const confirm = useCallback((opts: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const options: ConfirmOptions = typeof opts === "string" ? { message: opts } : opts;
      setConfirmDialog({
        isOpen: true,
        options,
        resolve: (result: boolean) => {
          setConfirmDialog(null);
          resolve(result);
        },
      });
    });
  }, []);

  const value = {
    toast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    confirm,
  };

  globalFeedback = value;

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" && createPortal(
        <>
          {/* Contenedor flotante de notificaciones Toast */}
          <div
            aria-live="assertive"
            className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role="alert"
                className={`pointer-events-auto transform transition-all duration-300 animate-fadeup flex items-start gap-3.5 p-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
                  t.type === "success"
                    ? "bg-navy-950/95 text-white border-emerald-500/50 shadow-emerald-950/40"
                    : t.type === "error"
                    ? "bg-navy-950/95 text-white border-red-500/50 shadow-red-950/40"
                    : t.type === "warning"
                    ? "bg-navy-950/95 text-white border-amber-500/50 shadow-amber-950/40"
                    : "bg-navy-950/95 text-white border-celeste-500/50 shadow-navy-950/40"
                }`}
              >
                {/* Ícono de Estado */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    t.type === "success"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : t.type === "error"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : t.type === "warning"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-celeste-500/20 text-celeste-400 border border-celeste-500/30"
                  }`}
                >
                  {t.type === "success" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {t.type === "error" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {t.type === "warning" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {t.type === "info" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2">
                    <h4
                      style={{ fontFamily: "var(--font-display)" }}
                      className="text-xs font-bold tracking-wide uppercase text-slate-200"
                    >
                      {t.title}
                    </h4>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        t.type === "success"
                          ? "bg-emerald-400"
                          : t.type === "error"
                          ? "bg-red-400"
                          : t.type === "warning"
                          ? "bg-amber-400"
                          : "bg-celeste-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-medium break-words">
                    {t.message}
                  </p>
                </div>

                {/* Botón cerrar */}
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
                  title="Cerrar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Modal flotante de Confirmación personalizada */}
          {confirmDialog?.isOpen && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs animate-fadeup">
              <div
                className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
                role="dialog"
                aria-modal="true"
              >
                {/* Cabecera con degradado distintivo de la Mesa */}
                <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 p-6 text-white flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      confirmDialog.options.type === "danger"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-gold-500/20 text-gold-400 border border-gold-500/30"
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={
                          confirmDialog.options.type === "danger"
                            ? "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        }
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)" }} className="text-base font-bold text-white">
                      {confirmDialog.options.title || "Confirmar Acción"}
                    </h3>
                    <p className="text-xs text-navy-200 mt-0.5">Mesa Departamental de Competitividad</p>
                  </div>
                </div>

                {/* Cuerpo del mensaje */}
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                    {confirmDialog.options.message}
                  </p>
                </div>

                {/* Acciones */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => confirmDialog.resolve(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {confirmDialog.options.cancelText || "Cancelar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDialog.resolve(true)}
                    className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-colors cursor-pointer shadow-sm ${
                      confirmDialog.options.type === "danger"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-navy-900 hover:bg-navy-800"
                    }`}
                  >
                    {confirmDialog.options.confirmText || "Aceptar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return ctx;
};
