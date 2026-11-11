import React, { useState, useEffect } from "react"

interface AddNewsModalProps {
  nextIndex: number
  onSave: (article: {
    title: string
    category: string
    date: string
    excerpt: string
    image: string
    content: string
  }) => void
  onClose: () => void
}

export const AddNewsModal: React.FC<AddNewsModalProps> = ({
  nextIndex,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Sesión Ordinaria")
  const [date, setDate] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [image, setImage] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImage(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setTimeout(() => {
      onSave({
        title: title.trim(),
        category: category.trim(),
        date: date.trim(),
        excerpt: excerpt.trim(),
        image: image.trim(),
        content: content.trim(),
      })
    }, 350)
  }

  return (
    <div
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-[80] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-2xl shadow-2xl max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeup"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 bg-[#e0f2fe] text-[#0369a1]">
              Noticias y comunicados
            </span>
            <h2 className="font-bold text-navy-900 text-base">
              Agregar Nueva Noticia
            </h2>
            <p className="text-xs text-slate-400">
              Complete los datos del artículo para publicarlo en la sección de
              noticias.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors ml-3 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Artículo {nextIndex} — título{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
              placeholder="Ej. Aprobación del Plan Estratégico 2026-2030"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Artículo {nextIndex} — categoría
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
                placeholder="Ej. Sesión Ordinaria, Infraestructura..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Artículo {nextIndex} — fecha de publicación
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
                placeholder="Ej. 18 de octubre de 2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Artículo {nextIndex} — resumen / bajada
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all resize-y font-normal"
              placeholder="La Sesión Ordinaria No. 020 aprobó por unanimidad el expediente técnico del Corredor Logístico del Altiplano Occidental."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Artículo {nextIndex} — imagen (URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
                placeholder="https://images.unsplash.com/... o presione Subir foto"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm">
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
                  onChange={handleImageFileChange}
                />
              </label>
            </div>
            {image && (
              <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group flex items-center justify-center">
                <img
                  src={image}
                  alt="Vista previa"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer"
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

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Artículo {nextIndex} — contenido completo (lectura)
            </label>
            <textarea
              rows={4}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all resize-y font-normal"
              placeholder="Texto detallado que se mostrará al hacer clic en la noticia para leerla completa..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="w-full sm:flex-1 py-3 px-6 bg-navy-950 hover:bg-navy-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando Noticia...
                </>
              ) : (
                "Guardar Noticia"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-semibold cursor-pointer border border-slate-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNewsModal
