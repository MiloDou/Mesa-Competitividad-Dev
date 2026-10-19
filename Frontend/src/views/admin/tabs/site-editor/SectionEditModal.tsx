import React, { useState, useMemo, useEffect } from "react"
import { SiteSection, SectionType } from "../../../../types/admin"
import {
  SECTION_LABELS,
  SECTION_FIELDS,
  FieldDef,
} from "../../../../data/admin"
import { TrashIcon } from "../../../../components/icons/AdminIcons"
import { NewsSectionEditor } from "./NewsSectionEditor"
import { TimelineSectionEditor } from "./TimelineSectionEditor"
import { HeroSectionEditor } from "./HeroSectionEditor"
import { AboutSectionEditor } from "./AboutSectionEditor"
import { ConformadosSectionEditor } from "./ConformadosSectionEditor"
import { GenericSectionEditor } from "./GenericSectionEditor"

interface SectionEditModalProps {
  section: SiteSection
  onSave: (data: Record<string, string>) => void
  onClose: () => void
  onAddNewNews?: () => void
  onAddNewStop?: () => void
}

const TYPE_COLOR: Record<SectionType, string> = {
  hero: "bg-navy-800 text-white",
  about: "bg-navy-100 text-navy-700",
  conformados: "bg-gold-100 text-gold-900 border border-gold-200",
  timeline: "bg-slate-100 text-slate-600",
  news: "bg-celeste-100 text-celeste-700",
  event: "bg-amber-100 text-amber-700",
  projects: "bg-green-100 text-green-700",
  documents: "bg-blue-100 text-blue-700",
  contact: "bg-purple-100 text-purple-700",
  cta: "bg-red-100 text-red-700",
  stats: "bg-teal-100 text-teal-700",
  custom: "bg-orange-100 text-orange-700",
}

export const SectionEditModal: React.FC<SectionEditModalProps> = ({
  section,
  onSave,
  onClose,
  onAddNewNews,
  onAddNewStop,
}) => {
  const [data, setData] = useState<Record<string, string>>({ ...section.data })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    type: "news" | "timeline"
    index: number
    name: string
  } | null>(null)

  // Índices dinámicos de noticias
  const newsIndices = useMemo(() => {
    if (section.type !== "news") return []
    const indices = new Set<number>()
    for (let i = 1; i <= 6; i++) indices.add(i)
    Object.keys(section.data || {}).forEach((k) => {
      const m = k.match(/^a(\d+)_/)
      if (m) {
        const num = parseInt(m[1], 10)
        if (!isNaN(num)) indices.add(num)
      }
    })
    return Array.from(indices).sort((a, b) => a - b)
  }, [section.type, section.data])

  // Índices dinámicos de línea de tiempo
  const timelineIndices = useMemo(() => {
    if (section.type !== "timeline") return []
    const indices = new Set<number>()
    for (let i = 1; i <= 6; i++) indices.add(i)
    Object.keys(section.data || {}).forEach((k) => {
      const m = k.match(/^m(\d+)_/)
      if (m) {
        const num = parseInt(m[1], 10)
        if (!isNaN(num)) indices.add(num)
      }
    })
    return Array.from(indices).sort((a, b) => a - b)
  }, [section.type, section.data])

  const fields = useMemo(() => {
    if (section.type === "news") {
      const res: FieldDef[] = [
        {
          key: "title",
          label: "Título de la sección",
          type: "text",
          required: true,
          placeholder: "Comunicados y Noticias",
        },
      ]
      return res
    }

    if (section.type === "timeline") {
      const res: FieldDef[] = [
        {
          key: "title",
          label: "Título de la sección",
          type: "text",
          required: true,
          placeholder: "Hitos Cronológicos y Congresos Históricos",
        },
      ]
      return res
    }

    return [...(SECTION_FIELDS[section.type] || [])]
  }, [section.type])

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => {
        onSave(data)
      }, 400)
    }, 500)
  }

  const handleImageFileChange = (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setData((prev) => ({ ...prev, [key]: reader.result as string }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePdfFileChange = (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setData((prev) => ({ ...prev, [key]: reader.result as string }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const renderSectionEditorContent = () => {
    if (section.type === "news") {
      return (
        <>
          <GenericSectionEditor
            fields={fields}
            data={data}
            setData={setData}
            handleImageFileChange={handleImageFileChange}
            handlePdfFileChange={handlePdfFileChange}
          />
          <NewsSectionEditor
            data={data}
            setData={setData}
            newsIndices={newsIndices}
            onAddNewNews={onAddNewNews}
            onRequestDelete={setItemToDelete}
            handleImageFileChange={handleImageFileChange}
          />
        </>
      )
    }

    if (section.type === "timeline") {
      return (
        <>
          <GenericSectionEditor
            fields={fields}
            data={data}
            setData={setData}
            handleImageFileChange={handleImageFileChange}
            handlePdfFileChange={handlePdfFileChange}
          />
          <TimelineSectionEditor
            data={data}
            setData={setData}
            timelineIndices={timelineIndices}
            onAddNewStop={onAddNewStop}
            onRequestDelete={setItemToDelete}
          />
        </>
      )
    }

    if (section.type === "hero") {
      return (
        <HeroSectionEditor
          data={data}
          setData={setData}
          handleImageFileChange={handleImageFileChange}
          handlePdfFileChange={handlePdfFileChange}
        />
      )
    }

    if (section.type === "about") {
      return (
        <AboutSectionEditor
          data={data}
          setData={setData}
          handleImageFileChange={handleImageFileChange}
          handlePdfFileChange={handlePdfFileChange}
        />
      )
    }

    if (section.type === "conformados") {
      return (
        <ConformadosSectionEditor
          data={data}
          setData={setData}
          handleImageFileChange={handleImageFileChange}
          handlePdfFileChange={handlePdfFileChange}
        />
      )
    }

    return (
      <GenericSectionEditor
        fields={fields}
        data={data}
        setData={setData}
        handleImageFileChange={handleImageFileChange}
        handlePdfFileChange={handlePdfFileChange}
      />
    )
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
        {/* Header (sticky) */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${TYPE_COLOR[section.type]}`}
            >
              {section.type === "custom"
                ? section.customName || data.title || "Apartado Personalizado"
                : SECTION_LABELS[section.type]}
            </span>
            <h2 className="font-bold text-navy-900 text-base">
              Editar Contenido de la Sección
            </h2>
            <p className="text-xs text-slate-400">
              Ingrese la información requerida que se mostrará en el sitio
              público.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors ml-3 cursor-pointer"
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

        {/* Fields (Scrollable area) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saved ? (
            <div className="text-center py-8 animate-fadeup">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-semibold text-navy-900 text-sm">
                Contenido actualizado
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Los cambios se reflejan inmediatamente en el sitio público.
              </p>
            </div>
          ) : (
            renderSectionEditorContent()
          )}
        </div>

        {/* Footer (sticky action buttons right at the bottom) */}
        {!saved && (
          <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex gap-3 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-navy-950 hover:bg-navy-900 disabled:opacity-60 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar Sección"
              )}
            </button>
            <button
              onClick={onClose}
              className="border border-slate-200 text-slate-600 hover:bg-white font-medium text-xs px-5 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Confirmation modal for deleting article or timeline stop */}
        {itemToDelete && (
          <div
            className="fixed inset-0 modal-backdrop flex items-center justify-center z-[90] p-4"
            onClick={() => setItemToDelete(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-fadeup border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-navy-900 text-sm">
                  {itemToDelete.type === "news"
                    ? "¿Eliminar esta noticia?"
                    : "¿Eliminar esta parada del tren?"}
                </h3>
                <p className="text-xs text-slate-500">
                  {itemToDelete.type === "news"
                    ? `Se eliminará "${itemToDelete.name}". Esta noticia dejará de mostrarse en el sitio público.`
                    : `Se eliminará "${itemToDelete.name}". La estación será retirada del trayecto del tren.`}
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = itemToDelete.index
                    const isNews = itemToDelete.type === "news"
                    const prefix = isNews ? `a${idx}` : `m${idx}`

                    setData((prev) => {
                      const next = { ...prev }
                      if (idx > 6) {
                        Object.keys(next).forEach((k) => {
                          if (k.startsWith(`${prefix}_`)) {
                            delete next[k]
                          }
                        })
                      } else {
                        next[`${prefix}_deleted`] = "true"
                      }
                      return next
                    })
                    setItemToDelete(null)
                  }}
                  className="flex-1 px-3.5 py-2 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SectionEditModal
