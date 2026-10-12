import React, { useState } from "react";
import { SiteSection, SectionType } from "../../../types/admin";
import {
  DEFAULT_SECTIONS,
  SECTION_LABELS,
  SECTION_DESCRIPTIONS,
  SECTION_FIELDS,
  FieldDef,
} from "../../../data/admin";
import {
  MonitorIcon,
  MobileIcon,
  GlobeIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "../../../components/icons/AdminIcons";

interface SiteEditorTabProps {
  canAdmin: boolean;
}

export const SiteEditorTab: React.FC<SiteEditorTabProps> = ({ canAdmin }) => {
  const [sections, setSections] = useState<SiteSection[]>(() => {
    const saved = localStorage.getItem("site_sections");
    const raw: SiteSection[] = saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    const sanitized = raw.map((sec) => {
      if (!sec || !sec.data) return sec;
      let nextData: any = { ...sec.data };
      if (nextData.title) {
        nextData.title = nextData.title.replace(/Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi, "Mesa Departamental de Competitividad de Quetzaltenango");
      }
      if (nextData.subtitle) {
        nextData.subtitle = nextData.subtitle.replace(/Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi, "Mesa Departamental de Competitividad de Quetzaltenango");
      }
      if (nextData.description) {
        nextData.description = nextData.description.replace(/Mesa (Departamental )?de Competitividad( de)? Quetzaltenango/gi, "Mesa Departamental de Competitividad de Quetzaltenango");
      }
      if (sec.type === "conformados") {
        if (!nextData.subtitle || nextData.subtitle.includes("47")) {
          nextData.subtitle = "Red multisectorial de 10 instituciones aliadas que articulan la competitividad regional.";
        }
      }
      if (sec.type === "timeline") {
        const defaultTimeline = DEFAULT_SECTIONS.find((s) => s.type === "timeline");
        if (defaultTimeline) {
          if (!nextData.m1_img) nextData.m1_img = defaultTimeline.data.m1_img;
          if (!nextData.m2_img) nextData.m2_img = defaultTimeline.data.m2_img;
          if (!nextData.m3_img) nextData.m3_img = defaultTimeline.data.m3_img;
          if (!nextData.m4_img) nextData.m4_img = defaultTimeline.data.m4_img;
          if (!nextData.m5_img) nextData.m5_img = defaultTimeline.data.m5_img;
          if (!nextData.m6_img) nextData.m6_img = defaultTimeline.data.m6_img;
          if (!nextData.m6_year || nextData.m1_year === "2019" || nextData.m1_year === "15 Años") {
            Object.assign(nextData, defaultTimeline.data);
          }
        }
      }
      if (sec.type === "news") {
        const defaultNews = DEFAULT_SECTIONS.find((s) => s.type === "news");
        if (defaultNews) {
          if (!nextData.a1_image) nextData.a1_image = defaultNews.data.a1_image;
          if (!nextData.a2_image) nextData.a2_image = defaultNews.data.a2_image;
          if (!nextData.a3_image) nextData.a3_image = defaultNews.data.a3_image;
          if (!nextData.a4_title) {
            nextData = { ...defaultNews.data, ...nextData };
          }
        }
      }
      if (sec.type === "hero") {
        delete nextData.imageUrl;
      }
      if (sec.type === "about") {
        delete nextData.imageUrl;
      }
      if (sec.type === "event") {
        const defaultEvent = DEFAULT_SECTIONS.find((s) => s.type === "event");
        if (defaultEvent && !nextData.imageUrl) {
          nextData.imageUrl = defaultEvent.data.imageUrl;
        }
      }
      return { ...sec, data: nextData };
    });
    if (!sanitized.some((s) => s.type === "conformados")) {
      const defaultConf = DEFAULT_SECTIONS.find((s) => s.type === "conformados");
      if (defaultConf) {
        const aboutIdx = sanitized.findIndex((s) => s.type === "about");
        if (aboutIdx !== -1) {
          sanitized.splice(aboutIdx + 1, 0, defaultConf);
        } else {
          sanitized.push(defaultConf);
        }
      }
    }

    // DEDUPLICAR SECCIONES SINGLETON: corregir duplicados accidentales de línea de tiempo o noticias (Bug 5)
    const seenTypes = new Set<string>();
    const deduplicated: SiteSection[] = [];
    for (const sec of sanitized) {
      if (sec.type !== "custom") {
        if (!seenTypes.has(sec.type)) {
          seenTypes.add(sec.type);
          deduplicated.push(sec);
        }
      } else {
        deduplicated.push(sec);
      }
    }
    if (deduplicated.length !== raw.length) {
      try {
        localStorage.setItem("site_sections", JSON.stringify(deduplicated));
      } catch (e) {}
    }
    return deduplicated;
  });
  const [editing, setEditing] = useState<SiteSection | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [customTitleInput, setCustomTitleInput] = useState("");
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [previewType, setPreviewType] = useState<"desktop" | "mobile">("desktop");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Calcular de forma dinámica el índice de la siguiente noticia (inicia en 7, luego 8, 9...)
  const newsSec = sections.find((s) => s.type === "news");
  let maxNewsIdx = 6;
  if (newsSec?.data) {
    Object.keys(newsSec.data).forEach((k) => {
      const m = k.match(/^a(\d+)_/);
      if (m) {
        const num = parseInt(m[1], 10);
        if (!isNaN(num) && num > maxNewsIdx) maxNewsIdx = num;
      }
    });
  }
  const nextNewsIndex = maxNewsIdx + 1;

  function handleSaveNewNews(articleData: {
    title: string;
    category: string;
    date: string;
    excerpt: string;
    image: string;
    content: string;
  }) {
    let newsSecIndex = sections.findIndex((s) => s.type === "news");
    let nextSections = [...sections];

    let maxIdx = 6;
    if (newsSecIndex >= 0) {
      const secData = nextSections[newsSecIndex].data || {};
      Object.keys(secData).forEach((k) => {
        const m = k.match(/^a(\d+)_/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (!isNaN(num) && num > maxIdx) maxIdx = num;
        }
      });
    }
    const nextIdx = maxIdx + 1;

    if (newsSecIndex < 0) {
      const defaultNews = DEFAULT_SECTIONS.find((s) => s.type === "news");
      const newSec: SiteSection = {
        id: "s4",
        type: "news",
        visible: true,
        data: { ...(defaultNews?.data || {}) },
      };
      nextSections.push(newSec);
      newsSecIndex = nextSections.length - 1;
    }

    const updatedSec = { ...nextSections[newsSecIndex] };
    const updatedData = { ...updatedSec.data };

    const prefix = `a${nextIdx}`;
    updatedData[`${prefix}_title`] = articleData.title;
    updatedData[`${prefix}_category`] = articleData.category || "General";
    updatedData[`${prefix}_cat`] = articleData.category || "General";
    updatedData[`${prefix}_date`] = articleData.date;
    updatedData[`${prefix}_excerpt`] = articleData.excerpt;
    updatedData[`${prefix}_image`] = articleData.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=700&fit=crop&auto=format";
    updatedData[`${prefix}_img`] = updatedData[`${prefix}_image`];
    updatedData[`${prefix}_content`] = articleData.content || articleData.excerpt;
    updatedData[`${prefix}_read`] = "4 min";

    updatedSec.data = updatedData;
    nextSections[newsSecIndex] = updatedSec;

    saveSectionsState(nextSections);
    setUnsaved(true);
    setShowAddNewsModal(false);
  }

  const handleDragStart = (_e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...sections];
    const [movedItem] = next.splice(draggedIdx, 1);
    next.splice(idx, 0, movedItem);
    saveSectionsState(next);
    setUnsaved(true);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const saveSectionsState = (newSections: SiteSection[]) => {
    setSections(newSections);
    localStorage.setItem("site_sections", JSON.stringify(newSections));
    // Trigger custom event for instant live update in PublicSite
    window.dispatchEvent(new Event("site_sections_updated"));
  };

  function move(id: string, dir: -1 | 1) {
    const i = sections.findIndex((s) => s.id === id);
    if ((dir === -1 && i === 0) || (dir === 1 && i === sections.length - 1)) return;
    const next = [...sections];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    saveSectionsState(next);
    setUnsaved(true);
  }

  function toggleVisible(id: string) {
    const next = sections.map((sec) => (sec.id === id ? { ...sec, visible: !sec.visible } : sec));
    saveSectionsState(next);
    setUnsaved(true);
  }

  function deleteSection(id: string) {
    const next = sections.filter((sec) => sec.id !== id);
    saveSectionsState(next);
    setDelConfirm(null);
    setUnsaved(true);
  }

  function saveEdit(data: Record<string, string>) {
    if (!editing) return;
    const next = sections.map((sec) => (sec.id === editing.id ? { ...sec, data } : sec));
    saveSectionsState(next);
    setEditing(null);
    setUnsaved(true);
  }

  function addSection(type: SectionType, customTitle?: string) {
    const defaultSec = DEFAULT_SECTIONS.find((s) => s.type === type);
    const initialData: Record<string, string> = {
      ...Object.fromEntries((SECTION_FIELDS[type] || []).map((f) => [f.key, ""])),
      ...(defaultSec ? defaultSec.data : {}),
    };
    if (type === "custom" && customTitle) {
      initialData["title"] = customTitle;
    }

    const newSec: SiteSection = {
      id: `s_${Date.now()}`,
      type,
      customName: type === "custom" ? customTitle : undefined,
      visible: true,
      data: initialData,
    };
    const next = [...sections, newSec];
    saveSectionsState(next);
    setAddMode(false);
    setCustomTitleInput("");
    setUnsaved(true);
    setEditing(newSec);
  }

  function publish() {
    setPublishing(true);
    saveSectionsState(sections);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
      setUnsaved(false);
      setTimeout(() => setPublished(false), 3000);
    }, 1200);
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
  };

  const SIDEBAR_CARD_STYLES: Record<SectionType, { bg: string; title: string; sub: string }> = {
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
  };

  function handleSelectTemplate(type: SectionType) {
    if (type === "news") {
      setAddMode(false);
      setShowAddNewsModal(true);
      return;
    }
    const existing = sections.find((s) => s.type === type);
    if (existing) {
      setAddMode(false);
      setEditing(existing);
    } else {
      addSection(type);
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-bold text-navy-900 tracking-tight">Editor del Sitio Público</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Administre el contenido e imágenes visibles en la web. Arrastre los módulos o use las flechas para reordenar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unsaved && (
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
              Cambios pendientes
            </span>
          )}
          <button
            onClick={publish}
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
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>¡Publicado!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Publicar cambios</span>
              </>
            )}
          </button>
        </div>
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
                dragOverIdx === idx ? "border-gold-500 ring-2 ring-gold-200" : "border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              } ${!sec.visible ? "opacity-60 bg-slate-50/50" : "hover:shadow-sm"}`}
            >
              <div className="py-2.5 px-3 sm:px-3.5 flex items-center gap-2.5">
                {/* Left: Drag handle & Reorder arrows */}
                <div className="flex items-center gap-1 flex-shrink-0 text-slate-300">
                  <div
                    className="cursor-grab active:cursor-grabbing hover:text-slate-500 p-0.5 select-none"
                    title="Arrastrar para reordenar"
                  >
                    <span className="text-slate-400 text-base leading-none font-bold select-none">=</span>
                  </div>

                  <div className="flex flex-col">
                    <button
                      onClick={() => move(sec.id, -1)}
                      disabled={idx === 0}
                      className="text-slate-400 hover:text-navy-900 disabled:opacity-20 disabled:pointer-events-none p-0.5 cursor-pointer leading-none transition-colors"
                      title="Subir posición"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => move(sec.id, 1)}
                      disabled={idx === sections.length - 1}
                      className="text-slate-400 hover:text-navy-900 disabled:opacity-20 disabled:pointer-events-none p-0.5 cursor-pointer leading-none transition-colors"
                      title="Bajar posición"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Center: Badge & Title */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLOR[sec.type]}`}>
                      {sec.type === "custom" ? (sec.customName || sec.data.title || "Apartado Personalizado") : SECTION_LABELS[sec.type]}
                    </span>
                    {!sec.visible && (
                      <span className="text-[9.5px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        Oculto
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate">
                    {sec.data.title || sec.data.name || sec.data.eyebrow || SECTION_LABELS[sec.type] || "Sin título"}
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
                    title={sec.visible ? "Ocultar del sitio público" : "Mostrar en el sitio público"}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{sec.visible ? "Visible" : "Oculto"}</span>
                  </button>

                  <button
                    onClick={() => setEditing(sec)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Editar contenido"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => {
                      if (sec.type === "custom") {
                        setDelConfirm(sec.id);
                      }
                    }}
                    disabled={sec.type !== "custom"}
                    className={`p-1 rounded-lg text-slate-300 transition-colors ${
                      sec.type === "custom"
                        ? "hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        : "opacity-30 cursor-not-allowed"
                    }`}
                    title={sec.type === "custom" ? "Eliminar apartado personalizado" : "Apartado estándar (use Ocultar para no mostrar)"}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">Estructura del Sitio Público</h2>
            <span className="text-[10px] font-medium text-slate-400">
              {sections.filter((s) => s.visible).length} visibles
            </span>
          </div>

          <div className="space-y-1.5">
            {sections.map((sec) => {
              const styles = SIDEBAR_CARD_STYLES[sec.type] || SIDEBAR_CARD_STYLES.custom;
              const title = sec.type === "custom" ? (sec.customName || "Apartado Personalizado") : SECTION_LABELS[sec.type];
              const sub = sec.data.title || sec.data.name || sec.data.eyebrow || SECTION_DESCRIPTIONS[sec.type] || "—";
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
              );
            })}
          </div>
        </div>
      </div>


      {/* Template & Custom section picker modal */}
      {addMode && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[80] p-4" onClick={() => setAddMode(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeup" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <div>
                <h2 className="font-bold text-navy-900 text-base">Crear o Seleccionar Apartado</h2>
                <p className="text-xs text-slate-400 mt-0.5">Elija una plantilla existente o cree un nuevo apartado personalizado.</p>
              </div>
              <button onClick={() => setAddMode(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Option to create a unique custom section */}
              <div className="bg-[#FFF8F4] border border-[#FCD9C8] rounded-2xl p-5">
                <p className="text-xs font-bold text-[#A84318] mb-1">Crear Apartado Personalizado (Ej. Juegos Nacionales)</p>
                <p className="text-[11px] text-[#C4673B] mb-3">Si el apartado no existe en la lista predeterminada, ingrese su nombre y créelo de inmediato.</p>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F99D77]"
                    placeholder="Nombre del apartado (Ej. Juegos Nacionales)"
                    value={customTitleInput}
                    onChange={(e) => setCustomTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customTitleInput.trim()) {
                        addSection("custom", customTitleInput.trim());
                      }
                    }}
                  />
                  <button
                    disabled={!customTitleInput.trim()}
                    onClick={() => addSection("custom", customTitleInput.trim())}
                    className="bg-[#F99D77] hover:bg-[#F0875C] disabled:opacity-40 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shadow-sm cursor-pointer"
                  >
                    Crear Apartado
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">O SELECCIONE UNA SECCIÓN PREDETERMINADA:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(
                    [
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
                    ] as SectionType[]
                  ).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectTemplate(type)}
                      className="text-left p-3.5 border border-slate-200 hover:border-navy-400 hover:bg-slate-50/70 rounded-xl transition-all group cursor-pointer bg-white shadow-sm"
                    >
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${TYPE_COLOR[type]}`}>
                        {SECTION_LABELS[type]}
                      </span>
                      <p className="text-xs font-bold text-navy-900 group-hover:text-navy-700">{SECTION_LABELS[type]}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{SECTION_DESCRIPTIONS[type]}</p>
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
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[80] p-4" onClick={() => setDelConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900 text-sm">¿Eliminar este apartado?</h3>
            <p className="text-xs text-slate-500">
              Esta sección personalizada será eliminada del sitio web. Podrá volver a crearla en cualquier momento.
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
      {editing && <SectionEditModal section={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}

      {/* Add single news modal (matching Image 3) */}
      {showAddNewsModal && (
        <AddNewsModal
          nextIndex={nextNewsIndex}
          onSave={handleSaveNewNews}
          onClose={() => setShowAddNewsModal(false)}
        />
      )}
    </div>
  );
};

/* ─── section edit modal (aligned with user screenshots) ─────────────────── */
function SectionEditModal({
  section,
  onSave,
  onClose,
}: {
  section: SiteSection;
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<Record<string, string>>({ ...section.data });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const fields = React.useMemo(() => {
    const baseFields = [...(SECTION_FIELDS[section.type] || [])];
    if (section.type === "news") {
      const indices = new Set<number>();
      Object.keys(section.data || {}).forEach((k) => {
        const m = k.match(/^a(\d+)_/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > 6) indices.add(num);
        }
      });
      const sortedNew = Array.from(indices).sort((a, b) => a - b);
      sortedNew.forEach((idx) => {
        baseFields.push(
          { key: `a${idx}_title`, label: `Artículo ${idx} — título`, type: "text", required: true, placeholder: `Título del artículo ${idx}` },
          { key: `a${idx}_category`, label: `Artículo ${idx} — categoría`, type: "text", hint: "Ej. Sesión Ordinaria, Informe, Convocatoria", placeholder: "Categoría" },
          { key: `a${idx}_date`, label: `Artículo ${idx} — fecha`, type: "text", placeholder: "Fecha de publicación" },
          { key: `a${idx}_excerpt`, label: `Artículo ${idx} — resumen`, type: "textarea", placeholder: `Resumen del artículo ${idx}` },
          { key: `a${idx}_image`, label: `Artículo ${idx} — imagen (URL)`, type: "image", hint: "URL de la foto de portada", placeholder: "https://ejemplo.com/imagen.jpg" },
          { key: `a${idx}_content`, label: `Artículo ${idx} — contenido completo (lectura)`, type: "textarea", placeholder: `Texto completo del artículo ${idx}` }
        );
      });
    }
    return baseFields;
  }, [section.type, section.data]);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        onSave(data);
      }, 400);
    }, 500);
  }

  const handleImageFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setData((prev) => ({ ...prev, [key]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setData((prev) => ({ ...prev, [key]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
    custom: "bg-orange-100 text-orange-800",
  };

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-[80] p-4"
      onClick={onClose}
    >
      <div className="bg-white w-full rounded-2xl shadow-2xl max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeup" onClick={(e) => e.stopPropagation()}>
        {/* Header (sticky) */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${TYPE_COLOR[section.type]}`}>
              {section.type === "custom" ? (section.customName || data.title || "Apartado Personalizado") : SECTION_LABELS[section.type]}
            </span>
            <h2 className="font-bold text-navy-900 text-base">Editar Contenido de la Sección</h2>
            <p className="text-xs text-slate-400">Ingrese la información requerida que se mostrará en el sitio público.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors ml-3 cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Fields (Scrollable area) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {saved ? (
            <div className="text-center py-8 animate-fadeup">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-navy-900 text-sm">Contenido actualizado</p>
              <p className="text-xs text-slate-500 mt-0.5">Los cambios se reflejan inmediatamente en el sitio público.</p>
            </div>
          ) : (
            fields.map((f) => (
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
                        placeholder={f.placeholder || "https://ejemplo.com/imagen.jpg"}
                        value={data[f.key] || ""}
                        onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                      />
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                        <img src={data[f.key]} alt="Vista previa" className="w-full h-full object-cover" />
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
                        placeholder={f.placeholder || "https://ejemplo.com/documento.pdf"}
                        value={data[f.key] || ""}
                        onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                      />
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                {f.hint && <p className="text-[11px] text-slate-400 font-normal mt-0.5">{f.hint}</p>}
              </div>
            ))
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
      </div>
    </div>
  );
}

/* ─── Add single news modal (matching user screenshot Image 3) ────────────── */
function AddNewsModal({
  nextIndex,
  onSave,
  onClose,
}: {
  nextIndex: number;
  onSave: (article: {
    title: string;
    category: string;
    date: string;
    excerpt: string;
    image: string;
    content: string;
  }) => void;
  onClose: () => void;
}) {
  const getInitialDate = () => {
    const d = new Date();
    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Sesión Ordinaria");
  const [date, setDate] = useState(getInitialDate());
  const [excerpt, setExcerpt] = useState("");
  const [image, setImage] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setTimeout(() => {
      onSave({
        title: title.trim(),
        category: category.trim(),
        date: date.trim(),
        excerpt: excerpt.trim(),
        image: image.trim(),
        content: content.trim(),
      });
    }, 350);
  };

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
              Editar Contenido de la Sección
            </h2>
            <p className="text-xs text-slate-400">
              Ingrese la información requerida que se mostrará en el sitio público.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors ml-3 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Título */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Artículo {nextIndex} — título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
              placeholder="Ej. Mesa aprueba nuevo corredor logístico con inversión de Q 45 millones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Artículo {nextIndex} — categoría
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
              placeholder="Sesión Ordinaria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1 font-normal">
              Ej. Sesión Ordinaria, Informe, Convocatoria
            </p>
          </div>

          {/* Fecha */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Artículo {nextIndex} — fecha
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all font-normal"
              placeholder="21 agosto 2026"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Resumen */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Artículo {nextIndex} — resumen
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all resize-y font-normal"
              placeholder="La Sesión Ordinaria No. 020 aprobó por unanimidad el expediente técnico del Corredor Logístico del Altiplano Occidental."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          {/* Imagen */}
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
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                <img src={image} alt="Vista previa" className="w-full h-full object-contain" />
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

          {/* Contenido completo opcional */}
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

          {/* Footer buttons */}
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
                "Guardar Sección"
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
  );
}

export default SiteEditorTab;
