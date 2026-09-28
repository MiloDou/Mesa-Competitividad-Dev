import React, { useState } from "react";
import { Project } from "../../../types/admin";
import { STATUS_CHIP } from "../../../data/admin";

interface ProjectDrawerProps {
  project: Project;
  onClose: () => void;
  canEdit: boolean;
  onSave?: (id: string, updatedFields: { pct: number; status: Project["status"] }) => void;
}

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  project,
  onClose,
  canEdit,
  onSave,
}) => {
  const [pct, setPct] = useState(project.pct);
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function save() {
    setSaving(true);
    if (onSave) {
      onSave(project.id, { pct, status });
    }
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(onClose, 1200);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white flex flex-col shadow-2xl animate-fadeup h-full z-10">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-navy-50">
          <div>
            <span style={{ fontFamily: "var(--font-mono)" }} className="text-[11px] text-slate-400">
              {project.id}
            </span>
            <h2 className="font-semibold text-navy-900 mt-1 text-base leading-snug">{project.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {project.cat} · Actualizado {project.updated}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {saved ? (
            <div className="text-center py-10 animate-fadeup">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-navy-900">Cambios guardados</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Descripción
                </label>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4">{project.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Responsable", project.lead],
                  ["Presupuesto", project.budget],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{l}</p>
                    <p className="text-sm font-semibold text-navy-900">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Estado
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["activo", "revision", "borrador", "completado"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => canEdit && setStatus(st)}
                      disabled={!canEdit}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-all border ${
                        status === st
                          ? `${STATUS_CHIP[st]} border-current`
                          : "border-slate-200 text-slate-400 hover:border-slate-400"
                      } ${!canEdit ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avance</label>
                  <span style={{ fontFamily: "var(--font-mono)" }} className="text-sm font-bold text-navy-700">
                    {pct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) => canEdit && setPct(Number(e.target.value))}
                  disabled={!canEdit}
                  className="w-full accent-navy-700 disabled:opacity-50 disabled:cursor-not-allowed h-2 rounded-full"
                />
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-navy-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </>
          )}
        </div>
        {!saved && canEdit && (
          <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>
            <button
              onClick={onClose}
              className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-4 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDrawer;
