import React, { useState, useEffect, useRef } from "react"
import { ParticipatingEntity, Member } from "../../../types/admin"
import { PlusIcon } from "../../../components/icons/AdminIcons"
import { useSyncedStorage } from "../../../hooks/useSyncedStorage"
import { EntitiesListSubtab } from "./members/EntitiesListSubtab"
import {
  MembersListSubtab,
  getPositionBadgeStyle,
} from "./members/MembersListSubtab"
import {
  getAdminLandingContent,
  saveLandingContent,
} from "../../../api/landingContent"

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
  const [cloudSaveError, setCloudSaveError] = useState("")
  const [cloudSaveStatus, setCloudSaveStatus] = useState<
    "checking" | "ready" | "saving" | "saved" | "error"
  >("checking")
  const [initialLoaded, setInitialLoaded] = useState(false)
  const cloudReady = useRef(false)
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve())

  // Fuentes reactivas para mostrar contadores exactos en los botones de pestañas
  const [entitiesList] = useSyncedStorage<ParticipatingEntity[]>(
    "mesa_conformados_entidades",
    [],
    {
      eventName: "mesa_entidades_updated",
      validate: Array.isArray,
    },
  )

  const [membersList] = useSyncedStorage<Member[]>(
    "mesa_directiva_miembros",
    [],
    {
      eventName: "mesa_miembros_updated",
      validate: Array.isArray,
    },
  )

  useEffect(() => {
    let active = true
    const readList = (key: string): any[] => {
      try {
        const value = JSON.parse(localStorage.getItem(key) || "[]")
        return Array.isArray(value) ? value : []
      } catch {
        return []
      }
    }
    const persistMemberData = (changedList: "members" | "entities") => {
      if (!active || !cloudReady.current) return
      const content = changedList === "members"
        ? { members: readList("mesa_directiva_miembros") }
        : { entities: readList("mesa_conformados_entidades") }
      setCloudSaveStatus("saving")
      setCloudSaveError("")
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => saveLandingContent(content))
        .then(() => {
          if (active) setCloudSaveStatus("saved")
        })
        .catch((error) => {
          if (!active) return
          setCloudSaveStatus("error")
          setCloudSaveError(
            error instanceof Error
              ? error.message
              : "No se pudo guardar en la nube.",
          )
        })
    }

    const handleMembersUpdated = () => persistMemberData("members")
    const handleEntitiesUpdated = () => persistMemberData("entities")
    window.addEventListener("mesa_miembros_edited", handleMembersUpdated)
    window.addEventListener("mesa_entidades_edited", handleEntitiesUpdated)
    getAdminLandingContent()
      .then(({ content }) => {
        if (!active) return
        try {
          localStorage.setItem(
            "mesa_directiva_miembros",
            JSON.stringify(Array.isArray(content.members) ? content.members : []),
          )
          window.dispatchEvent(new Event("mesa_miembros_updated"))
          localStorage.setItem(
            "mesa_conformados_entidades",
            JSON.stringify(Array.isArray(content.entities) ? content.entities : []),
          )
          window.dispatchEvent(new Event("mesa_entidades_updated"))
          if (Array.isArray(content.custom_positions)) {
            localStorage.setItem(
              "mesa_custom_positions",
              JSON.stringify(content.custom_positions),
            )
          }
        } catch {
          /* retain the current browser data if the cache cannot be updated */
        }
        cloudReady.current = true
        setInitialLoaded(true)
        setCloudSaveStatus("ready")
      })
      .catch((error) => {
        if (!active) return
        setCloudSaveStatus("error")
        setCloudSaveError(
          error instanceof Error
            ? error.message
            : "No se pudo conectar con la base de datos.",
        )
      })
    return () => {
      active = false
      cloudReady.current = false
      window.removeEventListener("mesa_miembros_edited", handleMembersUpdated)
      window.removeEventListener("mesa_entidades_edited", handleEntitiesUpdated)
    }
  }, [])

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
      <p
        role="status"
        aria-live="polite"
        className={`text-xs font-medium ${
          cloudSaveStatus === "saved" || cloudSaveStatus === "ready"
            ? "text-emerald-700"
            : cloudSaveStatus === "error"
              ? "text-amber-800"
              : "text-slate-600"
        }`}
      >
        {cloudSaveStatus === "checking"
          ? "Cargando información…"
          : cloudSaveStatus === "ready"
            ? "Contenido sincronizado con la nube"
            : cloudSaveStatus === "saving"
              ? "Guardando cambios en la nube…"
              : cloudSaveStatus === "saved"
                ? "Cambios guardados en la nube"
                : "No se pudieron guardar los cambios. Revisa tu conexión e inténtalo de nuevo."}
      </p>
      {cloudSaveError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
        >
          No se guardó en la nube: {cloudSaveError}
        </p>
      )}
      {/* Barra de Navegación entre Miembros y Entidades (Oculta mientras un formulario esté abierto) */}
      {initialLoaded && !isFormActive && (
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
      {!initialLoaded ? null : subTab === "entities" ? (
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
