import React from "react";
import { PlusIcon } from "../../../components/icons/AdminIcons";

interface MinutesTabProps {
  canEdit: boolean;
  onOpen: (id: string) => void;
}

export const MinutesTab: React.FC<MinutesTabProps> = ({ canEdit, onOpen }) => {
  const rows = [
    { id: "ACT-021", session: "Sesión Ordinaria No. 021", date: "18 Sep 2026", status: "pendiente", n: 0, file: null },
    { id: "ACT-020", session: "Sesión Ordinaria No. 020", date: "21 Ago 2026", status: "publicada", n: 16, file: "Acta-020.pdf" },
    { id: "ACT-019", session: "Comisión Especial", date: "10 Ago 2026", status: "publicada", n: 11, file: "Acta-019.pdf" },
    { id: "ACT-018", session: "Sesión Ordinaria No. 018", date: "17 Jul 2026", status: "publicada", n: 14, file: "Acta-018.pdf" },
  ];

  return (
    <div className="space-y-5 animate-fadeup">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy-900">Actas y Minutas</h2>
        {canEdit && (
          <button
            onClick={() => onOpen("nueva")}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Nueva Acta
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Código", "Sesión", "Fecha", "Estado", "Participantes", "Acciones"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <span style={{ fontFamily: "var(--font-mono)" }} className="text-[11px] text-slate-400">
                    {r.id}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-navy-900 text-[13px]">{r.session}</td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">{r.date}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      r.status === "publicada" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">{r.n > 0 ? `${r.n} personas` : "—"}</td>
                <td className="px-4 py-3.5">
                  {r.file ? (
                    <a href="#" className="flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-900 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Exportar PDF
                    </a>
                  ) : (
                    canEdit && (
                      <button onClick={() => onOpen(r.id)} className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors">
                        Generar
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MinutesTab;
