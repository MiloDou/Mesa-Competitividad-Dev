import React, { useEffect, useState } from "react";
import { getVotings, type VotingRecord } from "../../../api/admin";

const statusLabels: Record<VotingRecord["status"], string> = { draft: "Borrador", scheduled: "Programada", open: "Abierta", closed: "Cerrada" };

export const ProposalsTab: React.FC<{ canEdit: boolean }> = () => {
  const [votings, setVotings] = useState<VotingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getVotings().then((rows) => { if (active) setVotings(rows); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No se pudieron cargar las votaciones."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section className="space-y-5">
    <div><h2 className="text-lg font-semibold text-navy-900">Propuestas y votaciones</h2><p className="mt-1 text-sm text-slate-600">Se muestran únicamente los procesos registrados en el sistema.</p></div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {loading ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Cargando votaciones…</p>
      : votings.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No hay propuestas o votaciones registradas.</p>
      : <div className="grid gap-3">{votings.map((voting) => <article key={voting.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs text-slate-500">Votación #{voting.id}{voting.subject ? ` · ${voting.subject.type === "project" ? "Proyecto" : "Acuerdo"} #${voting.subject.id}` : ""}</p><h3 className="mt-1 font-semibold text-slate-900">{voting.title}</h3>{voting.subject && <p className="mt-1 text-sm text-slate-600">{voting.subject.title}</p>}</div><span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{statusLabels[voting.status]}</span></div>
        {voting.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{voting.description}</p>}
        {voting.options.length > 0 && <p className="mt-3 text-xs text-slate-500">Opciones: {voting.options.join(" · ")}</p>}
      </article>)}</div>}
  </section>;
};

export default ProposalsTab;
