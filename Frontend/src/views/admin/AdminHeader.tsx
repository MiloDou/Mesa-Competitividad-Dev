import React from "react";
import { Role, Tab } from "../../types/admin";
import { ROLE_COLOR, ROLE_LABEL } from "../../data/admin";
import { BellIcon } from "../../components/icons/AdminIcons";

interface AdminHeaderProps {
  tab: Tab;
  role: Role;
  showNotif: boolean;
  setShowNotif: React.Dispatch<React.SetStateAction<boolean>>;
  hasUnread?: boolean;
  collapsed?: boolean;
  setCollapsed?: (c: boolean) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  tab,
  role,
  showNotif,
  setShowNotif,
  hasUnread = true,
  collapsed,
  setCollapsed,
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
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {setCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="md:hidden text-navy-800 hover:bg-slate-100 p-1.5 rounded-lg transition-colors flex-shrink-0"
            title="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-semibold text-navy-900 text-[14px] sm:text-[15px] leading-tight truncate">
            {TAB_LABELS[tab] ?? "Panel"}
          </h1>
          <p className="text-slate-400 text-[10px] sm:text-xs truncate">
            Mesa Departamental de Competitividad
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span className="hidden sm:block text-xs text-slate-400">Acceso:</span>
        <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full ${ROLE_COLOR[role]}`}>
          {ROLE_LABEL[role]}
        </span>
        {!canEdit && (
          <span className="hidden xs:inline-block text-[10px] sm:text-xs text-slate-400 bg-slate-100 px-2 py-0.5 sm:py-1 rounded">
            Solo lectura
          </span>
        )}
        <button
          onClick={() => setShowNotif((v) => !v)}
          className="relative w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <BellIcon className="w-4 h-4 text-slate-500" />
          {hasUnread && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-celeste-500 rounded-full border border-white" />}
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
