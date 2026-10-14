import React from "react"
import { PlusIcon, TrashIcon } from "../../../../components/icons/AdminIcons"
import { CustomDatePicker } from "../../../../components/ui/CustomDatePicker"

interface NewsSectionEditorProps {
  data: Record<string, string>
  setData: React.Dispatch<React.SetStateAction<Record<string, string>>>
  newsIndices: number[]
  onAddNewNews?: () => void
  onRequestDelete: (item: { type: "news" index: number name: string }) => void
  handleImageFileChange: (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
}

export const NewsSectionEditor: React.FC<NewsSectionEditorProps> = ({
  data,
  setData,
  newsIndices,
  onAddNewNews,
  onRequestDelete,
  handleImageFileChange,
}) => {
  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Artículos de Noticias (
          {
            newsIndices.filter((idx) => data[`a${idx}_deleted`] !== "true")
              .length
          }
          )
        </h3>
        {onAddNewNews && (
          <button
            type="button"
            onClick={onAddNewNews}
            className="bg-celeste-50 text-celeste-700 hover:bg-celeste-100 text-xs font-bold px-3 py-1.5 rounded-lg border border-celeste-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Agregar Noticia
          </button>
        )}
      </div>

      {newsIndices.map((idx) => {
        const isDeleted = data[`a${idx}_deleted`] === "true"
        if (isDeleted) return null

        return (
          <div
            key={`news-card-${idx}`}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 relative"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-navy-950">
                Artículo {idx}{" "}
                {data[`a${idx}_title`]
                  ? `— ${data[`a${idx}_title`].slice(0, 35)}...`
                  : ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  onRequestDelete({
                    type: "news",
                    index: idx,
                    name: data[`a${idx}_title`] || `Artículo ${idx}`,
                  })
                }}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Eliminar noticia"
              >
                <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                Eliminar
              </button>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal"
                placeholder={`Título del artículo ${idx}`}
                value={data[`a${idx}_title`] || ""}
                onChange={(e) =>
                  setData({ ...data, [`a${idx}_title`]: e.target.value })
                }
              />
            </div>

            {/* Category & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Categoría
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal"
                  placeholder="Ej. Sesión Ordinaria"
                  value={data[`a${idx}_category`] || ""}
                  onChange={(e) =>
                    setData({ ...data, [`a${idx}_category`]: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Fecha
                </label>
                <CustomDatePicker
                  value={data[`a${idx}_date`] || ""}
                  onChange={(val) =>
                    setData({ ...data, [`a${idx}_date`]: val })
                  }
                  placeholder="Ej. 21 agosto 2026"
                  className="w-full"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Resumen
              </label>
              <textarea
                rows={2}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal resize-y"
                placeholder={`Resumen del artículo ${idx}`}
                value={data[`a${idx}_excerpt`] || ""}
                onChange={(e) =>
                  setData({ ...data, [`a${idx}_excerpt`]: e.target.value })
                }
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Foto de Portada
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={data[`a${idx}_image`] || ""}
                  onChange={(e) =>
                    setData({ ...data, [`a${idx}_image`]: e.target.value })
                  }
                />
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Subir foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFileChange(`a${idx}_image`, e)}
                  />
                </label>
              </div>
              {data[`a${idx}_image`] && (
                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                  <img
                    src={data[`a${idx}_image`]}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setData({ ...data, [`a${idx}_image`]: "" })
                      }
                      className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer"
                    >
                      Quitar imagen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Full content */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Contenido Completo (lectura)
              </label>
              <textarea
                rows={3}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal resize-y"
                placeholder={`Texto completo del artículo ${idx}`}
                value={data[`a${idx}_content`] || ""}
                onChange={(e) =>
                  setData({ ...data, [`a${idx}_content`]: e.target.value })
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default NewsSectionEditor
