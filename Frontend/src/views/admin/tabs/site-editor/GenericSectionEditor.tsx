import React from "react"
import { FieldDef } from "../../../../data/admin"

interface GenericSectionEditorProps {
  fields: FieldDef[]
  data: Record<string, string>
  setData: React.Dispatch<React.SetStateAction<Record<string, string>>>
  handleImageFileChange: (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
  handlePdfFileChange: (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
}

export const GenericSectionEditor: React.FC<GenericSectionEditorProps> = ({
  fields,
  data,
  setData,
  handleImageFileChange,
  handlePdfFileChange,
}) => {
  return (
    <>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="block text-xs font-bold text-slate-800">
            {f.label}
            {f.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea
              rows={f.key.includes("content") ? 4 : 3}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all resize-y font-normal"
              placeholder={f.placeholder}
              value={data[f.key] || ""}
              onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
            />
          ) : f.type === "image" ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
                  placeholder={
                    f.placeholder || "https://ejemplo.com/imagen.jpg"
                  }
                  value={data[f.key] || ""}
                  onChange={(e) =>
                    setData({ ...data, [f.key]: e.target.value })
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
                    onChange={(e) => handleImageFileChange(f.key, e)}
                  />
                </label>
              </div>
              {data[f.key] && (
                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                  <img
                    src={data[f.key]}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setData({ ...data, [f.key]: "" })}
                      className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow"
                    >
                      Quitar imagen
                    </button>
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-md font-medium">
                    Vista previa de imagen
                  </span>
                </div>
              )}
            </div>
          ) : f.key.endsWith("_file") ? (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
                  placeholder={
                    f.placeholder || "https://ejemplo.com/documento.pdf"
                  }
                  value={data[f.key] || ""}
                  onChange={(e) =>
                    setData({ ...data, [f.key]: e.target.value })
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Cargar PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handlePdfFileChange(f.key, e)}
                  />
                </label>
              </div>
            </div>
          ) : (
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
              placeholder={f.placeholder}
              value={data[f.key] || ""}
              onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
            />
          )}
          {f.hint && (
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              {f.hint}
            </p>
          )}
        </div>
      ))}
    </>
  )
}

export default GenericSectionEditor
