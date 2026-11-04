import React from "react"
import { PlusIcon, TrashIcon } from "../../../../components/icons/AdminIcons"
import { CustomDatePicker } from "../../../../components/ui/CustomDatePicker"

interface TimelineSectionEditorProps {
  data: Record<string, string>
  setData: React.Dispatch<React.SetStateAction<Record<string, string>>>
  timelineIndices: number[]
  onAddNewStop?: () => void
  onRequestDelete: (item: {
    type: "timeline"
    index: number
    name: string
  }) => void
}

export const TimelineSectionEditor: React.FC<TimelineSectionEditorProps> = ({
  data,
  setData,
  timelineIndices,
  onAddNewStop,
  onRequestDelete,
}) => {
  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Estaciones / Paradas del Tren (
          {
            timelineIndices.filter((idx) => data[`m${idx}_deleted`] !== "true")
              .length
          }
          )
        </h3>
        {onAddNewStop && (
          <button
            type="button"
            onClick={onAddNewStop}
            className="bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Agregar Parada
          </button>
        )}
      </div>

      {timelineIndices.map((idx) => {
        const isDeleted = data[`m${idx}_deleted`] === "true"
        if (isDeleted) return null

        return (
          <div
            key={`milestone-card-${idx}`}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 relative"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-navy-950">
                Estación {idx}{" "}
                {data[`m${idx}_label`] ? `— ${data[`m${idx}_label`]}` : ""} (
                {data[`m${idx}_year`] || "Sin fecha"})
              </span>
              <button
                type="button"
                onClick={() => {
                  onRequestDelete({
                    type: "timeline",
                    index: idx,
                    name: data[`m${idx}_label`] || `Estación ${idx}`,
                  })
                }}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Eliminar parada de la línea de tiempo"
              >
                <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                Eliminar
              </button>
            </div>

            {/* Year & Label */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Año / Período / Fecha
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal"
                    placeholder="Ej. 2026, Hace 15 años, etc."
                    value={data[`m${idx}_year`] || ""}
                    onChange={(e) =>
                      setData({ ...data, [`m${idx}_year`]: e.target.value })
                    }
                  />
                  <CustomDatePicker
                    value={data[`m${idx}_year`] || ""}
                    onChange={(val) =>
                      setData({ ...data, [`m${idx}_year`]: val })
                    }
                    placeholder="Calendario"
                    className="w-auto"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Nombre de la Estación / Hito{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal"
                  placeholder="Ej. VI Congreso"
                  value={data[`m${idx}_label`] || ""}
                  onChange={(e) =>
                    setData({ ...data, [`m${idx}_label`]: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Descripción del Hito
              </label>
              <textarea
                rows={3}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal resize-y"
                placeholder="Detalle histórico de este congreso o hito..."
                value={data[`m${idx}_desc`] || ""}
                onChange={(e) =>
                  setData({ ...data, [`m${idx}_desc`]: e.target.value })
                }
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Imagen del Hito
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 font-normal"
                  placeholder="https://ejemplo.com/hito.jpg"
                  value={data[`m${idx}_img`] || data[`m${idx}_image`] || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    setData({
                      ...data,
                      [`m${idx}_img`]: val,
                      [`m${idx}_image`]: val,
                    })
                  }}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            setData((prev) => ({
                              ...prev,
                              [`m${idx}_img`]: reader.result as string,
                              [`m${idx}_image`]: reader.result as string,
                            }))
                          }
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              </div>
              {(data[`m${idx}_img`] || data[`m${idx}_image`]) && (
                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                  <img
                    src={data[`m${idx}_img`] || data[`m${idx}_image`]}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setData({
                          ...data,
                          [`m${idx}_img`]: "",
                          [`m${idx}_image`]: "",
                        })
                      }
                      className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer"
                    >
                      Quitar imagen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TimelineSectionEditor
