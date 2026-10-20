import React from "react"

interface SiteEditorHeaderProps {
  unsaved: boolean
  publishing: boolean
  published: boolean
  onPublish: () => void
}

export const SiteEditorHeader: React.FC<SiteEditorHeaderProps> = ({
  unsaved,
  publishing,
  published,
  onPublish,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div>
        <h1 className="text-lg font-bold text-navy-900 tracking-tight">
          Editor del Sitio Público
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Administre el contenido e imágenes visibles en la web. Arrastre los
          módulos o use las flechas para reordenar.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {unsaved && (
          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
            Cambios pendientes
          </span>
        )}
        <button
          onClick={onPublish}
          disabled={publishing}
          className="flex items-center gap-2 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          {publishing ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Publicando…</span>
            </>
          ) : published ? (
            <>
              <svg
                className="w-4 h-4 text-emerald-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>¡Publicado!</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              <span>Publicar cambios</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default SiteEditorHeader
