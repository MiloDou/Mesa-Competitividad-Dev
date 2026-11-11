import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../api/client";
import { getMinutes, type MinuteRecord } from "../../../api/admin";

interface MinutesTabProps { canEdit: boolean; }

export const MinutesTab: React.FC<MinutesTabProps> = () => {
  const [minutes, setMinutes] = useState<MinuteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getMinutes().then((records) => { if (active) setMinutes(records); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No se pudieron cargar las minutas."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function download(minute: MinuteRecord) {
    if (minute.status !== "approved" || !minute.content.trim()) return;
    setDownloading(minute.id);
    setError("");
    try {
      const response = await apiFetch(`/minutes/${minute.id}/pdf/`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `minuta-${minute.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo descargar el documento.");
    } finally {
      setDownloading(null);
    }
  }

  return <section className="space-y-5">
    <div><h2 className="text-lg font-semibold text-navy-900">Actas y documentos</h2><p className="mt-1 text-sm text-slate-600">Aquí aparecen únicamente minutas registradas en el sistema. No hay documentos oficiales disponibles para publicar por ahora.</p></div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {loading ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Cargando documentos…</p>
      : minutes.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No hay minutas registradas.</p>
      : <div className="space-y-3">{minutes.map((minute) => <article key={minute.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-medium text-slate-900">Minuta #{minute.id} · Sesión #{minute.meeting}</h3><p className="mt-1 text-sm text-slate-600">{minute.content.trim() ? minute.content : "Contenido pendiente de registro"}</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{minute.status === "approved" ? "Aprobada" : "Borrador"}</span></div>
        {minute.status === "approved" && minute.content.trim() && <button type="button" disabled={downloading === minute.id} onClick={() => void download(minute)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-50">{downloading === minute.id ? "Descargando…" : "Descargar PDF"}</button>}
      </article>)}</div>}
  </section>;
};

export default MinutesTab;
