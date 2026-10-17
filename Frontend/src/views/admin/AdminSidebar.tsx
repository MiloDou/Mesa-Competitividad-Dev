import React, { useState } from "react"
import { Role, Tab } from "../../types/admin"
import {
  GridIcon,
  FolderIcon,
  CalIcon,
  DocIcon,
  UsersIcon,
  VoteIcon,
  GlobeIcon,
  SettingsIcon,
} from "../../components/icons/AdminIcons"
import { LogoIsotype } from "../../Logo"
import { ROLE_COLOR, ROLE_LABEL } from "../../data/admin"

interface AdminSidebarProps {
  tab: Tab
  setTab: (t: Tab) => void
  role: Role
  collapsed: boolean
  setCollapsed: (c: boolean) => void
  pendingMinutesCount?: number
  onLogout?: () => void
}

interface NavItem {
  id: Tab
  label: string
  icon: React.ReactNode
  badge?: number
}

interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  tab,
  setTab,
  role,
  collapsed,
  setCollapsed,
  pendingMinutesCount = 0,
  onLogout,
}) => {
  // Estados para desplegar/contraer submenús
  const [adminOpen, setAdminOpen] = useState(true)
  const [editOpen, setEditOpen] = useState(true)

  // Submenú 1: Administrativo -> Propuestas, Actas, Documentos y Reuniones
  const adminItems: NavItem[] = [
    { id: "proposals", label: "Propuestas / Votaciones", icon: <VoteIcon /> },
    {
      id: "minutes",
      label: "Actas",
      icon: <DocIcon className="w-4 h-4" />,
      badge: pendingMinutesCount,
    },
    {
      id: "documents",
      label: "Documentos",
      icon: <DocIcon className="w-4 h-4" />,
    },
    {
      id: "meetings",
      label: "Sesiones y Reuniones",
      icon: <CalIcon className="w-4 h-4" />,
    },
  ]

  // Submenú 2: Editar -> Configuración, Entidades (Colaboradores), Proyectos y Editor Sitio Web
  const editItems: NavItem[] = [
    { id: "settings", label: "Configuración", icon: <SettingsIcon /> },
    { id: "members", label: "Entidades y Miembros", icon: <UsersIcon /> },
    { id: "projects", label: "Proyectos", icon: <FolderIcon /> },
    {
      id: "site",
      label: "Editor del Sitio Web",
      icon: <GlobeIcon className="w-4 h-4" />,
    },
  ]

  // Filtrado según permisos del rol
  const filterByRole = (items: NavItem[]) => {
    if (role === "editor") {
      return items.filter(
        (n) => !["projects", "meetings", "members"].includes(n.id)
      )
    }
    return items
  }

  const allowedAdminItems = filterByRole(adminItems)
  const allowedEditItems = filterByRole(editItems)

  const handleSelectTab = (selectedTab: Tab) => {
    setTab(selectedTab)
    if (window.innerWidth < 768) {
      setCollapsed(true)
    }
  }

  const renderNavItem = (n: NavItem, isNested: boolean = false) => {
    const isActive = tab === n.id
    return (
      <button
        key={n.id}
        onClick={() => handleSelectTab(n.id)}
        className={`w-full flex items-center transition-all duration-150 relative text-left ${
          collapsed
            ? "justify-center py-2.5"
            : isNested
            ? "gap-2.5 pl-8 pr-3 py-2 text-xs"
            : "gap-3 px-3.5 py-2.5 text-sm"
        } rounded-xl font-medium ${
          isActive
            ? "bg-white/[0.08] text-[#E2E8F0] font-semibold border-l-2 border-[#3B82F6] rounded-l-none pl-3"
            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/[0.04]"
        }`}
        title={collapsed ? n.label : undefined}
      >
        <span
          className={`flex-shrink-0 transition-colors ${
            isActive ? "text-[#60A5FA]" : "text-[#94A3B8]"
          }`}
        >
          {n.icon}
        </span>
        {!collapsed && <span className="truncate">{n.label}</span>}
        {typeof n.badge === "number" && n.badge > 0 && !collapsed && (
          <span className="ml-auto bg-[#4F46E5] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
            {n.badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {!collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          className="md:hidden fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex-shrink-0 flex flex-col bg-[#0F172A] border-r border-[#1E293B] transition-all duration-300 ${
          collapsed
            ? "-translate-x-full md:translate-x-0 md:w-[68px]"
            : "translate-x-0 w-64 md:w-60 shadow-xl md:shadow-none"
        }`}
      >
        {/* Cabecera Sidebar */}
        <div
          className={`h-[60px] flex items-center border-b border-[#1E293B] bg-[#0F172A] flex-shrink-0 ${
            collapsed ? "justify-center px-0" : "px-4 gap-3 justify-between"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoIsotype size={34} className="flex-shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[#E2E8F0] text-xs font-bold truncate leading-tight">
                  Mesa Departamental
                </p>
                <p className="text-[#94A3B8] text-[10px] font-medium truncate">
                  CMS Institucional
                </p>
              </div>
            )}
          </div>
          {/* Botón cerrar en móvil */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="md:hidden text-[#94A3B8] hover:text-[#E2E8F0] p-1 rounded-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Lista de Navegación con Submenús */}
        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {/* Ítem raíz: Vista General */}
          {renderNavItem({
            id: "overview",
            label: "Vista General",
            icon: <GridIcon className="w-4 h-4" />,
          })}

          {/* Submenú 1: Administrativo */}
          {allowedAdminItems.length > 0 && (
            <div className="pt-2">
              {!collapsed ? (
                <div className="bg-[#1E293B]/40 border border-[#1E293B] rounded-2xl p-1.5">
                  <button
                    onClick={() => setAdminOpen(!adminOpen)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-[#94A3B8] hover:text-[#E2E8F0] uppercase tracking-wider rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
                      <span>ADMINISTRATIVO</span>
                    </span>
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 text-[#94A3B8] ${
                        adminOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {adminOpen && (
                    <div className="mt-1 space-y-0.5">
                      {allowedAdminItems.map((item) => renderNavItem(item, true))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="h-px bg-[#1E293B] my-1 mx-2" />
                  {allowedAdminItems.map((item) => renderNavItem(item))}
                </div>
              )}
            </div>
          )}

          {/* Submenú 2: Edición y Configuración */}
          {allowedEditItems.length > 0 && (
            <div className="pt-2">
              {!collapsed ? (
                <div className="bg-[#1E293B]/40 border border-[#1E293B] rounded-2xl p-1.5">
                  <button
                    onClick={() => setEditOpen(!editOpen)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-[#94A3B8] hover:text-[#E2E8F0] uppercase tracking-wider rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
                      <span>EDICIÓN Y AJUSTES</span>
                    </span>
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 text-[#94A3B8] ${
                        editOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {editOpen && (
                    <div className="mt-1 space-y-0.5">
                      {allowedEditItems.map((item) => renderNavItem(item, true))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="h-px bg-[#1E293B] my-1 mx-2" />
                  {allowedEditItems.map((item) => renderNavItem(item))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Tarjeta de usuario (abajo) */}
        {!collapsed ? (
          <div className="border-t border-[#1E293B] p-3.5 bg-[#0F172A] flex-shrink-0">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1E293B] border border-[#334155] shadow-xs flex items-center justify-center flex-shrink-0 text-[#E2E8F0]">
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-xs font-bold"
                >
                  CM
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[#E2E8F0] text-xs font-semibold truncate">
                  Usuario autenticado
                </p>
                <span
                  className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4F46E5] text-white shadow-xs"
                >
                  {ROLE_LABEL[role]}
                </span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#1E293B]/70 hover:bg-red-950/40 active:bg-red-900/50 text-[#94A3B8] hover:text-red-200 text-xs font-medium border border-[#334155]/60 hover:border-red-800/60 shadow-xs transition-all cursor-pointer"
                title="Cerrar sesión y volver al sitio público"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        ) : (
          onLogout && (
            <div className="border-t border-[#1E293B] p-2.5 flex justify-center bg-[#0F172A] flex-shrink-0">
              <button
                onClick={onLogout}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1E293B]/70 hover:bg-red-950/40 text-[#94A3B8] hover:text-red-200 border border-[#334155]/60 hover:border-red-800/60 shadow-xs transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          )
        )}

        {/* Botón contraer / expandir sidebar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex border-t border-[#1E293B] p-3 items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]/50 transition-colors flex-shrink-0"
          title={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </aside>
    </>
  )
}

export default AdminSidebar

