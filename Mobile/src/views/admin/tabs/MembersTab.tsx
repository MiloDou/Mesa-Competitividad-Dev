import React from "react";
import { MEMBERS, ROLE_COLOR, ROLE_LABEL } from "../../../data/admin";
import { PlusIcon } from "../../../components/icons/AdminIcons";

interface MembersTabProps {
  canAdmin: boolean;
  search: string;
  setSearch: (s: string) => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  canAdmin,
  search,
  setSearch,
}) => {
  const filtered = MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.org.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fadeup">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 py-2 w-56 text-sm"
            placeholder="Buscar miembro…"
          />
        </div>
        {canAdmin && (
          <button className="ml-auto flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <PlusIcon className="w-3.5 h-3.5" />
            Agregar Miembro
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <div
            key={m.name}
            className={`bg-white rounded-xl border p-5 transition-all ${
              m.status === "inactivo" ? "opacity-50 border-slate-200" : "border-slate-200 hover:border-navy-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
                <span style={{ fontFamily: "var(--font-mono)" }} className="text-celeste-400 text-xs font-semibold">
                  {m.initials}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-navy-900 text-sm leading-tight">{m.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLOR[m.role]}`}>
                    {ROLE_LABEL[m.role]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{m.org}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{m.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      m.status === "activo" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.status}
                  </span>
                  <span className="text-[10px] text-slate-400">Desde {m.joined}</span>
                </div>
              </div>
            </div>
            {canAdmin && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-3 text-xs">
                <button className="text-navy-600 hover:text-navy-900 font-semibold transition-colors">Editar</button>
                <span className="text-slate-200">·</span>
                <button className="text-slate-400 hover:text-slate-700 font-medium transition-colors">Cambiar rol</button>
                <span className="text-slate-200">·</span>
                <button className="text-red-500 hover:text-red-700 font-medium transition-colors">
                  {m.status === "activo" ? "Desactivar" : "Activar"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersTab;
