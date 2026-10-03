import React, { useState } from "react";
import { ADMIN_MEETINGS } from "../../../data/admin";
import { AdminMeeting } from "../../../types/admin";
import { PlusIcon, CalIcon, ClockIcon, PinIcon, DocIcon, PencilIcon } from "../../../components/icons/AdminIcons";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { CustomDatePicker } from "../../../components/ui/CustomDatePicker";

interface MeetingsTabProps {
  canEdit: boolean;
  newMeeting: boolean;
  setNewMeeting: (v: boolean) => void;
  openMinute: (id: string) => void;
}

export const MeetingsTab: React.FC<MeetingsTabProps> = ({
  canEdit,
  newMeeting,
  setNewMeeting,
  openMinute,
}) => {
  const [meetingList, setMeetingList] = useState<AdminMeeting[]>(ADMIN_MEETINGS);
  const [editingMeeting, setEditingMeeting] = useState<AdminMeeting | null>(null);

  const [titleInput, setTitleInput] = useState("");
  const [dateInput, setDateInput] = useState("2026-10-01");
  const [timeInput, setTimeInput] = useState("09:00");
  const [locInput, setLocInput] = useState("");
  const [typeInput, setTypeInput] = useState("Sesión Ordinaria");
  const [modalityInput, setModalityInput] = useState("Presencial");

  function openCreateForm() {
    setEditingMeeting(null);
    setTitleInput("");
    setDateInput("2026-10-01");
    setTimeInput("09:00");
    setLocInput("");
    setTypeInput("Sesión Ordinaria");
    setModalityInput("Presencial");
    setNewMeeting(true);
  }

  function openEditForm(m: any) {
    setEditingMeeting(m);
    setTitleInput(m.title);
    setDateInput(m.date);
    setTimeInput(m.time ? m.time.split(" – ")[0] || "09:00" : "09:00");
    setLocInput(m.loc);
    setNewMeeting(true);
  }

  function handleSaveMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!titleInput.trim()) return;

    const formattedDate = dateInput.includes("-")
      ? new Date(dateInput + "T00:00:00").toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : dateInput;

    if (editingMeeting) {
      // Edit existing
      setMeetingList((prev) =>
        prev.map((item) =>
          item.id === editingMeeting.id
            ? {
                ...item,
                title: titleInput,
                date: formattedDate,
                time: `${timeInput} – 12:00`,
                loc: locInput || item.loc,
              }
            : item
        )
      );
    } else {
      // Create new
      const newM = {
        id: `REU-0${meetingList.length + 22}`,
        title: titleInput,
        date: formattedDate,
        time: `${timeInput} – 12:00`,
        loc: locInput || "Sala de Sesiones, CUNOC",
        n: 14,
        status: "upcoming",
        file: null,
      };
      setMeetingList([newM, ...meetingList]);
    }

    setNewMeeting(false);
    setEditingMeeting(null);
    setTitleInput("");
    setLocInput("");
  }

  return (
    <div className="space-y-5 animate-fadeup">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy-900">Calendario de Sesiones</h2>
        {canEdit && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Programar Reunión
          </button>
        )}
      </div>

      {newMeeting && (
        <form onSubmit={handleSaveMeeting} className="bg-white border border-navy-200 rounded-xl p-6 shadow-sm animate-fadeup">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-navy-900">
              {editingMeeting ? `Editar Reunión — ${editingMeeting.id}` : "Nueva Reunión / Acta en borrador"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setNewMeeting(false);
                setEditingMeeting(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Título de la sesión *</label>
              <input
                type="text"
                required
                className="input text-sm"
                placeholder="Ej. Sesión Ordinaria No. 023"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fecha *</label>
              <CustomDatePicker
                value={dateInput}
                onChange={(val) => setDateInput(val)}
                placeholder="Seleccione fecha…"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Hora de inicio</label>
              <input
                type="time"
                className="input text-sm"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Lugar / enlace</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="Sala de sesiones / URL zoom"
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo</label>
              <CustomSelect
                value={typeInput}
                onChange={(val) => setTypeInput(val)}
                options={["Sesión Ordinaria", "Mesa de Trabajo", "Comisión Especial"]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Modalidad</label>
              <CustomSelect
                value={modalityInput}
                onChange={(val) => setModalityInput(val)}
                options={["Presencial", "Virtual", "Híbrida"]}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
              {editingMeeting ? "Guardar Cambios de Reunión" : "Guardar Reunión y Crear Borrador"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNewMeeting(false);
                setEditingMeeting(null);
              }}
              className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {meetingList.map((m) => (
          <div key={m.id} className={`bg-white rounded-xl border overflow-hidden ${m.status === "upcoming" ? "border-navy-200" : "border-slate-200"}`}>
            <div className={`px-5 py-3 flex items-center justify-between ${m.status === "upcoming" ? "bg-navy-50" : "bg-slate-50"}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === "upcoming" ? "bg-navy-800 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {m.status === "upcoming" ? "Programada" : "Realizada"}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-slate-400">
                  {m.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400">{m.n} participantes</span>
                {canEdit && (
                  <button
                    onClick={() => openEditForm(m)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-navy-600 hover:text-navy-900 hover:bg-navy-100/60 px-2 py-1 rounded transition-colors"
                    title="Editar reunión"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-navy-900 mb-3 leading-snug">{m.title}</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <CalIcon className="w-3 h-3 flex-shrink-0" />
                  {m.date}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <ClockIcon className="w-3 h-3 flex-shrink-0" />
                  {m.time}
                </div>
                <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
                  <PinIcon className="w-3 h-3 flex-shrink-0" />
                  {m.loc}
                </div>
              </dl>
              <div className="flex gap-2 flex-wrap">
                {m.status === "done" ? (
                  <>
                    {m.file && (
                      <a
                        href="#"
                        className="flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-900 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <DocIcon className="w-3.5 h-3.5" />
                        Acta PDF
                      </a>
                    )}
                    {!m.file && canEdit && (
                      <button
                        onClick={() => openMinute(m.id)}
                        className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Generar Acta
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button className="text-xs font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors">
                      Ver Convocatoria
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => openMinute(m.id)}
                        className="text-xs font-semibold text-celeste-700 bg-celeste-50 hover:bg-celeste-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Preparar Acta
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingsTab;
