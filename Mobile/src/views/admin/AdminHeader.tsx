import React from "react";
import { Role, Tab } from "../../types/admin";
import { ROLE_COLOR, ROLE_LABEL } from "../../data/admin";
import { BellIcon } from "../../components/icons/AdminIcons";

interface AdminHeaderProps {
  tab: Tab;
  role: Role;
  showNotif: boolean;
  setShowNotif: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  tab,
  role,
  showNotif,
  setShowNotif,
}) => {
  const canEdit = role === "comision" || role === "editor";

  const TAB_LABELS: Record<Tab, string> = {
    overview: "Vista General",
    projects: "Proyectos",
    meetings: "Sesiones y Reuniones",
    minutes: "Actas y Documentos",
    proposals: "Propuestas / Votaciones",
    site: "Editor del Sitio Web",
    members: "Miembros y Entidades",
    settings: "Configuración",
  };

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 gap-4">
      <div>
        <h1 className="font-semibold text-navy-900 text-[15px] leading-none">
          {TAB_LABELS[tab] ?? "Panel"}
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Mesa Departamental de Competitividad — Sistema Interno
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-slate-400">Acceso:</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLOR[role]}`}>
          {ROLE_LABEL[role]}
        </span>
        {!canEdit && (
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
            Solo lectura
          </span>
        )}
        <button
          onClick={() => setShowNotif((v) => !v)}
          className="relative w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <BellIcon className="w-4 h-4 text-slate-500" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-celeste-500 rounded-full border border-white" />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
