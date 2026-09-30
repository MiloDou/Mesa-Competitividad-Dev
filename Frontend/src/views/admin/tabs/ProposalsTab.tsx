import React, { useState } from "react";
import { AdminProposal as Proposal } from "../../../types/admin";
import { ADMIN_PROPOSALS, PROPOSALS, MEMBERS } from "../../../data/admin";
import { PlusIcon, ChevronRightIcon, VoteIcon } from "../../../components/icons/AdminIcons";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { CustomDatePicker } from "../../../components/ui/CustomDatePicker";

interface ProposalsTabProps {
  canEdit: boolean;
}

export const ProposalsTab: React.FC<ProposalsTabProps> = ({ canEdit }) => {
  const [proposalList, setProposalList] = useState<Proposal[]>(ADMIN_PROPOSALS);
  const [view, setView] = useState<"list" | "new">("list");
  const [detail, setDetail] = useState<Proposal | null>(null);
  const [filter, setFilter] = useState<"todas" | "activa" | "cerrada" | "borrador">("todas");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState("Planificación");
  const [newDl, setNewDl] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = proposalList.filter((p) => {
    const matchesStatus = filter === "todas" || p.status === filter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  const S: Record<string, { bg: string; text: string }> = {
    activa: { bg: "bg-green-100", text: "text-green-700" },
    cerrada: { bg: "bg-slate-100", text: "text-slate-600" },
    borrador: { bg: "bg-amber-100", text: "text-amber-700" },
  };

  function handleCloseVoting(id: string) {
    setProposalList((prev) => prev.map((p) => (p.id === id ? { ...p, status: "cerrada" } : p)));
    if (detail && detail.id === id) {
      setDetail({ ...detail, status: "cerrada" });
    }
  }

  function handlePublishProposal(id: string) {
    setProposalList((prev) => prev.map((p) => (p.id === id ? { ...p, status: "activa" } : p)));
    if (detail && detail.id === id) {
      setDetail({ ...detail, status: "activa" });
    }
  }

  function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    setCreating(true);
    setTimeout(() => {
      const createdItem: Proposal = {
        id: `P-00${proposalList.length + 1}`,
        title: newTitle,
        desc: newDesc,
        category: newCat || "General",
        deadline: newDl || "30 Sep 2026",
        status: "activa",
        favor: 0,
        contra: 0,
        abstencion: 0,
        total: 14,
        created: "Hoy",
      };
      setProposalList([createdItem, ...proposalList]);
      setCreating(false);
      setCreated(true);
    }, 1000);
  }

  if (detail)
    return (
      <div className="animate-fadeup space-y-5">
        <button
          onClick={() => setDetail(null)}
          className="flex items-center gap-2 text-navy-600 hover:text-navy-900 text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Propuestas
        </button>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 bg-navy-50">
            <div className="flex items-center gap-3 mb-2">
              <span style={{ fontFamily: "var(--font-mono)" }} className="text-[11px] text-slate-400">
                {detail.id}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${S[detail.status].bg} ${S[detail.status].text}`}>
                {detail.status}
              </span>
            </div>
            <h2 className="font-semibold text-navy-900 text-lg leading-snug">{detail.title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {detail.category} · Creada: {detail.created} · Cierre: {detail.deadline}
            </p>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-slate-600 text-sm leading-relaxed">{detail.desc}</p>
            <div>
              <h3 className="font-semibold text-navy-900 text-sm mb-4">Resultados de Votación</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: "A favor", n: detail.favor, color: "text-green-700", bg: "bg-green-50 border-green-200" },
                  { label: "En contra", n: detail.contra, color: "text-red-700", bg: "bg-red-50 border-red-200" },
                  { label: "Abstención", n: detail.abstencion, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
                ].map((v) => (
                  <div key={v.label} className={`border rounded-xl p-4 text-center ${v.bg}`}>
                    <p style={{ fontFamily: "var(--font-display)" }} className={`text-3xl font-normal ${v.color}`}>
                      {v.n}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{v.label}</p>
                  </div>
                ))}
              </div>
              <div className="h-3 rounded-full overflow-hidden flex bg-slate-100">
                <div className="bg-green-500 h-full" style={{ width: `${(detail.favor / detail.total) * 100}%` }} />
                <div className="bg-red-500 h-full" style={{ width: `${(detail.contra / detail.total) * 100}%` }} />
                <div className="bg-slate-300 h-full" style={{ width: `${(detail.abstencion / detail.total) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>
                  {detail.favor + detail.contra + detail.abstencion} de {detail.total} miembros han votado
                </span>
                <span>{Math.round(((detail.favor + detail.contra + detail.abstencion) / detail.total) * 100)}% participación</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-navy-900 text-sm mb-3">Registro de Votos</h3>
              <div className="space-y-1.5">
                {MEMBERS.slice(0, 6).map((m, i) => {
                  const vt = i === 0 || i === 1 || i === 3 || i === 5 ? "favor" : i === 2 ? "contra" : "abstencion";
                  const voted2 = i < detail.favor + detail.contra + detail.abstencion;
                  return (
                    <div key={m.name} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${voted2 ? "bg-slate-50" : ""}`}>
                      <div className="w-7 h-7 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
                        <span style={{ fontFamily: "var(--font-mono)" }} className="text-celeste-400 text-[10px] font-bold">
                          {m.initials}
                        </span>
                      </div>
                      <p className="text-sm text-navy-900 flex-1">{m.name}</p>
                      {voted2 ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            vt === "favor" ? "bg-green-100 text-green-700" : vt === "contra" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {vt === "favor" ? "A favor" : vt === "contra" ? "En contra" : "Abstención"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pendiente</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  if (view === "new")
    return (
      <div className="animate-fadeup space-y-5">
        <button
          onClick={() => {
            setView("list");
            setCreated(false);
          }}
          className="flex items-center gap-2 text-navy-600 hover:text-navy-900 text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h2 className="font-semibold text-navy-900 mb-5">Nueva Propuesta de Votación</h2>
          {created ? (
            <div className="text-center py-10 animate-fadeup">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-navy-900">Propuesta creada y publicada</p>
              <p className="text-sm text-slate-500 mt-1">Los miembros recibirán notificación para votar.</p>
              <button
                onClick={() => {
                  setView("list");
                  setCreated(false);
                  setNewTitle("");
                  setNewDesc("");
                  setNewCat("");
                  setNewDl("");
                }}
                className="mt-4 text-navy-600 hover:text-navy-900 text-sm underline underline-offset-2"
              >
                Ver lista de propuestas
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Título de la propuesta *</label>
                <input
                  className="input text-sm"
                  placeholder="Ej. Aprobación del presupuesto 2027"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Descripción / Contexto *</label>
                <textarea
                  rows={4}
                  className="input resize-none text-sm"
                  placeholder="Describa la propuesta con suficiente contexto..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Categoría *</label>
                  <CustomSelect
                    value={newCat}
                    onChange={(val) => setNewCat(val)}
                    options={["Planificación", "Membresía", "Cooperación", "Gobernanza", "Presupuesto", "Otros"]}
                    placeholder="Seleccione…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fecha límite</label>
                  <CustomDatePicker
                    value={newDl}
                    onChange={(val) => setNewDl(val)}
                    placeholder="Seleccione fecha…"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Publicando…
                    </>
                  ) : (
                    "Guardar y Publicar Propuesta"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-4 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );

  return (
    <div className="space-y-5 animate-fadeup">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <input
              type="text"
              placeholder="Buscar propuesta o categoría…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pl-9 text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800 shadow-sm"
              aria-label="Buscar propuestas"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm" role="tablist" aria-label="Filtros de propuesta">
            {(["todas", "activa", "borrador", "cerrada"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none ${
                  filter === f ? "bg-navy-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => setView("new")}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Nueva Propuesta
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold text-sm text-navy-950">No se encontraron propuestas</p>
          <p className="text-xs text-slate-400 mt-1">Intente cambiar el filtro o el término de búsqueda.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const voted = p.favor + p.contra + p.abstencion;
          const pending = Math.max(0, p.total - voted);
          const participation = p.total > 0 ? Math.round((voted / p.total) * 100) : 0;
          const sp = S[p.status];
          const hasvotes = p.status !== "borrador" && p.total > 0;
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
              <div className="p-5 flex gap-5 items-start">
                {/* Pie chart */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <VotePieChart favor={p.favor} contra={p.contra} abstenciones={p.abstencion} pendientes={pending} total={p.total} active={hasvotes} />
                  <span className="text-[10px] text-slate-400 mt-1">{participation}% participación</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-slate-400">
                      {p.id}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sp.bg} ${sp.text}`}>{p.status}</span>
                    <span className="text-xs text-slate-400 ml-auto flex-shrink-0">Cierre: {p.deadline}</span>
                  </div>
                  <h3 className="font-semibold text-navy-900 text-sm leading-snug mb-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{p.desc}</p>
                  {hasvotes && (
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {[
                        { n: p.favor, l: "Favor", c: "text-green-700 bg-green-50" },
                        { n: p.contra, l: "Contra", c: "text-red-700 bg-red-50" },
                        { n: p.abstencion, l: "Abstención", c: "text-slate-600 bg-slate-50" },
                      ].map(({ n, l, c }) => (
                        <div key={l} className={`rounded-lg py-1.5 ${c}`}>
                          <p className="font-bold text-base leading-none">{n}</p>
                          <p className="text-[10px] mt-0.5 opacity-80">{l}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {p.status === "borrador" && <p className="text-xs text-slate-400 italic">Sin votos — propuesta en borrador</p>}
                </div>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setDetail(p)}
                  className="text-xs font-semibold text-navy-600 hover:text-navy-900 flex items-center gap-1.5 transition-colors"
                >
                  Ver detalle y votos
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
                {canEdit && p.status === "borrador" && (
                  <button
                    onClick={() => handlePublishProposal(p.id)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    Publicar
                  </button>
                )}
                {canEdit && p.status === "activa" && (
                  <button
                    onClick={() => handleCloseVoting(p.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                  >
                    Cerrar votación
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

/* ─── pie chart component ───────────────────────────────────────────────── */
function VotePieChart({
  favor,
  contra,
  abstenciones,
  pendientes,
  total,
  active,
}: {
  favor: number;
  contra: number;
  abstenciones: number;
  pendientes: number;
  total: number;
  active: boolean;
}) {
  const r = 28;
  const cx = 40;
  const cy = 40;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * r;

  if (!active || total === 0) {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#94A3B8" fontWeight="600">
          —
        </text>
      </svg>
    );
  }

  const slices = [
    { n: favor, color: "#16A34A" },
    { n: contra, color: "#DC2626" },
    { n: abstenciones, color: "#64748B" },
    { n: pendientes, color: "#E2E8F0" },
  ].filter((s) => s.n > 0);

  let accumulatedPercent = 0;

  const paths = slices.map((s, idx) => {
    const strokeDasharray = `${(s.n / total) * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += s.n / total;

    return (
      <circle
        key={idx}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={s.color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-300"
      />
    );
  });

  const pct = total > 0 ? Math.round(((favor + contra + abstenciones) / total) * 100) : 0;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
      {paths}
      <text x={cx} y={cy - 3} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#0F172A" fontWeight="800">
        {pct}%
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#64748B" fontWeight="600">
        votos
      </text>
    </svg>
  );
}

export default ProposalsTab;
