import React, { useState } from "react";
import { MEMBERS } from "../../../data/admin";

interface MinuteModalProps {
  id: string;
  onClose: () => void;
}

export const MinuteModal: React.FC<MinuteModalProps> = ({ id, onClose }) => {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-navy-900 text-xl font-normal">
              Acta de Reunión
            </h2>
            <p style={{ fontFamily: "var(--font-mono)" }} className="text-slate-400 text-xs mt-0.5">
              {id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          {exported ? (
            <div className="text-center py-8 animate-fadeup">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-navy-900">PDF generado exitosamente</p>
              <p className="text-slate-500 text-sm mt-1">El archivo está listo para descarga y publicación.</p>
              <div className="flex gap-3 justify-center mt-5">
                <button className="bg-navy-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-navy-800 transition-colors">
                  Descargar PDF
                </button>
                <button
                  onClick={onClose}
                  className="border border-slate-200 text-slate-600 font-medium text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-navy-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm">
                {[
                  ["Sesión", "Ordinaria No. 021 / 2026"],
                  ["Fecha", "18 de septiembre de 2026"],
                  ["Lugar", "Sala de Sesiones, CUNOC"],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{l}</p>
                    <p className="font-semibold text-navy-900 mt-0.5 text-sm">{v}</p>
                  </div>
                ))}
              </div>
              {[
                ["Agenda", "1. Lectura y aprobación del acta anterior\n2. Informe de avance PRY-001 Corredor Logístico\n3. Votación Plan Operativo 2027\n4. Puntos varios", 4],
                ["Acuerdos y Resoluciones", "", 5],
                ["Observaciones", "", 3],
              ].map(([l, v, r]) => (
                <div key={l as string}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{l as string}</label>
                  <textarea
                    rows={r as number}
                    className="input resize-none text-sm"
                    defaultValue={v as string}
                    placeholder={!(v as string) ? `Registre ${(l as string).toLowerCase()}…` : undefined}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Lista de Asistencia</label>
                <div className="grid grid-cols-2 gap-2">
                  {MEMBERS.slice(0, 6).map((m) => (
                    <label key={m.name} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 accent-navy-700 w-4 h-4" />
                      <span className="text-sm text-slate-700">{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setExporting(true);
                    setTimeout(() => {
                      setExporting(false);
                      setExported(true);
                    }, 2000);
                  }}
                  disabled={exporting}
                  className="flex-1 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Generando PDF…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Exportar PDF
                    </>
                  )}
                </button>
                <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-4 py-3 rounded-xl transition-colors">
                  Guardar borrador
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinuteModal;
