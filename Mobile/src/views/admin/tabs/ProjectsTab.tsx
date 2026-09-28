import React, { useState } from "react";
import { Project } from "../../../types/admin";
import { PROJECTS, STATUS_CHIP } from "../../../data/admin";
import { PlusIcon, EyeIcon, EyeOffIcon, PencilIcon } from "../../../components/icons/AdminIcons";

interface ProjectsTabProps {
  canEdit: boolean;
  vis: Record<string, "public" | "private">;
  setVis: (id: string, v: "public" | "private") => void;
  onEdit: (p: Project) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  canEdit,
  vis,
  setVis,
  onEdit,
}) => {
  const [filter, setFilter] = useState("todos");
  const filtered = filter === "todos" ? PROJECTS : PROJECTS.filter((p) => p.status === filter);

  return (
    <div className="space-y-5 animate-fadeup">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {["todos", "activo", "revision", "borrador", "completado"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                filter === f ? "bg-navy-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {canEdit && (
          <button className="ml-auto flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <PlusIcon className="w-3.5 h-3.5" />
            Nuevo Proyecto
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["ID", "Proyecto", "Responsable", "Estado", "Avance", "Visibilidad", ""].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest ${
                      h === "" ? "w-8" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group cursor-pointer" onClick={() => onEdit(p)}>
                  <td className="px-4 py-3.5">
                    <span style={{ fontFamily: "var(--font-mono)" }} className="text-[11px] text-slate-400">
                      {p.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-navy-900 text-[13px] leading-snug max-w-[220px]">{p.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p.cat} · {p.updated}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs hidden md:table-cell">{p.lead}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_CHIP[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-2.5 min-w-[90px]">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.status === "completado" ? "bg-green-500" : "bg-navy-600"}`}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)" }} className="text-[11px] text-slate-500 w-7 text-right">
                        {p.pct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => canEdit && setVis(p.id, vis[p.id] === "public" ? "private" : "public")}
                      disabled={!canEdit}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                        vis[p.id] === "public"
                          ? `bg-green-100 text-green-700 ${canEdit ? "hover:bg-green-600 hover:text-white cursor-pointer" : "cursor-default opacity-60"}`
                          : `bg-slate-100 text-slate-500 ${canEdit ? "hover:bg-slate-200 cursor-pointer" : "cursor-default opacity-60"}`
                      }`}
                    >
                      {vis[p.id] === "public" ? (
                        <>
                          <EyeIcon className="w-3 h-3" />
                          Público
                        </>
                      ) : (
                        <>
                          <EyeOffIcon className="w-3 h-3" />
                          Privado
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                      <button
                        onClick={() => onEdit(p)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-all"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
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

export default ProjectsTab;
