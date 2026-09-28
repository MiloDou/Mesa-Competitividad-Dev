import React, { useState } from "react";
import { PlusIcon } from "../../../components/icons/AdminIcons";
import { downloadPdfDocument } from "../../../utils/pdfExport";


interface MinutesItem {
  id: string;
  session: string;
  date: string;
  status: string;
  n: number;
  file: string | null;
}

interface MinutesTabProps {
  canEdit: boolean;
  onOpen?: (id: string) => void;
  minutesList: MinutesItem[];
  setMinutesList: React.Dispatch<React.SetStateAction<MinutesItem[]>>;
}

export const MinutesTab: React.FC<MinutesTabProps> = ({
  canEdit,
  minutesList,
  setMinutesList,
}) => {
  const [filter, setFilter] = useState<"todos" | "borrador" | "pendiente" | "publicada">("todos");
  const [view, setView] = useState<"list" | "editor">("list");
  const [activeId, setActiveId] = useState<string>("ACT-022-BORRADOR");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  function openEditor(id: string) {
    setActiveId(id);
    setExported(false);
    setView("editor");
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    setMinutesList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              file: newStatus === "publicada" ? `${id}.pdf` : item.file,
            }
          : item
      )
    );
  };

  const filteredRows = minutesList.filter((r) => {
    if (filter === "todos") return true;
    return r.status === filter;
  });

  function handleExportPDF(row: typeof minutesList[0]) {
    downloadPdfDocument(
      row.file || `${row.id}.pdf`,
      `Acta Oficial - ${row.session}`,
      [
        `Código de Registro: ${row.id}`,
        `Fecha de Sesión: ${row.date}`,
        `Participantes registrados: ${row.n} miembros`,
        `Estado: ${row.status.toUpperCase()}`,
        `Acuerdos alcanzados: Se aprueba por unanimidad la hoja de ruta estratégica y el seguimiento a los proyectos prioritarios de la región occidente.`,
        `Certificación: El presente documento constituye copia fiel de su original que obra en las actas oficiales de la Mesa Departamental de Competitividad de Quetzaltenango.`
      ]
    );
  }

  if (view === "editor") {
    return (
      <div className="space-y-4 animate-fadeup max-w-3xl">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Actas y Documentos
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)" }} className="text-navy-900 text-xl font-normal">
                {activeId === "nueva" ? "Crear Nueva Acta de Reunión" : "Acta de Reunión"}
              </h2>
              <p style={{ fontFamily: "var(--font-mono)" }} className="text-slate-400 text-xs mt-0.5">
                {activeId}
              </p>
            </div>
          </div>
          <div className="space-y-5">
            {exported ? (
              <div className="text-center py-8 animate-fadeup">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-navy-900">PDF generado exitosamente</p>
                <p className="text-slate-500 text-sm mt-1">El archivo está listo para descarga y publicación.</p>
                <div className="flex gap-3 justify-center mt-5">
                  <button
                    onClick={() => handleExportPDF(minutesList[0])}
                    className="bg-navy-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-navy-800 transition-colors"
                  >
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className="border border-slate-200 text-slate-600 font-medium text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Volver al listado
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-navy-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm">
                  {[
                    ["Sesión", "Ordinaria No. 021 / 2026"],
                    ["Fecha", "18 de septiembre de 2026"],
                    ["Lugar", "Sala de Sesiones, CUNOC"],
                  ].map(([l, v]) => (
                    <div key={l as string}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{l}</p>
                      <p className="font-semibold text-navy-900 mt-0.5 text-sm">{v}</p>
                    </div>
                  ))}
                </div>
                {[
                  ["Agenda", "1. Lectura y aprobación del acta anterior\n2. Informe de avance PRY-001 Corredor Logístico\n3. Votación Plan Operativo 2027\n4. Puntos varios", 4],
                  ["Acuerdos y Resoluciones", "", 5],
                  ["Observaciones", "", 3],
                ].map(([l, v, r]) => (
                  <div key={l as string}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">{l as string}</label>
                    <textarea
                      rows={r as number}
                      className="input resize-none text-sm"
                      defaultValue={v as string}
                      placeholder={!(v as string) ? `Registre ${(l as string).toLowerCase()}…` : undefined}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Lista de Asistencia</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Ing. Carlos Montúfar", "Dra. Sofía Ortiz", "Lic. Manuel Fuentes", "MSc. Claudia Reyes", "Dr. Roberto Ajú", "Ing. Ana Hernández"].map((name) => (
                      <label key={name} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300 accent-navy-700 w-4 h-4" />
                        <span className="text-sm text-slate-700">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setExporting(true);
                      setTimeout(() => {
                        setExporting(false);
                        setExported(true);
                      }, 1500);
                    }}
                    disabled={exporting}
                    className="flex-1 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {exporting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Generando PDF…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Guardar y Exportar PDF
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-5 py-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeup">
      {/* Banner de aviso explicativo para actas pendientes y borradores */}
      {minutesList.some((r) => r.status === "pendiente" || r.status === "borrador") && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3 text-amber-900">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 font-bold text-xs mt-0.5">
            {minutesList.filter((r) => r.status === "pendiente" || r.status === "borrador").length}
          </div>
          <div className="flex-1 min-w-0 text-xs leading-relaxed">
            <p className="font-semibold text-amber-950 text-sm">Documentos en proceso ({minutesList.filter((r) => r.status === "pendiente" || r.status === "borrador").length} registros)</p>
            <p className="text-amber-800 mt-0.5">
              Puedes cambiar el estado de cualquier acta directamente en la columna <strong>Estado</strong> para aprobarla, guardarla como borrador o finalizar su firma.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-navy-900 text-lg">Actas y Documentos</h2>
          <p className="text-xs text-slate-500">Gestión de convocatorias, borradores y actas oficiales</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => openEditor("nueva")}
              className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Nueva Acta
            </button>
          )}
        </div>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
        {[
          { id: "todos", label: `Todos (${minutesList.length})` },
          { id: "borrador", label: `Borradores (${minutesList.filter((r) => r.status === "borrador").length})` },
          { id: "pendiente", label: `Pendientes de Firma (${minutesList.filter((r) => r.status === "pendiente").length})` },
          { id: "publicada", label: `Publicadas (${minutesList.filter((r) => r.status === "publicada").length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`pb-2.5 transition-colors relative ${
              filter === t.id ? "text-navy-900 font-bold border-b-2 border-celeste-500" : "hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Código", "Sesión", "Fecha", "Estado (Cambiar)", "Participantes", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((r) => (
                <tr
                  key={r.id}
                  className={`transition-colors ${
                    r.status === "pendiente"
                      ? "bg-amber-50/30 hover:bg-amber-50/60"
                      : r.status === "borrador"
                      ? "bg-slate-50/70 hover:bg-slate-100/70"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <span style={{ fontFamily: "var(--font-mono)" }} className="text-[11px] text-slate-500 font-medium">
                      {r.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-navy-900 text-[13px]">{r.session}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{r.date}</td>
                  <td className="px-4 py-3.5">
                    {canEdit ? (
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border-0 cursor-pointer outline-none transition-all ${
                          r.status === "publicada"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : r.status === "borrador"
                            ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                            : "bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold"
                        }`}
                      >
                        <option value="borrador">Borrador</option>
                        <option value="pendiente">Pendiente de Firma</option>
                        <option value="publicada">Publicada / Firmada</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                          r.status === "publicada"
                            ? "bg-green-100 text-green-700"
                            : r.status === "borrador"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.status === "borrador" ? "Borrador" : r.status === "pendiente" ? "Pendiente" : "Publicada"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{r.n > 0 ? `${r.n} personas` : "—"}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {r.file && (
                        <button
                          onClick={() => handleExportPDF(r)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-900 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Exportar PDF
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => openEditor(r.id)}
                          className="text-xs font-bold text-navy-700 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {r.status === "publicada" ? "Editar Acta" : "Editar / Firmar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MinutesTab;
