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
  const [sections, setSections] = useState<SiteSection[]>(DEFAULT_SECTIONS);
  const [editing, setEditing] = useState<SiteSection | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [previewType, setPreviewType] = useState<"desktop" | "mobile">("desktop");

  function move(id: string, dir: -1 | 1) {
    const i = sections.findIndex((s) => s.id === id);
    if ((dir === -1 && i === 0) || (dir === 1 && i === sections.length - 1)) return;
    const next = [...sections];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setSections(next);
    setUnsaved(true);
  }

  function toggleVisible(id: string) {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, visible: !sec.visible } : sec)));
    setUnsaved(true);
  }

  function deleteSection(id: string) {
    setSections((s) => s.filter((sec) => sec.id !== id));
    setDelConfirm(null);
    setUnsaved(true);
  }

  function saveEdit(data: Record<string, string>) {
    if (!editing) return;
    setSections((s) => s.map((sec) => (sec.id === editing.id ? { ...sec, data } : sec)));
    setEditing(null);
    setUnsaved(true);
  }

  function addSection(type: SectionType) {
    const newSec: SiteSection = {
      id: `s${Date.now()}`,
      type,
      visible: true,
      data: Object.fromEntries(SECTION_FIELDS[type].map((f) => [f.key, ""])),
    };
    setSections((s) => [...s, newSec]);
    setAddMode(false);
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
    }, 2000);
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
  };

  return (
    <div className="animate-fadeup">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <h2 className="font-semibold text-navy-900 text-base">Editor del Sitio Público</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Administre el contenido visible en la web institucional. Los cambios no son públicos hasta publicar.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Preview toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
            {(["desktop", "mobile"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPreviewType(m)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  previewType === m ? "bg-white shadow-sm text-navy-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "desktop" ? <MonitorIcon className="w-3 h-3" /> : <MobileIcon className="w-3 h-3" />}
                {m === "desktop" ? "Escritorio" : "Móvil"}
              </button>
            ))}
          </div>
          {unsaved && !published && (
            <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Cambios sin publicar
            </span>
          )}
          {published && (
            <span className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Publicado
            </span>
          )}
          <button
            onClick={publish}
            disabled={publishing || !unsaved}
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

      <div className="grid xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Section list */}
        <div className="space-y-2">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all duration-150 ${
                sec.visible ? "border-slate-200 hover:border-slate-300" : "border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Order controls */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => move(sec.id, -1)}
                    disabled={idx === 0}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => move(sec.id, 1)}
                    disabled={idx === sections.length - 1}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Section info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${TYPE_COLOR[sec.type]}`}>
                    {SECTION_LABELS[sec.type]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{sec.data.title || sec.data.name || sec.data.eyebrow || "Sin título"}</p>
                    <p className="text-[11px] text-slate-400 truncate">{SECTION_DESCRIPTIONS[sec.type]}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleVisible(sec.id)}
                    title={sec.visible ? "Ocultar del sitio" : "Mostrar en el sitio"}
                    className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${
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
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-navy-700 bg-navy-50 hover:bg-navy-100 px-2 py-1 rounded-lg transition-colors"
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
                <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between animate-fadeup">
                  <p className="text-sm text-red-700 font-medium">¿Eliminar esta sección permanentemente?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteSection(sec.id)}
                      className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setDelConfirm(null)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
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
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-navy-300 hover:bg-navy-50/40 text-slate-400 hover:text-navy-600 font-semibold text-sm py-4 rounded-xl transition-all duration-150"
          >
            <PlusIcon className="w-4 h-4" />
            Agregar nueva sección
          </button>
        </div>

        {/* Preview panel */}
        <div className="sticky top-0">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">Vista previa estructural</p>
              <span className="text-[10px] text-slate-400">
                {sections.filter((s) => s.visible).length} de {sections.length} secciones visibles
              </span>
            </div>
            <div className={`p-3 space-y-1.5 ${previewType === "mobile" ? "max-w-[240px] mx-auto" : ""}`}>
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className={`rounded-lg px-3 py-2 text-[11px] transition-opacity ${
                    sec.visible ? `${TYPE_COLOR[sec.type]} opacity-100` : "bg-slate-50 text-slate-300 border border-dashed border-slate-200"
                  }`}
                >
                  <p className="font-bold truncate">{SECTION_LABELS[sec.type]}</p>
                  {sec.visible && <p className="truncate opacity-70 mt-0.5">{sec.data.title || sec.data.name || sec.data.eyebrow || "—"}</p>}
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 text-center">El orden y visibilidad reflejan lo que se publicará</p>
            </div>
          </div>

          {canAdmin && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Nota de administrador</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Solo los roles Comisión y Editor pueden modificar el sitio. Los lectores solo tienen acceso de vista al sistema.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Template picker modal */}
      {addMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setAddMode(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-navy-900">Agregar sección</h2>
                <p className="text-xs text-slate-400 mt-0.5">Seleccione una plantilla. Luego complete solo la información de contenido.</p>
              </div>
              <button onClick={() => setAddMode(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-3">
              {(Object.keys(SECTION_LABELS) as SectionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="text-left p-4 border-2 border-slate-200 hover:border-navy-400 hover:bg-navy-50 rounded-xl transition-all group"
                >
                  <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 ${TYPE_COLOR[type]}`}>
                    {SECTION_LABELS[type]}
                  </span>
                  <p className="text-sm font-semibold text-navy-900 group-hover:text-navy-700">{SECTION_LABELS[type]}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{SECTION_DESCRIPTIONS[type]}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">{SECTION_FIELDS[type].length} campos a completar</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section edit modal */}
      {editing && <SectionEditModal section={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}
    </div>
  );
};

/* ─── section edit modal (planilla) ────────────────────────────────────── */
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
  const fields = SECTION_FIELDS[section.type];

  /* Group timeline fields into rows of 3 for better layout */
  const grouped: FieldDef[][] = [];
  if (section.type === "timeline") {
    const nonTitle = fields.filter((f) => f.key !== "title");
    const title = fields.find((f) => f.key === "title")!;
    grouped.push([title]);
    for (let i = 0; i < nonTitle.length; i += 3) grouped.push(nonTitle.slice(i, i + 3));
  } else {
    fields.forEach((f) => grouped.push([f]));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        onSave(data);
      }, 600);
    }, 800);
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
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
          <div>
            <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 ${TYPE_COLOR[section.type]}`}>
              {SECTION_LABELS[section.type]}
            </span>
            <h2 className="font-semibold text-navy-900 text-base">Editar contenido de la sección</h2>
            <p className="text-xs text-slate-400 mt-0.5">Complete los campos de la plantilla. Solo ingrese texto — el diseño se aplica automáticamente.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-6">
          {saved ? (
            <div className="text-center py-10 animate-fadeup">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-navy-900">Cambios guardados</p>
              <p className="text-sm text-slate-500 mt-1">Recuerde publicar para que sean visibles en el sitio.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Field group rendering */}
              {section.type === "timeline" ? (
                <>
                  {/* Title alone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {fields[0].label}
                      {fields[0].required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      className="input text-sm"
                      value={data[fields[0].key] || ""}
                      onChange={(e) => setData({ ...data, [fields[0].key]: e.target.value })}
                    />
                  </div>
                  {/* Milestones in rows of 3 */}
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Hito {n}</p>
                      <div className="grid grid-cols-3 gap-3">
                        {["year", "label", "desc"].map((k) => {
                          const fKey = `m${n}_${k}`;
                          const fd = fields.find((f) => f.key === fKey)!;
                          return fd ? (
                            <div key={fKey}>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                                {k === "year" ? "Año" : k === "label" ? "Nombre" : "Descripción"}
                              </label>
                              <input
                                className="input text-xs py-2"
                                value={data[fKey] || ""}
                                onChange={(e) => setData({ ...data, [fKey]: e.target.value })}
                                placeholder={k === "year" ? "2019" : k === "label" ? "Fundación" : "Descripción breve"}
                              />
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </>
              ) : section.type === "news" ? (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {fields[0].label}
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input className="input text-sm" value={data["title"] || ""} onChange={(e) => setData({ ...data, title: e.target.value })} />
                  </div>
                  {/* Articles */}
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Artículo {n}</p>
                      <div className="space-y-3">
                        {["title", "category", "date", "excerpt"].map((k) => {
                          const fKey = `a${n}_${k}`;
                          const isTA = k === "excerpt";
                          return (
                            <div key={fKey}>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                                {k === "title" ? "Título" : k === "category" ? "Categoría" : k === "date" ? "Fecha" : "Resumen"}
                              </label>
                              {isTA ? (
                                <textarea
                                  rows={2}
                                  className="input resize-none text-xs py-2"
                                  value={data[fKey] || ""}
                                  onChange={(e) => setData({ ...data, [fKey]: e.target.value })}
                                  placeholder="Breve descripción del artículo..."
                                />
                              ) : (
                                <input
                                  className="input text-xs py-2"
                                  value={data[fKey] || ""}
                                  onChange={(e) => setData({ ...data, [fKey]: e.target.value })}
                                  placeholder={k === "category" ? "Ej. Sesión Ordinaria, Informe" : k === "date" ? "Ej. 10 sep 2026" : ""}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              ) : section.type === "documents" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Título de la sección<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input className="input text-sm" value={data["title"] || ""} onChange={(e) => setData({ ...data, title: e.target.value })} />
                  </div>
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Documento {n}</p>
                      <div className="grid grid-cols-3 gap-3">
                        {["title", "count", "tag"].map((k) => (
                          <div key={k}>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                              {k === "title" ? "Nombre" : k === "count" ? "Cantidad / estado" : "Etiqueta"}
                            </label>
                            <input
                              className="input text-xs py-2"
                              value={data[`d${n}_${k}`] || ""}
                              onChange={(e) => setData({ ...data, [`d${n}_${k}`]: e.target.value })}
                              placeholder={k === "title" ? "Actas de Sesión" : k === "count" ? "38 documentos" : "Últimas 24 meses"}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                /* Generic field rendering */
                fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {f.label}
                      {f.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        rows={3}
                        className="input resize-none text-sm"
                        value={data[f.key] || ""}
                        onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                      />
                    ) : (
                      <input
                        type="text"
                        className="input text-sm"
                        value={data[f.key] || ""}
                        onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                      />
                    )}
                    {f.hint && <p className="text-[11px] text-slate-400 mt-1">{f.hint}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {!saved && (
          <div className="border-t border-slate-200 px-6 py-4 flex gap-3 flex-shrink-0">
            <button
              onClick={handleSave}
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
}

export default SiteEditorTab;
