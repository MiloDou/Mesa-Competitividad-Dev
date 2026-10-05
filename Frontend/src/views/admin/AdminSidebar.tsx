import React from "react";
import { Role, Tab } from "../../types/admin";
import {
  GridIcon,
  FolderIcon,
  CalIcon,
  DocIcon,
  UsersIcon,
  VoteIcon,
  GlobeIcon,
  SettingsIcon,
} from "../../components/icons/AdminIcons";
import { LogoIsotype } from "../../Logo";
import { ROLE_COLOR, ROLE_LABEL } from "../../data/admin";

interface AdminSidebarProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  role: Role;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  pendingMinutesCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  tab,
  setTab,
  role,
  collapsed,
  setCollapsed,
  pendingMinutesCount = 0,
}) => {
  const allNav: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Vista General", icon: <GridIcon /> },
    { id: "projects", label: "Proyectos", icon: <FolderIcon /> },
    { id: "meetings", label: "Sesiones y Reuniones", icon: <CalIcon className="w-4 h-4" /> },
    { id: "minutes", label: "Actas y Documentos", icon: <DocIcon className="w-4 h-4" />, badge: pendingMinutesCount },
    { id: "proposals", label: "Propuestas / Votaciones", icon: <VoteIcon /> },
    { id: "site", label: "Editor del Sitio Web", icon: <GlobeIcon className="w-4 h-4" /> },
    { id: "members", label: "Miembros y Entidades", icon: <UsersIcon /> },
    { id: "settings", label: "Configuración", icon: <SettingsIcon /> },
  ];

  const NAV = role === "editor"
    ? allNav.filter((n) => !["projects", "meetings", "members"].includes(n.id))
    : allNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {!collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          className="md:hidden fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex-shrink-0 flex flex-col bg-navy-950 transition-all duration-300 ${
          collapsed
            ? "-translate-x-full md:translate-x-0 md:w-[62px]"
            : "translate-x-0 w-64 md:w-60 shadow-2xl md:shadow-none"
        }`}
      >
        <div className={`h-[60px] flex items-center border-b border-navy-800 flex-shrink-0 ${collapsed ? "justify-center px-0" : "px-4 gap-3 justify-between"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <LogoIsotype size={38} className="flex-shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate leading-tight">Mesa Departamental</p>
                <p className="text-navy-500 text-[10px] truncate">Sistema Interno</p>
              </div>
            )}
          </div>
          {/* Close button on mobile */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="md:hidden text-navy-400 hover:text-white p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setTab(n.id);
                // Close sidebar on mobile when tab clicked
                if (window.innerWidth < 768) {
                  setCollapsed(true);
                }
              }}
              className={`w-full flex items-center transition-all duration-150 relative ${
                collapsed ? "justify-center py-3.5" : "gap-3 px-4 py-3"
              } ${tab === n.id ? "bg-navy-800/70 text-white font-semibold" : "text-navy-400 hover:text-white hover:bg-navy-900"}`}
              title={collapsed ? n.label : undefined}
            >
              {tab === n.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-celeste-500 rounded-r-full" />}
              <span className="w-4 h-4 flex-shrink-0">{n.icon}</span>
              {!collapsed && <span className="text-sm truncate">{n.label}</span>}
              {typeof n.badge === "number" && n.badge > 0 && !collapsed && (
                <span className="ml-auto bg-celeste-500 text-navy-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <div className="border-t border-navy-800 p-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0">
                <span style={{ fontFamily: "var(--font-mono)" }} className="text-navy-200 text-xs font-semibold">
                  CM
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">Usuario autenticado</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLOR[role]}`}>
                  {ROLE_LABEL[role]}
                </span>
              </div>
            </div>
            <p className="text-navy-600 text-[10px] uppercase tracking-widest font-semibold mt-2">Sesión real · permisos aún en integración</p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex border-t border-navy-800 p-3.5 items-center justify-center text-navy-500 hover:text-white hover:bg-navy-900 transition-colors flex-shrink-0"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
};

export default AdminSidebar;
