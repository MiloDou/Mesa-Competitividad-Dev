import React, { useState, useEffect } from "react"
import { ParticipatingEntity } from "../../../../types/admin"
import { useSyncedStorage } from "../../../../hooks/useSyncedStorage"
import { CustomSelect } from "../../../../components/ui/CustomSelect"

interface EntitiesListSubtabProps {
  canAdmin: boolean
  search: string
  isAdding?: boolean
  onCloseAdd?: () => void
  onViewChange?: (view: "list" | "form") => void
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Sector Público": "bg-teal-100 text-teal-800",
  Academia: "bg-rose-100 text-rose-800",
  "Sector Social": "bg-emerald-100 text-emerald-800",
  "Sector Productivo": "bg-amber-100 text-amber-800",
  "Sector Investigativo": "bg-indigo-100 text-indigo-800",
}

export const EntitiesListSubtab: React.FC<EntitiesListSubtabProps> = ({
  canAdmin,
  search,
  isAdding = false,
  onCloseAdd,
  onViewChange,
}) => {
  const [entitiesList, updateEntitiesState] =
    useSyncedStorage<ParticipatingEntity[]>(
      "mesa_conformados_entidades",
      [],
      {
        eventName: "mesa_entidades_updated",
        validate: Array.isArray,
      },
    )

  const [editingEntity, setEditingEntity] =
    useState<ParticipatingEntity | null>(null)
  const [entityView, setEntityView] = useState<"list" | "form">("list")
  const [entityName, setEntityName] = useState("")
  const [entityCategory, setEntityCategory] =
    useState<ParticipatingEntity["category"]>("Sector Público")
  const [entityPhoto, setEntityPhoto] = useState("")
  const [entityStatus, setEntityStatus] = useState<"activo" | "inactivo">(
    "activo",
  )

  // Reaccionar cuando el padre activa el modo de agregar
  useEffect(() => {
    if (isAdding) {
      setEditingEntity(null)
      setEntityName("")
      setEntityCategory("Sector Público")
      setEntityPhoto(
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop&auto=format",
      )
      setEntityStatus("activo")
      setEntityView("form")
    }
  }, [isAdding])

  // Notificar al componente padre el cambio de vista (para ocultar barra de pestañas si está en form)
  useEffect(() => {
    onViewChange?.(entityView)
  }, [entityView, onViewChange])

  const handleEntityPhotoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setEntityPhoto(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  function handleToggleEntityStatus(id: string) {
    const next = entitiesList.map((e) =>
      e.id === id
        ? {
            ...e,
            status:
              e.status === "activo" ? "inactivo" as const : "activo" as const,
          }
        : e,
    )
    updateEntitiesState(next)
  }

  function handleDeleteEntity(id: string) {
    if (
      window.confirm("¿Seguro que deseas eliminar esta entidad participante?")
    ) {
      const next = entitiesList.filter((e) => e.id !== id)
      updateEntitiesState(next)
    }
  }

  function openEditEntity(ent: ParticipatingEntity) {
    setEditingEntity(ent)
    setEntityName(ent.name)
    setEntityCategory(ent.category)
    setEntityPhoto(ent.photo || "")
    setEntityStatus(ent.status)
    setEntityView("form")
  }

  function closeForm() {
    setEntityView("list")
    onCloseAdd?.()
  }

  function handleSaveEntity(e: React.FormEvent) {
    e.preventDefault()
    if (!entityName.trim()) return

    const initials =
      entityName
        .split(" ")
        .filter((w) => w.length > 2)
        .slice(0, 3)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || entityName.substring(0, 4).toUpperCase()

    if (editingEntity) {
      const next = entitiesList.map((ent) =>
        ent.id === editingEntity.id
          ? {
              ...ent,
              name: entityName.trim(),
              category: entityCategory,
              photo: entityPhoto.trim(),
              status: entityStatus,
              initials,
            }
          : ent,
      )
      updateEntitiesState(next)
    } else {
      const newEntity: ParticipatingEntity = {
        id: "ent_" + Date.now(),
        name: entityName.trim(),
        category: entityCategory,
        photo:
          entityPhoto.trim() ||
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop&auto=format",
        status: entityStatus,
        initials,
      }
      updateEntitiesState([...entitiesList, newEntity])
    }
    closeForm()
  }

  const filteredEntities = entitiesList.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()),
  )

  if (entityView === "form") {
    return (
      <div className="space-y-4 animate-fadeup max-w-2xl">
        <button
          onClick={closeForm}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors cursor-pointer"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a Entidades
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="font-semibold text-navy-900 text-lg">
              {editingEntity
                ? "Editar Entidad Participante"
                : "Agregar Nueva Entidad Participante"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete la información de la institución aliada conformadora de
              la Mesa
            </p>
          </div>
          <form onSubmit={handleSaveEntity} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre de la Entidad / Institución *
              </label>
              <input
                required
                type="text"
                className="input text-sm"
                placeholder="Ej. CUNOC / USAC, INGUAT, Cámara de Comercio..."
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Área / Sector al que pertenece *
                </label>
                <CustomSelect
                  value={entityCategory}
                  onChange={(val) =>
                    setEntityCategory(val as ParticipatingEntity["category"])
                  }
                  options={[
                    { value: "Sector Público", label: "Sector Público" },
                    { value: "Academia", label: "Academia" },
                    { value: "Sector Social", label: "Sector Social" },
                    { value: "Sector Productivo", label: "Sector Productivo" },
                    {
                      value: "Sector Investigativo",
                      label: "Sector Investigativo",
                    },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estado Inicial *
                </label>
                <CustomSelect
                  value={entityStatus}
                  onChange={(val) =>
                    setEntityStatus(val as "activo" | "inactivo")
                  }
                  options={[
                    {
                      value: "activo",
                      label: "Activo (Visible en la web pública)",
                    },
                    { value: "inactivo", label: "Inactivo (Oculto)" },
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fotografía / Logo de la Entidad (URL o Archivo) *
              </label>
              <div className="flex gap-2">
                <input
                  required
                  type="text"
                  className="input text-sm flex-1"
                  placeholder="https://images.unsplash.com/... o sube una imagen local"
                  value={entityPhoto}
                  onChange={(e) => setEntityPhoto(e.target.value)}
                />
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Subir foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEntityPhotoFileChange}
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Puedes ingresar un enlace de imagen o presionar "Subir foto"
                para cargar un archivo desde tu dispositivo.
              </p>
              {entityPhoto && (
                <div className="mt-3 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                      <img
                        src={entityPhoto}
                        alt="Vista previa"
                        className="w-full h-full object-contain object-center"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-slate-700 font-semibold block">
                        Vista previa del logotipo / foto
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                        {entityPhoto.startsWith("data:")
                          ? "Imagen cargada localmente"
                          : entityPhoto}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEntityPhoto("")}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex-shrink-0"
                  >
                    Quitar foto
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {editingEntity
                  ? "Guardar Cambios de Entidad"
                  : "Registrar Entidad"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-5 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredEntities.map((ent) => (
        <div
          key={ent.id}
          className={`bg-white rounded-xl border p-5 transition-all ${
            ent.status === "inactivo"
              ? "opacity-60 border-slate-200 bg-slate-50/50"
              : "border-slate-200 hover:border-navy-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-gold-400/80 flex-shrink-0 bg-white p-1.5 flex items-center justify-center shadow-xs">
              {ent.photo ? (
                <img
                  src={ent.photo}
                  alt={ent.name}
                  className="w-full h-full object-contain object-center"
                />
              ) : (
                <div className="w-full h-full bg-navy-900 rounded-lg flex items-center justify-center text-gold-400 font-bold text-xs">
                  {ent.initials || "ENT"}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-navy-900 text-sm leading-tight">
                  {ent.name}
                </p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    CATEGORY_COLORS[ent.category] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {ent.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mesa Departamental de Competitividad
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    ent.status === "activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {ent.status === "activo"
                    ? "Activo (en web)"
                    : "Inactivo (oculto)"}
                </span>
              </div>
            </div>
          </div>

          {canAdmin && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs">
              <button
                onClick={() => openEditEntity(ent)}
                className="text-navy-600 hover:text-navy-900 font-semibold transition-colors cursor-pointer"
              >
                Editar
              </button>
              <span className="text-slate-200">·</span>
              <button
                onClick={() => handleToggleEntityStatus(ent.id)}
                className={`${
                  ent.status === "activo"
                    ? "text-amber-600 hover:text-amber-800"
                    : "text-green-600 hover:text-green-800"
                } font-medium transition-colors cursor-pointer`}
              >
                {ent.status === "activo" ? "Desactivar" : "Activar"}
              </button>
              <span className="text-slate-200">·</span>
              <button
                onClick={() => handleDeleteEntity(ent.id)}
                className="text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default EntitiesListSubtab
