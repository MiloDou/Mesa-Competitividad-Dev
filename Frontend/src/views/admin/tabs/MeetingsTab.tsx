import React, { useCallback, useEffect, useState } from "react";
import { archiveMeeting, createMeeting, getCommissions, getMeetings, updateMeeting, type CommissionRecord, type MeetingInput, type MeetingRecord } from "../../../api/admin";
import { PlusIcon, CalIcon, ClockIcon, PinIcon, PencilIcon, TrashIcon } from "../../../components/icons/AdminIcons";

interface MeetingsTabProps {
  canEdit: boolean;
  newMeeting: boolean;
  setNewMeeting: (value: boolean) => void;
}

function dateTimeInputs(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

function meetingDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
}

export const MeetingsTab: React.FC<MeetingsTabProps> = ({ canEdit, newMeeting, setNewMeeting }) => {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<MeetingRecord | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [commission, setCommission] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [modality, setModality] = useState<MeetingInput["modality"]>("in_person");
  const [description, setDescription] = useState("");
  const [agenda, setAgenda] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [meetingRows, commissionRows] = await Promise.all([getMeetings(), getCommissions()]);
      setMeetings(meetingRows);
      setCommissions(commissionRows);
      setCommission((current) => current || String(commissionRows[0]?.id || ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar las sesiones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDate("");
    setTime("09:00");
    setLocation("");
    setMeetingLink("");
    setModality("in_person");
    setDescription("");
    setAgenda("");
  }

  function startCreate() {
    resetForm();
    setCommission(String(commissions[0]?.id || ""));
    setNewMeeting(true);
  }

  function startEdit(meeting: MeetingRecord) {
    const parts = dateTimeInputs(meeting.scheduled_at);
    setEditing(meeting);
    setTitle(meeting.title);
    setDate(parts.date);
    setTime(parts.time);
    setCommission(String(meeting.commission));
    setLocation(meeting.location);
    setMeetingLink(meeting.meeting_link);
    setModality(meeting.modality);
    setDescription(meeting.description);
    setAgenda(meeting.agenda.join("\n"));
    setNewMeeting(true);
  }

  async function saveMeeting(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!commission) {
      setError("No hay una comisión activa en el servidor. Registra o activa una comisión antes de programar sesiones.");
      return;
    }
    const fields: MeetingInput = {
      commission: Number(commission),
      title: title.trim(),
      description: description.trim(),
      agenda: agenda.split("\n").map((item) => item.trim()).filter(Boolean),
      scheduled_at: meetingDateTime(date, time),
      modality,
      location: location.trim(),
      meeting_link: meetingLink.trim(),
      confidentiality: "internal",
    };
    setSaving(true);
    try {
      if (editing) await updateMeeting(editing.id, fields);
      else await createMeeting(fields);
      setNewMeeting(false);
      resetForm();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la sesión.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMeeting(meeting: MeetingRecord) {
    if (!window.confirm(`¿Archivar la sesión “${meeting.title}”?`)) return;
    setError("");
    try {
      await archiveMeeting(meeting.id);
      setMeetings((current) => current.filter((item) => item.id !== meeting.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo archivar la sesión.");
    }
  }

  return (
    <div className="space-y-5 animate-fadeup">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy-900">Calendario de Sesiones</h2>
        {canEdit && <button onClick={startCreate} className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"><PlusIcon className="w-3.5 h-3.5" />Programar Reunión</button>}
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {newMeeting && <form onSubmit={saveMeeting} className="bg-white border border-navy-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-navy-900">{editing ? "Editar sesión" : "Nueva sesión"}</h3><button type="button" onClick={() => { setNewMeeting(false); resetForm(); }} className="text-sm text-slate-500 hover:text-slate-800">Cerrar</button></div>
        {!commissions.length && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No hay comisiones activas disponibles en la base de datos. Primero crea o activa una comisión y asigna miembros.</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-600">Título *<input required className="input mt-1 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600">Comisión *<select required disabled={!commissions.length} className="input mt-1 text-sm" value={commission} onChange={(event) => setCommission(event.target.value)}>{!commissions.length && <option value="">Sin comisiones activas</option>}{commissions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Fecha *<input required type="date" className="input mt-1 text-sm" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600">Hora *<input required type="time" className="input mt-1 text-sm" value={time} onChange={(event) => setTime(event.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600">Modalidad<select className="input mt-1 text-sm" value={modality} onChange={(event) => setModality(event.target.value as MeetingInput["modality"])}><option value="in_person">Presencial</option><option value="virtual">Virtual</option><option value="hybrid">Híbrida</option></select></label>
          <label className="text-xs font-semibold text-slate-600">Lugar<input className="input mt-1 text-sm" value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Enlace de reunión<input type="url" className="input mt-1 text-sm" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="https://…" /></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Descripción<textarea className="input mt-1 min-h-20 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Agenda <span className="font-normal">(un tema por línea)</span><textarea className="input mt-1 min-h-20 text-sm" value={agenda} onChange={(event) => setAgenda(event.target.value)} /></label>
        </div>
        <div className="flex gap-3"><button type="submit" disabled={saving || !commissions.length} className="bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl">{saving ? "Guardando…" : editing ? "Guardar cambios" : "Guardar sesión"}</button><button type="button" onClick={() => { setNewMeeting(false); resetForm(); }} className="border border-slate-200 px-4 py-2.5 rounded-xl text-sm">Cancelar</button></div>
      </form>}

      {loading ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Cargando sesiones…</p> : meetings.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No hay sesiones registradas en el servidor.</p> : <div className="grid lg:grid-cols-2 gap-4">{meetings.map((meeting) => {
        const upcoming = new Date(meeting.scheduled_at).getTime() >= Date.now();
        return <article key={meeting.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className={`px-5 py-3 flex items-center justify-between ${upcoming ? "bg-navy-50" : "bg-slate-50"}`}><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${upcoming ? "bg-navy-800 text-white" : "bg-slate-200 text-slate-700"}`}>{upcoming ? "Programada" : "Realizada"}</span>{canEdit && <div className="flex gap-1"><button onClick={() => startEdit(meeting)} className="flex items-center gap-1 px-2 py-1 text-xs text-navy-700 hover:bg-white rounded"><PencilIcon className="w-3.5 h-3.5" />Editar</button><button onClick={() => void removeMeeting(meeting)} aria-label="Archivar sesión" className="p-1.5 text-slate-500 hover:text-red-700 rounded"><TrashIcon className="w-3.5 h-3.5" /></button></div>}</div>
          <div className="p-5"><h3 className="font-semibold text-navy-900 mb-3">{meeting.title}</h3><dl className="grid grid-cols-2 gap-2 text-xs text-slate-600"><div className="flex items-center gap-1.5"><CalIcon className="w-3 h-3" />{formatDate(meeting.scheduled_at)}</div><div className="flex items-center gap-1.5"><ClockIcon className="w-3 h-3" />{formatTime(meeting.scheduled_at)}</div>{meeting.location && <div className="col-span-2 flex items-center gap-1.5"><PinIcon className="w-3 h-3" />{meeting.location}</div>}</dl>{meeting.description && <p className="mt-3 text-sm text-slate-600">{meeting.description}</p>}{meeting.agenda.length > 0 && <ul className="mt-3 list-disc pl-5 text-xs text-slate-600">{meeting.agenda.map((topic, index) => <li key={`${index}-${topic}`}>{topic}</li>)}</ul>}{meeting.meeting_link && <div className="mt-4"><a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-1.5 rounded-lg">Abrir enlace</a></div>}</div>
        </article>;
      })}</div>}
    </div>
  );
};

export default MeetingsTab;
