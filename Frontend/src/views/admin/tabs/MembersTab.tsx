import React, { useState } from "react"
import { ParticipatingEntity, Member } from "../../../types/admin"
import { DEFAULT_ENTITIES, MEMBERS } from "../../../data/admin"
import { PlusIcon } from "../../../components/icons/AdminIcons"
import { useSyncedStorage } from "../../../hooks/useSyncedStorage"
import { EntitiesListSubtab } from "./members/EntitiesListSubtab"
import {
  MembersListSubtab,
  getPositionBadgeStyle,
} from "./members/MembersListSubtab"

export { getPositionBadgeStyle }

interface MembersTabProps {
  canAdmin: boolean
  search: string
  setSearch: (s: string) => void
}

export const MembersTab: React.FC<MembersTabProps> = ({
  canAdmin,
  search,
  setSearch,
}) => {
  const [subTab, setSubTab] = useState<"members" | "entities">("entities")
  const [isAddingEntity, setIsAddingEntity] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [entityViewMode, setEntityViewMode] = useState<"list" | "form">("list")
  const [memberViewMode, setMemberViewMode] = useState<"list" | "form">("list")

  // Fuentes reactivas para mostrar contadores exactos en los botones de pestañas
  const [entitiesList] = useSyncedStorage<ParticipatingEntity[]>(
    "mesa_conformados_entidades",
    DEFAULT_ENTITIES,
    {
      eventName: "mesa_entidades_updated",
      validate: (val) => Array.isArray(val) && val.length > 0,
    },
  )

  const [membersList] = useSyncedStorage<Member[]>(
    "mesa_directiva_miembros",
    MEMBERS,
    {
      eventName: "mesa_miembros_updated",
      validate: (val) => Array.isArray(val) && val.length > 0,
    },
  )

  const activeEntitiesCount = entitiesList.filter(
    (e) => e.status === "activo",
  ).length
  const activeMembersCount = membersList.filter(
    (m) => m.status === "activo",
  ).length

  const isFormActive =
    (subTab === "entities" && entityViewMode === "form") ||
    (subTab === "members" && memberViewMode === "form")

  return (
    <div className="space-y-5 animate-fadeup">
      {/* Barra de Navegación entre Miembros y Entidades (Oculta mientras un formulario esté abierto) */}
      {!isFormActive && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab("entities")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === "entities"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Entidades Participantes ({activeEntitiesCount} activas de{" "}
              {entitiesList.length})
            </button>
            <button
              onClick={() => setSubTab("members")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === "members"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Colaboradores ({activeMembersCount} activos de{" "}
              {membersList.length})
            </button>
          </div>

          {/* Buscador y Botón de Agregar */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9.5! pl-9 py-2 w-52 sm:w-60 text-sm"
                style={{ paddingLeft: "2.35rem" }}
                placeholder={
                  subTab === "entities"
                    ? "Buscar entidad o sector…"
                    : "Buscar colaborador…"
                }
              />
            </div>

            {canAdmin && (
              <button
                onClick={() => {
                  if (subTab === "entities") {
                    setIsAddingEntity(true)
                  } else {
                    setIsAddingMember(true)
                  }
                }}
                className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                {subTab === "entities"
                  ? "Agregar Entidad"
                  : "Agregar Colaborador"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RENDER DE SUB-PESTAÑA CORRESPONDIENTE */}
      {subTab === "entities" ? (
        <EntitiesListSubtab
          canAdmin={canAdmin}
          search={search}
          isAdding={isAddingEntity}
          onCloseAdd={() => setIsAddingEntity(false)}
          onViewChange={setEntityViewMode}
        />
      ) : (
        <MembersListSubtab
          canAdmin={canAdmin}
          search={search}
          isAdding={isAddingMember}
          onCloseAdd={() => setIsAddingMember(false)}
          onViewChange={setMemberViewMode}
        />
      )}
    </div>
  )
}

export default MembersTab
