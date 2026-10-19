import React, { useState, useRef } from "react";
import { PlusIcon } from "../../../components/icons/AdminIcons";
import { downloadPdfDocument } from "../../../utils/pdfExport";

export interface MinutesItem {
  id: string;
  session: string;
  date: string;
  status: string;
  n: number;
  file: string | null;
  fileData?: string; // Data URL si se subió un PDF
  location?: string;
  agenda?: string;
  agreements?: string;
  notes?: string;
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
  const [activeId, setActiveId] = useState<string>("nueva");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // Modo en el editor: "form" o "pdf"
  const [creationMode, setCreationMode] = useState<"form" | "pdf">("form");

  // Estado del formulario
  const [formSession, setFormSession] = useState("Ordinaria No. 021 / 2026");
  const [formDate, setFormDate] = useState("18 de septiembre de 2026");
  const [formLocation, setFormLocation] = useState("Sala de Sesiones, CUNOC");
  const [formStatus, setFormStatus] = useState<string>("borrador");
  const [formAgenda, setFormAgenda] = useState("1. Lectura y aprobación del acta anterior\n2. Informe de avance PRY-001 Corredor Logístico\n3. Votación Plan Operativo 2027\n4. Puntos varios");
  const [formAgreements, setFormAgreements] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAttendees, setFormAttendees] = useState(12);

  // Subida de PDF
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(null);
  const [uploadedPdfData, setUploadedPdfData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function openNewActa() {
    setActiveId("nueva");
    setCreationMode("form");
    const nextNum = minutesList.length + 1;
    setFormSession(`Ordinaria No. ${String(nextNum).padStart(3, "0")} / 2026`);
    setFormDate(new Date().toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }));
    setFormLocation("Sala de Sesiones, CUNOC");
    setFormStatus("borrador");
    setFormAgenda("1. Lectura y aprobación del acta anterior\n2. Seguimiento de proyectos prioritarios\n3. Puntos varios");
    setFormAgreements("");
    setFormNotes("");
    setFormAttendees(12);
    setUploadedPdfName(null);
    setUploadedPdfData(null);
    setExported(false);
    setView("editor");
  }

  function openEditor(id: string) {
    setActiveId(id);
    const item = minutesList.find((m) => m.id === id);
    if (item) {
      setFormSession(item.session);
      setFormDate(item.date);
      setFormLocation(item.location || "Sala de Sesiones, CUNOC");
      setFormStatus(item.status);
      setFormAgenda(item.agenda || "1. Lectura y aprobación del acta anterior\n2. Informe de avance PRY-001 Corredor Logístico\n3. Votación Plan Operativo 2027\n4. Puntos varios");
      setFormAgreements(item.agreements || "");
      setFormNotes(item.notes || "");
      setFormAttendees(item.n || 12);
      setUploadedPdfName(item.file || null);
      setUploadedPdfData(item.fileData || null);
      setCreationMode(item.fileData ? "pdf" : "form");
    }
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
              file: newStatus === "publicada" ? (item.file || `${id}.pdf`) : item.file,
            }
          : item
      )
    );
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      alert("Por favor seleccione un archivo en formato PDF.");
      return;
    }

    setUploadedPdfName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPdfData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveActa = () => {
    if (activeId === "nueva") {
      const nextNum = minutesList.length + 1;
      const genId = `ACT-${String(nextNum).padStart(3, "0")}`;
      const newMinute: MinutesItem = {
        id: genId,
        session: formSession.trim(),
        date: formDate,
        status: formStatus,
        n: formAttendees,
        file: creationMode === "pdf" ? (uploadedPdfName || `${genId}.pdf`) : (formStatus === "publicada" ? `${genId}.pdf` : null),
        fileData: creationMode === "pdf" ? (uploadedPdfData || undefined) : undefined,
        location: formLocation,
        agenda: formAgenda,
        agreements: formAgreements,
        notes: formNotes,
      };
      setMinutesList((prev) => [newMinute, ...prev]);
      setActiveId(genId);
    } else {
      setMinutesList((prev) =>
        prev.map((item) =>
          item.id === activeId
            ? {
                ...item,
                session: formSession,
                date: formDate,
                location: formLocation,
                status: formStatus,
                agenda: formAgenda,
                agreements: formAgreements,
                notes: formNotes,
                n: formAttendees,
                file: creationMode === "pdf" ? (uploadedPdfName || item.file) : item.file,
                fileData: creationMode === "pdf" ? (uploadedPdfData || item.fileData) : item.fileData,
              }
            : item
        )
      );
    }
  };

  const filteredRows = minutesList.filter((r) => {
    if (filter === "todos") return true;
    return r.status === filter;
  });

  function handleExportPDF(row: MinutesItem) {
    if (row.fileData) {
      // Si fue subido como archivo PDF original, descargarlo directamente
      const link = document.createElement("a");
      link.href = row.fileData;
      link.download = row.file || `${row.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    downloadPdfDocument(
      row.file || `${row.id}.pdf`,
      `Acta Oficial - ${row.session}`,
      [
        `Código de Registro: ${row.id}`,
        `Fecha de Sesión: ${row.date}`,
        `Lugar: ${row.location || "Sala de Sesiones, CUNOC"}`,
        `Participantes registrados: ${row.n} miembros`,
        `Estado: ${row.status.toUpperCase()}`,
        `Agenda: ${row.agenda || "Lectura del orden del día y revisión de acuerdos."}`,
        `Acuerdos alcanzados: ${row.agreements || "Se aprueban por unanimidad los puntos tratados en la sesión ordinaria."}`,
        `Certificación: El presente documento constituye copia fiel de su original que obra en las actas oficiales de la Mesa Departamental de Competitividad de Quetzaltenango.`
      ]
    );
  }

  if (view === "editor") {
    return (
      <div className="space-y-4 animate-fadeup max-w-4xl">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Actas y Documentos
        </button>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)" }} className="text-navy-950 text-xl md:text-2xl font-bold">
                {activeId === "nueva" ? "Crear Nueva Acta de Reunión" : "Editar Acta de Reunión"}
              </h2>
              <p style={{ fontFamily: "var(--font-mono)" }} className="text-slate-400 text-xs mt-0.5 font-semibold">
                {activeId}
              </p>
            </div>

            {/* Selector de Modo: 1. Llenar Formulario Digital vs 2. Subir Archivo PDF */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setCreationMode("form")}
                className={`py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  creationMode === "form"
                    ? "bg-white text-navy-950 shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>1. Llenar Formulario Digital</span>
              </button>

              <button
                type="button"
                onClick={() => setCreationMode("pdf")}
                className={`py-2 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  creationMode === "pdf"
                    ? "bg-white text-navy-950 shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                }`}
              >
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>2. Subir Archivo PDF</span>
              </button>
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
                <p className="font-semibold text-navy-900">Acta registrada exitosamente</p>
                <p className="text-slate-500 text-sm mt-1">El documento ha sido guardado y actualizado con éxito.</p>
                <div className="flex gap-3 justify-center mt-5">
                  <button
                    onClick={() => {
                      const cur = minutesList.find((m) => m.id === activeId) || {
                        id: activeId,
                        session: formSession,
                        date: formDate,
                        location: formLocation,
                        status: formStatus,
                        n: formAttendees,
                        file: formStatus === "publicada" ? `${activeId}.pdf` : null,
                        fileData: uploadedPdfData || undefined,
                        agenda: formAgenda,
                        agreements: formAgreements,
                      };
                      handleExportPDF(cur);
                    }}
                    className="bg-navy-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-navy-800 transition-colors cursor-pointer"
                  >
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className="border border-slate-200 text-slate-600 font-medium text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Volver al listado
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Cabecera de Datos Principales: Sesión, Fecha, Lugar y Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Título o Número de Sesión <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Sesión Ordinaria No. 023 / 2026"
                      className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:border-navy-900 focus:outline-none"
                      value={formSession}
                      onChange={(e) => setFormSession(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha de Sesión</label>
                    <input
                      type="text"
                      placeholder="Ej. 18 de septiembre de 2026"
                      className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:border-navy-900 focus:outline-none"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Lugar de Reunión</label>
                    <input
                      type="text"
                      placeholder="Sala de Sesiones, CUNOC"
                      className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:border-navy-900 focus:outline-none"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Estado Inicial</label>
                    <select
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 p-2.5 focus:border-navy-900 focus:outline-none cursor-pointer bg-white"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      <option value="borrador">Borrador</option>
                      <option value="pendiente">Pendiente de Firma</option>
                      <option value="publicada">Publicada / Firmada</option>
                    </select>
                  </div>
                </div>

                {/* MODO 1: Llenar Formulario Digital */}
                {creationMode === "form" && (
                  <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeup">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Agenda u Orden del Día
                      </label>
                      <textarea
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-navy-900 focus:outline-none"
                        value={formAgenda}
                        onChange={(e) => setFormAgenda(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Acuerdos y Resoluciones
                      </label>
                      <textarea
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-navy-900 focus:outline-none"
                        value={formAgreements}
                        onChange={(e) => setFormAgreements(e.target.value)}
                        placeholder="Registre acuerdos y resoluciones acordados en la asamblea…"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Participantes Asistentes
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-navy-900 focus:outline-none"
                          value={formAttendees}
                          onChange={(e) => setFormAttendees(Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Observaciones
                        </label>
                        <input
                          type="text"
                          placeholder="Opcional…"
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-navy-900 focus:outline-none"
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Lista de Asistencia</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        {["Ing. Carlos Montúfar", "Dra. Sofía Ortiz", "Lic. Manuel Fuentes", "MSc. Claudia Reyes", "Dr. Roberto Ajú", "Ing. Ana Hernández"].map((name) => (
                          <label key={name} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                            <input type="checkbox" defaultChecked className="rounded border-slate-300 accent-navy-700 w-4 h-4 cursor-pointer" />
                            <span className="text-xs font-medium text-slate-700">{name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* MODO 2: Subir Archivo PDF */}
                {creationMode === "pdf" && (
                  <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeup">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Archivo PDF Oficial Firmado <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                          uploadedPdfName
                            ? "border-green-400 bg-green-50/40"
                            : "border-slate-300 hover:border-navy-800 bg-slate-50/70"
                        }`}
                      >
                        {uploadedPdfName ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
                              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm font-bold text-navy-950 truncate max-w-sm">
                              {uploadedPdfName}
                            </span>
                            <span className="text-xs text-green-700 font-semibold">
                              PDF cargado correctamente · Haz clic para cambiar de archivo
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center">
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-navy-950">
                              Haz clic aquí para seleccionar o arrastrar el archivo PDF
                            </p>
                            <p className="text-xs text-slate-500">
                              Soporta documentos PDF oficiales escaneados o firmados digitalmente.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Número estimado de asistentes registrados en el acta
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-navy-900 focus:outline-none"
                        value={formAttendees}
                        onChange={(e) => setFormAttendees(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (creationMode === "pdf" && !uploadedPdfName) {
                        alert("Por favor seleccione un archivo PDF antes de guardar.");
                        return;
                      }
                      handleSaveActa();
                      setExporting(true);
                      setTimeout(() => {
                        setExporting(false);
                        setExported(true);
                      }, 900);
                    }}
                    disabled={exporting}
                    className="flex-1 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {exporting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Guardando cambios…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Guardar Acta y Exportar PDF
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (creationMode === "pdf" && !uploadedPdfName) {
                        alert("Por favor seleccione un archivo PDF antes de guardar.");
                        return;
                      }
                      handleSaveActa();
                      setView("list");
                    }}
                    className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm px-5 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Guardar y Volver
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
              onClick={openNewActa}
              className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
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
