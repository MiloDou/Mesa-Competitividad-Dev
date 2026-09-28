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
    return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
  });
  const [editing, setEditing] = useState<SiteSection | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [customTitleInput, setCustomTitleInput] = useState("");
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [previewType, setPreviewType] = useState<"desktop" | "mobile">("desktop");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
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
    const initialData: Record<string, string> = Object.fromEntries(
      (SECTION_FIELDS[type] || []).map((f) => [f.key, ""])
    );
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
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
      setUnsaved(false);
      setTimeout(() => setPublished(false), 3000);
    }, 1200);
  }

  const TYPE_COLOR: Record<SectionType, string> = {
    hero: "bg-navy-800 text-white",
    about: "bg-navy-100 text-navy-700",
    timeline: "bg-slate-100 text-slate-600",
    news: "bg-celeste-100 text-celeste-700",
    event: "bg-amber-100 text-amber-700",
    projects: "bg-green-100 text-green-700",
    documents: "bg-blue-100 text-blue-700",
    contact: "bg-purple-100 text-purple-700",
    cta: "bg-red-100 text-red-700",
    stats: "bg-teal-100 text-teal-700",
    custom: "bg-orange-100 text-orange-800 border border-orange-200",
  };

  return (
    <div className="animate-fadeup">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <h2 className="font-semibold text-navy-900 text-base">Editor del Sitio Público</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Administre el contenido e imágenes visibles en la web. Arrastre los módulos o use las flechas para reordenar.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {unsaved && !published && (
            <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Cambios guardados
            </span>
          )}
          {published && (
            <span className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Publicado en vivo
            </span>
          )}
          <button
            onClick={publish}
            disabled={publishing}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {publishing ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Publicando…
              </>
            ) : (
              <>
                <GlobeIcon className="w-3.5 h-3.5" />
                Publicar cambios
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start w-full">
        {/* Section list */}
        <div className="space-y-2 min-w-0">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              className={`bg-white border rounded-xl overflow-hidden transition-all duration-150 cursor-grab active:cursor-grabbing ${
                draggedIdx === idx ? "opacity-40 border-dashed border-navy-500 scale-[0.99]" : ""
              } ${
                dragOverIdx === idx && draggedIdx !== idx ? "border-gold-500 border-2 bg-gold-50/20" : ""
              } ${
                sec.visible ? "border-slate-200 hover:border-slate-300" : "border-slate-100 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Drag Handle Icon & Order Arrows */}
                  <div className="flex items-center gap-1 flex-shrink-0 text-slate-400 hover:text-slate-600">
                    <div title="Arrastrar para reordenar" className="p-1 cursor-grab hover:bg-slate-100 rounded">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); move(sec.id, -1); }}
                        disabled={idx === 0}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Mover arriba"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); move(sec.id, 1); }}
                        disabled={idx === sections.length - 1}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Mover abajo"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Section info */}
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2.5 min-w-0 flex-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 w-fit ${TYPE_COLOR[sec.type]}`}>
                      {sec.type === "custom" ? (sec.customName || sec.data.title || "Apartado Personalizado") : SECTION_LABELS[sec.type]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-navy-900 truncate">{sec.data.title || sec.data.name || sec.data.eyebrow || "Sin título"}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto justify-end">
                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleVisible(sec.id)}
                    title={sec.visible ? "Ocultar del sitio" : "Mostrar en el sitio"}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                      sec.visible ? "text-green-700 bg-green-50 hover:bg-green-100" : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    {sec.visible ? (
                      <>
                        <EyeIcon className="w-3 h-3" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOffIcon className="w-3 h-3" />
                        Oculto
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setEditing(sec)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-navy-700 bg-navy-50 hover:bg-navy-100 px-2 py-1 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDelConfirm(sec.id)}
                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Delete confirmation inline */}
              {delConfirm === sec.id && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-2.5 flex items-center justify-between animate-fadeup">
                  <p className="text-xs text-red-700 font-medium">¿Eliminar este apartado del sitio web?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteSection(sec.id)}
                      className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setDelConfirm(null)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-1 rounded-lg hover:bg-white transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add section button */}
          <button
            onClick={() => setAddMode(true)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-navy-300 hover:bg-navy-50/40 text-slate-400 hover:text-navy-600 font-semibold text-sm py-3 rounded-xl transition-all duration-150"
          >
            <PlusIcon className="w-4 h-4" />
            Crear o Agregar Nuevo Apartado / Sección
          </button>
        </div>

        {/* Preview panel */}
        <div className="sticky top-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">Estructura del Sitio Público</p>
              <span className="text-[10px] text-slate-400">
                {sections.filter((s) => s.visible).length} visibles
              </span>
            </div>
            <div className={`p-3 space-y-1.5 max-h-[70vh] overflow-y-auto ${previewType === "mobile" ? "max-w-[220px] mx-auto" : ""}`}>
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className={`rounded-lg px-3 py-2 text-[11px] transition-opacity ${
                    sec.visible ? `${TYPE_COLOR[sec.type]} opacity-100` : "bg-slate-50 text-slate-300 border border-dashed border-slate-200"
                  }`}
                >
                  <p className="font-bold truncate">{sec.type === "custom" ? (sec.customName || sec.data.title || "Apartado Personalizado") : SECTION_LABELS[sec.type]}</p>
                  {sec.visible && <p className="truncate opacity-75 mt-0.5">{sec.data.title || sec.data.name || sec.data.eyebrow || "—"}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template & Custom section picker modal */}
      {addMode && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" onClick={() => setAddMode(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <div>
                <h2 className="font-bold text-navy-900 text-base">Crear o Seleccionar Apartado</h2>
                <p className="text-xs text-slate-400 mt-0.5">Elija una plantilla existente o cree un nuevo apartado personalizado.</p>
              </div>
              <button onClick={() => setAddMode(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Option to create a unique custom section */}
              <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4">
                <p className="text-xs font-bold text-orange-900 mb-1">Crear Apartado Personalizado (Ej. Juegos Nacionales)</p>
                <p className="text-[11px] text-orange-700 mb-3">Si el apartado no existe en la lista predeterminada, ingrese su nombre y créelo de inmediato.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input text-xs py-2 bg-white"
                    placeholder="Nombre del apartado (Ej. Juegos Nacionales 2026)"
                    value={customTitleInput}
                    onChange={(e) => setCustomTitleInput(e.target.value)}
                  />
                  <button
                    disabled={!customTitleInput.trim()}
                    onClick={() => addSection("custom", customTitleInput.trim())}
                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                  >
                    Crear Apartado
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">O Seleccione una Sección Predeterminada:</p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {(Object.keys(SECTION_LABELS) as SectionType[]).filter(t => t !== "custom").map((type) => (
                    <button
                      key={type}
                      onClick={() => addSection(type)}
                      className="text-left p-3 border border-slate-200 hover:border-navy-400 hover:bg-navy-50 rounded-xl transition-all group"
                    >
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${TYPE_COLOR[type]}`}>
                        {SECTION_LABELS[type]}
                      </span>
                      <p className="text-xs font-semibold text-navy-900 group-hover:text-navy-700">{SECTION_LABELS[type]}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{SECTION_DESCRIPTIONS[type]}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section edit modal (compact & non-oversized) */}
      {editing && <SectionEditModal section={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}
    </div>
  );
};

/* ─── section edit modal (compact max-h-[80vh]) ─────────────────────────── */
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
  const fields = SECTION_FIELDS[section.type] || [];

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

  const TYPE_COLOR: Record<SectionType, string> = {
    hero: "bg-navy-800 text-white",
    about: "bg-navy-100 text-navy-700",
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
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="bg-white w-full rounded-2xl shadow-2xl max-w-xl max-h-[82vh] flex flex-col overflow-hidden animate-fadeup" onClick={(e) => e.stopPropagation()}>
        {/* Header (sticky) */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${TYPE_COLOR[section.type]}`}>
              {section.type === "custom" ? (section.customName || data.title || "Apartado Personalizado") : SECTION_LABELS[section.type]}
            </span>
            <h2 className="font-bold text-navy-900 text-sm">Editar Contenido de la Sección</h2>
            <p className="text-[11px] text-slate-400">Complete los datos de la sección de forma clara y concisa.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors ml-3">
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
                <label className="block text-xs font-semibold text-slate-700">
                  {f.label}
                  {f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    rows={2}
                    className="input resize-none text-xs py-2"
                    value={data[f.key] || ""}
                    onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                  />
                ) : f.type === "image" ? (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      className="input text-xs py-2 border-celeste-300 focus:border-celeste-500"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={data[f.key] || ""}
                      onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                    />
                    {data[f.key] && (
                      <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                        <img src={data[f.key]} alt="Vista previa" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">Vista previa</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="input text-xs py-2"
                    value={data[f.key] || ""}
                    onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                  />
                )}
                {f.hint && <p className="text-[10px] text-slate-400">{f.hint}</p>}
              </div>
            ))
          )}
        </div>

        {/* Footer (sticky action buttons right at the bottom) */}
        {!saved && (
          <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex gap-3 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
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
              className="border border-slate-200 text-slate-600 hover:bg-white font-medium text-xs px-4 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SiteEditorTab;
