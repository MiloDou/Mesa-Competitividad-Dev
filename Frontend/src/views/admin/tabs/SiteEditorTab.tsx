import React, { useEffect, useState } from "react"
import { SiteSection, SectionType } from "../../../types/admin"
import {
  SECTION_LABELS,
  SECTION_DESCRIPTIONS,
  SECTION_FIELDS,
} from "../../../data/admin"
import { SiteEditorHeader } from "./site-editor/SiteEditorHeader"
import { SectionEditModal } from "./site-editor/SectionEditModal"
import { AddNewsModal } from "./site-editor/AddNewsModal"
import { AddHitoModal } from "./site-editor/AddHitoModal"
import { getAdminLandingContent, saveLandingContent } from "../../../api/landingContent"

interface SiteEditorTabProps {
  canAdmin: boolean
}

export const SiteEditorTab: React.FC<SiteEditorTabProps> = ({ canAdmin: _canAdmin }) => {
  const [sections, setSections] = useState<SiteSection[]>([])

  const [editing, setEditing] = useState<SiteSection | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [showAddNewsModal, setShowAddNewsModal] = useState(false)
  const [showAddStopModal, setShowAddStopModal] = useState(false)
  const [customTitleInput, setCustomTitleInput] = useState("")
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [cloudState, setCloudState] = useState<"loading" | "connected" | "offline">("loading")
  const [editorReady, setEditorReady] = useState(false)
  const [publishError, setPublishError] = useState("")
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => {
    let active = true;
    getAdminLandingContent().then(({ content }) => {
      if (!active) return;
      if (Array.isArray(content.site_sections)) {
        setSections(content.site_sections);
        try { localStorage.setItem("site_sections", JSON.stringify(content.site_sections)); } catch { /* API data stays available */ }
      } else setSections([])
      setEditorReady(true);
      setCloudState("connected");
    }).catch(() => {
      if (active) setCloudState("offline");
    });
    return () => { active = false; };
  }, []);

  // Calcular de forma dinámica el índice de la siguiente noticia (inicia en 7, luego 8, 9...)
  const newsSec = sections.find((s) => s.type === "news")
  let maxNewsIdx = 6
  if (newsSec?.data) {
    Object.keys(newsSec.data).forEach((k) => {
      const m = k.match(/^a(\d+)_/)
      if (m) {
        const num = parseInt(m[1], 10)
        if (
          !isNaN(num) &&
          newsSec.data[`a${num}_deleted`] !== "true" &&
          num > maxNewsIdx
        ) {
          maxNewsIdx = num
        }
      }
    })
  }
  const nextNewsIndex = maxNewsIdx + 1

  // Calcular de forma dinámica el índice del siguiente hito/parada (inicia en 7, luego 8, 9...)
  const tlSec = sections.find((s) => s.type === "timeline")
  let maxStopIdx = 6
  if (tlSec?.data) {
    Object.keys(tlSec.data).forEach((k) => {
      const m = k.match(/^m(\d+)_/)
      if (m) {
        const num = parseInt(m[1], 10)
        if (
          !isNaN(num) &&
          tlSec.data[`m${num}_deleted`] !== "true" &&
          num > maxStopIdx
        ) {
          maxStopIdx = num
        }
      }
    })
  }
  const nextStopIndex = maxStopIdx + 1

  function handleSaveNewStop(stopData: {
    year: string
    label: string
    desc: string
    img: string
  }) {
    let tlSecIndex = sections.findIndex((s) => s.type === "timeline")
    let nextSections = [...sections]

    let maxIdx = 6
    if (tlSecIndex >= 0) {
      const secData = nextSections[tlSecIndex].data || {}
      Object.keys(secData).forEach((k) => {
        const m = k.match(/^m(\d+)_/)
        if (m) {
          const num = parseInt(m[1], 10)
          if (
            !isNaN(num) &&
            secData[`m${num}_deleted`] !== "true" &&
            num > maxIdx
          ) {
            maxIdx = num
          }
        }
      })
    }
    const nextIdx = maxIdx + 1

    if (tlSecIndex < 0) {
      const newSec: SiteSection = {
        id: "s3",
        type: "timeline",
        visible: true,
        data: {},
      }
      nextSections.push(newSec)
      tlSecIndex = nextSections.length - 1
    }

    const updatedSec = { ...nextSections[tlSecIndex] }
    const updatedData = { ...updatedSec.data }

    const prefix = `m${nextIdx}`
    updatedData[`${prefix}_year`] = stopData.year
    updatedData[`${prefix}_label`] = stopData.label
    updatedData[`${prefix}_desc`] = stopData.desc
    updatedData[`${prefix}_img`] = stopData.img
    updatedData[`${prefix}_image`] = stopData.img
    delete updatedData[`${prefix}_deleted`]

    updatedSec.data = updatedData
    nextSections[tlSecIndex] = updatedSec

    saveSectionsState(nextSections)
    setUnsaved(true)
    setShowAddStopModal(false)
  }

  async function handleSaveNewNews(articleData: {
    title: string
    category: string
    date: string
    excerpt: string
    image: string
    content: string
  }) {
    let newsSecIndex = sections.findIndex((s) => s.type === "news")
    let nextSections = [...sections]

    let maxIdx = 6
    if (newsSecIndex >= 0) {
      const secData = nextSections[newsSecIndex].data || {}
      Object.keys(secData).forEach((k) => {
        const m = k.match(/^a(\d+)_/)
        if (m) {
          const num = parseInt(m[1], 10)
          if (
            !isNaN(num) &&
            secData[`a${num}_deleted`] !== "true" &&
            num > maxIdx
          ) {
            maxIdx = num
          }
        }
      })
    }
    const nextIdx = maxIdx + 1

    if (newsSecIndex < 0) {
      const newSec: SiteSection = {
        id: "s4",
        type: "news",
        visible: true,
        data: {},
      }
      nextSections.push(newSec)
      newsSecIndex = nextSections.length - 1
    }

    const updatedSec = { ...nextSections[newsSecIndex] }
    const updatedData = { ...updatedSec.data }

    const prefix = `a${nextIdx}`
    updatedData[`${prefix}_title`] = articleData.title
    updatedData[`${prefix}_category`] = articleData.category || "General"
    updatedData[`${prefix}_cat`] = articleData.category || "General"
    updatedData[`${prefix}_date`] = articleData.date
    updatedData[`${prefix}_excerpt`] = articleData.excerpt
    updatedData[`${prefix}_image`] = articleData.image
    updatedData[`${prefix}_img`] = updatedData[`${prefix}_image`]
    updatedData[`${prefix}_content`] =
      articleData.content || articleData.excerpt
    delete updatedData[`${prefix}_deleted`]

    updatedSec.data = updatedData
    nextSections[newsSecIndex] = updatedSec

    saveSectionsState(nextSections)
    setUnsaved(true)
    setShowAddNewsModal(false)
    setPublishing(true)
    setPublishError("")
    try {
      await saveLandingContent({ site_sections: nextSections })
      setCloudState("connected")
      setUnsaved(false)
      setPublished(true)
      setTimeout(() => setPublished(false), 3000)
    } catch (error) {
      setCloudState("offline")
      setPublishError(error instanceof Error ? error.message : "No se pudo guardar la noticia en línea.")
    } finally {
      setPublishing(false)
    }
  }

  const handleDragStart = (_e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }
    const next = [...sections]
    const [movedItem] = next.splice(draggedIdx, 1)
    next.splice(idx, 0, movedItem)
    saveSectionsState(next)
    setUnsaved(true)
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const saveSectionsState = (newSections: SiteSection[]) => {
    setSections(newSections)
    localStorage.setItem("site_sections", JSON.stringify(newSections))
    window.dispatchEvent(new Event("site_sections_updated"))
  }

  function move(id: string, dir: -1 | 1) {
    const i = sections.findIndex((s) => s.id === id)
    if ((dir === -1 && i === 0) || (dir === 1 && i === sections.length - 1))
      return
    const next = [...sections]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    saveSectionsState(next)
    setUnsaved(true)
  }

  function toggleVisible(id: string) {
    const next = sections.map((sec) =>
      sec.id === id ? { ...sec, visible: !sec.visible } : sec,
    )
    saveSectionsState(next)
    setUnsaved(true)
  }

  function deleteSection(id: string) {
    const next = sections.filter((sec) => sec.id !== id)
    saveSectionsState(next)
    setDelConfirm(null)
    setUnsaved(true)
  }

  function saveEdit(data: Record<string, string>) {
    if (!editing) return
    const next = sections.map((sec) =>
      sec.id === editing.id ? { ...sec, data } : sec,
    )
    saveSectionsState(next)
    setEditing(null)
    setUnsaved(true)
  }

  function addSection(type: SectionType, customTitle?: string) {
    const initialData: Record<string, string> = {
      ...Object.fromEntries(
        (SECTION_FIELDS[type] || []).map((f) => [f.key, ""]),
      ),
    }
    if (type === "custom" && customTitle) {
      initialData["title"] = customTitle
    }

    const newSec: SiteSection = {
      id: `s_${Date.now()}`,
      type,
      customName: type === "custom" ? customTitle : undefined,
      visible: true,
      data: initialData,
    }
    const next = [...sections, newSec]
    saveSectionsState(next)
    setAddMode(false)
    setCustomTitleInput("")
    setUnsaved(true)
    setEditing(newSec)
  }

  async function publish() {
    setPublishing(true)
    saveSectionsState(sections)
    setPublishError("")
    try {
      await saveLandingContent({
        site_sections: sections,
      })
      setCloudState("connected")
      setPublishing(false)
      setPublished(true)
      setUnsaved(false)
      setTimeout(() => setPublished(false), 3000)
    } catch (error) {
      setPublishing(false)
      setCloudState("offline")
      setPublishError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el contenido. Revisa tu conexión e inténtalo de nuevo.",
      )
    }
  }

  const TYPE_COLOR: Record<SectionType, string> = {
    hero: "bg-navy-950 text-white",
    about: "bg-[#f3e8ff] text-[#6b21a8]",
    conformados: "bg-[#fef9c3] text-[#854d0e] border border-amber-200",
    timeline: "bg-[#f1f5f9] text-[#475569]",
    news: "bg-[#e0f2fe] text-[#0369a1]",
    event: "bg-[#fef3c7] text-[#b45309]",
    projects: "bg-[#dcfce7] text-[#15803d]",
    documents: "bg-[#e0e7ff] text-[#3730a3]",
    contact: "bg-[#fae8ff] text-[#86198f]",
    cta: "bg-[#fee2e2] text-[#991b1b]",
    stats: "bg-[#ccfbf1] text-[#0f766e]",
    custom: "bg-[#ffedd5] text-[#9a3412] border border-orange-200",
  }

  const SIDEBAR_CARD_STYLES: Record<SectionType, {
    bg: string
    title: string
    sub: string
  }> = {
    hero: {
      bg: "bg-navy-950",
      title: "text-white font-bold",
      sub: "text-slate-300",
    },
    about: {
      bg: "bg-[#f3e8ff]",
      title: "text-[#6b21a8] font-bold",
      sub: "text-[#7e22ce]/80",
    },
    conformados: {
      bg: "bg-[#fef9c3]",
      title: "text-[#854d0e] font-bold",
      sub: "text-[#a16207]",
    },
    timeline: {
      bg: "bg-[#f1f5f9]",
      title: "text-[#475569] font-bold",
      sub: "text-[#64748b]",
    },
    projects: {
      bg: "bg-[#dcfce7]",
      title: "text-[#15803d] font-bold",
      sub: "text-[#166534]/80",
    },
    news: {
      bg: "bg-[#e0f2fe]",
      title: "text-[#0369a1] font-bold",
      sub: "text-[#0284c7]",
    },
    event: {
      bg: "bg-[#fef3c7]",
      title: "text-[#b45309] font-bold",
      sub: "text-[#b45309]/80",
    },
    documents: {
      bg: "bg-[#e0e7ff]",
      title: "text-[#3730a3] font-bold",
      sub: "text-[#4338ca]/80",
    },
    contact: {
      bg: "bg-[#fae8ff]",
      title: "text-[#86198f] font-bold",
      sub: "text-[#a21caf]/80",
    },
    cta: {
      bg: "bg-[#fee2e2]",
      title: "text-[#991b1b] font-bold",
      sub: "text-[#dc2626]",
    },
    stats: {
      bg: "bg-[#ccfbf1]",
      title: "text-[#0f766e] font-bold",
      sub: "text-[#0d9488]",
    },
    custom: {
      bg: "bg-[#ffedd5]",
      title: "text-[#9a3412] font-bold",
      sub: "text-[#c2410c]",
    },
  }

  function handleSelectTemplate(type: SectionType) {
    if (type === "news") {
      setAddMode(false)
      setShowAddNewsModal(true)
      return
    }
    if (type === "timeline") {
      setAddMode(false)
      setShowAddStopModal(true)
      return
    }
    const existing = sections.find((s) => s.type === type)
    if (existing) {
      setAddMode(false)
      setEditing(existing)
    } else {
      addSection(type)
    }
  }

  if (!editorReady) {
    return <p role="status" className="p-4 text-sm text-slate-600">
      {cloudState === "loading" ? "Cargando contenido del sitio…" : "No se pudo cargar el contenido del sitio. Recarga la página para intentarlo de nuevo."}
    </p>
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <SiteEditorHeader
        unsaved={unsaved}
        publishing={publishing}
        published={published}
        onPublish={publish}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-medium px-1 gap-1">
        <p className={cloudState === "connected" ? "text-emerald-700" : cloudState === "loading" ? "text-slate-500" : "text-amber-700"}>
          {cloudState === "connected" ? "Cambios guardados" : cloudState === "loading" ? "Cargando contenido del sitio…" : "No se pudo guardar el contenido. Revisa tu conexión e inténtalo de nuevo."}
        </p>
        {publishError && <p role="alert" className="text-red-700">{publishError}</p>}
      </div>

      {/* Two Column Layout: Editor Cards + Estructura Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] xl:grid-cols-[1fr_290px] gap-5 items-start">
        {/* Left column: List of sections */}
        <div className="space-y-2.5 min-w-0">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-xl border transition-all ${
                dragOverIdx === idx
                  ? "border-gold-500 ring-2 ring-gold-200"
                  : "border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              } ${
                !sec.visible ? "opacity-60 bg-slate-50/50" : "hover:shadow-sm"
              }`}
            >
              <div className="py-2.5 px-3 sm:px-3.5 flex items-center gap-2.5">
                {/* Left: Drag handle & Reorder arrows */}
                <div className="flex items-center gap-1 flex-shrink-0 text-slate-300">
                  <div
                    className="cursor-grab active:cursor-grabbing hover:text-slate-500 p-0.5 select-none"
                    title="Arrastrar para reordenar"
                  >
                    <span className="text-slate-400 text-base leading-none font-bold select-none">
                      =
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <button
                      onClick={() => move(sec.id, -1)}
                      disabled={idx === 0}
                      className="text-slate-400 hover:text-navy-900 disabled:opacity-20 disabled:pointer-events-none p-0.5 cursor-pointer leading-none transition-colors"
                      title="Subir posición"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => move(sec.id, 1)}
                      disabled={idx === sections.length - 1}
                      className="text-slate-400 hover:text-navy-900 disabled:opacity-20 disabled:pointer-events-none p-0.5 cursor-pointer leading-none transition-colors"
                      title="Bajar posición"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Center: Badge & Title */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLOR[sec.type]}`}
                    >
                      {sec.type === "custom"
                        ? sec.customName ||
                          sec.data.title ||
                          "Apartado Personalizado"
                        : SECTION_LABELS[sec.type]}
                    </span>
                    {!sec.visible && (
                      <span className="text-[9.5px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        Oculto
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate">
                    {sec.data.title ||
                      sec.data.name ||
                      sec.data.eyebrow ||
                      SECTION_LABELS[sec.type] ||
                      "Sin título"}
                  </h3>
                </div>

                {/* Right controls: Visible toggle, Edit button, Delete button */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleVisible(sec.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      sec.visible
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "text-slate-400 hover:bg-slate-100"
                    }`}
                    title={
                      sec.visible
                        ? "Ocultar del sitio público"
                        : "Mostrar en el sitio público"
                    }
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>{sec.visible ? "Visible" : "Oculto"}</span>
                  </button>

                  <button
                    onClick={() => setEditing(sec)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Editar contenido"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => setDelConfirm(sec.id)}
                    className="p-1 rounded-lg text-red-700 hover:text-red-900 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Eliminar sección del sitio"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Bottom dashed button: + Crear o Agregar Nuevo Apartado / Sección */}
          <button
            onClick={() => setAddMode(true)}
            className="w-full py-3 border-2 border-dashed border-sky-100 hover:border-sky-300 hover:bg-sky-50/50 text-sky-600/90 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span className="text-sm font-bold">+</span>
            <span>Crear o Agregar Nuevo Apartado / Sección</span>
          </button>
        </div>

        {/* Right column: Estructura del Sitio Público */}
        <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm space-y-2.5 sticky top-4">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">
              Estructura del Sitio Público
            </h2>
            <span className="text-[10px] font-medium text-slate-400">
              {sections.filter((s) => s.visible).length} visibles
            </span>
          </div>

          <div className="space-y-1.5">
            {sections.map((sec) => {
              const styles =
                SIDEBAR_CARD_STYLES[sec.type] || SIDEBAR_CARD_STYLES.custom
              const title =
                sec.type === "custom"
                  ? sec.customName || "Apartado Personalizado"
                  : SECTION_LABELS[sec.type]
              const sub =
                sec.data.title ||
                sec.data.name ||
                sec.data.eyebrow ||
                SECTION_DESCRIPTIONS[sec.type] ||
                "—"
              return (
                <div
                  key={sec.id}
                  onClick={() => setEditing(sec)}
                  className={`p-2.5 rounded-lg transition-all cursor-pointer hover:scale-[1.01] ${styles.bg} ${
                    !sec.visible ? "opacity-40" : ""
                  }`}
                  title="Clic para editar esta sección"
                >
                  <div className={`text-xs truncate ${styles.title}`}>
                    {title}
                  </div>
                  <div className={`text-[10px] mt-0.5 truncate ${styles.sub}`}>
                    {sub}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Template & Custom section picker modal */}
      {addMode && (
        <div
          className="fixed inset-0 modal-backdrop flex items-center justify-center z-[80] p-4"
          onClick={() => setAddMode(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <div>
                <h2 className="font-bold text-navy-900 text-base">
                  Crear o Seleccionar Apartado
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Elija una plantilla existente o cree un nuevo apartado
                  personalizado.
                </p>
              </div>
              <button
                onClick={() => setAddMode(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
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

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Option to create a unique custom section */}
              <div className="bg-[#FFF8F4] border border-[#FCD9C8] rounded-2xl p-5">
                <p className="text-xs font-bold text-[#A84318] mb-1">
                  Crear Apartado Personalizado (Ej. Juegos Nacionales)
                </p>
                <p className="text-[11px] text-[#C4673B] mb-3">
                  Si el apartado no existe en la lista predeterminada, ingrese
                  su nombre y créelo de inmediato.
                </p>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F99D77]"
                    placeholder="Nombre del apartado (Ej. Juegos Nacionales)"
                    value={customTitleInput}
                    onChange={(e) => setCustomTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customTitleInput.trim()) {
                        addSection("custom", customTitleInput.trim())
                      }
                    }}
                  />
                  <button
                    disabled={!customTitleInput.trim()}
                    onClick={() =>
                      addSection("custom", customTitleInput.trim())
                    }
                    className="bg-[#F99D77] hover:bg-[#F0875C] disabled:opacity-40 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shadow-sm cursor-pointer"
                  >
                    Crear Apartado
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  O SELECCIONE UNA SECCIÓN PREDETERMINADA:
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    "hero",
                    "about",
                    "timeline",
                    "news",
                    "event",
                    "projects",
                    "documents",
                    "contact",
                    "cta",
                    "stats",
                  ] as SectionType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectTemplate(type)}
                      className="text-left p-3.5 border border-slate-200 hover:border-navy-400 hover:bg-slate-50/70 rounded-xl transition-all group cursor-pointer bg-white shadow-sm"
                    >
                      <span
                        className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${TYPE_COLOR[type]}`}
                      >
                        {SECTION_LABELS[type]}
                      </span>
                      <p className="text-xs font-bold text-navy-900 group-hover:text-navy-700">
                        {SECTION_LABELS[type]}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {SECTION_DESCRIPTIONS[type]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {delConfirm && (
        <div
          className="fixed inset-0 modal-backdrop flex items-center justify-center z-[80] p-4"
          onClick={() => setDelConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-navy-900 text-sm">
              ¿Eliminar esta sección?
            </h3>
            <p className="text-xs text-slate-500">
              Esta sección será retirada del sitio web. Podrá volver a agregarla
              en cualquier momento desde "Crear o Seleccionar Apartado".
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setDelConfirm(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteSection(delConfirm)}
                className="px-3.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section edit modal */}
      {editing && (
        <SectionEditModal
          section={editing}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          onAddNewNews={() => {
            setEditing(null)
            setShowAddNewsModal(true)
          }}
          onAddNewStop={() => {
            setEditing(null)
            setShowAddStopModal(true)
          }}
        />
      )}

      {/* Add single news modal */}
      {showAddNewsModal && (
        <AddNewsModal
          nextIndex={nextNewsIndex}
          onSave={handleSaveNewNews}
          onClose={() => setShowAddNewsModal(false)}
        />
      )}

      {/* Add single timeline milestone modal */}
      {showAddStopModal && (
        <AddHitoModal
          nextIndex={nextStopIndex}
          onSave={handleSaveNewStop}
          onClose={() => setShowAddStopModal(false)}
        />
      )}
    </div>
  )
}

export default SiteEditorTab
