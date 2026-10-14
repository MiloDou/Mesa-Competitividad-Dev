import React, { useState, useEffect } from "react"
import { Member, Role } from "../../../../types/admin"
import { ROLE_COLOR, ROLE_LABEL } from "../../../../data/admin"
import { useSyncedStorage } from "../../../../hooks/useSyncedStorage"
import { CustomSelect } from "../../../../components/ui/CustomSelect"

interface MembersListSubtabProps {
  canAdmin: boolean
  search: string
  isAdding?: boolean
  onCloseAdd?: () => void
  onViewChange?: (view: "list" | "form") => void
}

export const getPositionBadgeStyle = (_pos?: string) => {
  return "bg-slate-100 text-navy-800 border border-slate-300 font-semibold"
}

export const MembersListSubtab: React.FC<MembersListSubtabProps> = ({
  canAdmin,
  search,
  isAdding = false,
  onCloseAdd,
  onViewChange,
}) => {
  const [membersList, updateMembersState] = useSyncedStorage<Member[]>(
    "mesa_directiva_miembros",
    [],
    {
      eventName: "mesa_miembros_updated",
      validate: Array.isArray,
      transform: (list) =>
        Array.isArray(list)
          ? list.map((m: Member) => ({
              ...m,
              position: "Colaborador",
            }))
          : list,
    },
  )

  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [memberView, setMemberView] = useState<"list" | "form">("list")
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formOrg, setFormOrg] = useState("")
  const [formRole, setFormRole] = useState<Role>("editor")
  const [formPhoto, setFormPhoto] = useState("")

  // Reaccionar cuando el componente padre activa la adición
  useEffect(() => {
    if (isAdding) {
      setEditingMember(null)
      setFormName("")
      setFormEmail("")
      setFormOrg("")
      setFormRole("editor")
      setFormPhoto(
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      )
      setMemberView("form")
    }
  }, [isAdding])

  // Notificar al componente padre el cambio de vista (para ocultar barra de pestañas si está en form)
  useEffect(() => {
    onViewChange?.(memberView)
  }, [memberView, onViewChange])

  const handleMemberPhotoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFormPhoto(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  function handleToggleMemberStatus(email: string) {
    const next = membersList.map((m) =>
      m.email === email
        ? { ...m, status: m.status === "activo" ? "inactivo" : "activo" }
        : m,
    )
    updateMembersState(next)
  }

  function handleToggleRole(email: string) {
    const next = membersList.map((m) =>
      m.email === email
        ? {
            ...m,
            role: m.role === "comision" ? "editor" as Role : "comision" as Role,
          }
        : m,
    )
    updateMembersState(next)
  }

  function handleDeleteMember(email: string) {
    if (window.confirm("¿Seguro que deseas eliminar este colaborador?")) {
      const next = membersList.filter((m) => m.email !== email)
      updateMembersState(next)
    }
  }

  function openEditMember(m: Member) {
    setEditingMember(m)
    setFormName(m.name)
    setFormEmail(m.email)
    setFormOrg(m.org)
    setFormRole(m.role)
    setFormPhoto(m.photo || "")
    setMemberView("form")
  }

  function closeForm() {
    setMemberView("list")
    onCloseAdd?.()
  }

  function handleSaveMember(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim() || !formPhoto.trim()) return

    const finalPosition = "Colaborador"

    if (editingMember) {
      const next = membersList.map((m) =>
        m.email === editingMember.email
          ? {
              ...m,
              name: formName,
              email: formEmail,
              org: formOrg,
              role: formRole,
              position: finalPosition,
              photo: formPhoto,
            }
          : m,
      )
      updateMembersState(next)
    } else {
      const initials =
        formName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "MB"

      const newMember: Member = {
        name: formName,
        email: formEmail,
        org: formOrg,
        role: formRole,
        position: finalPosition,
        status: "activo",
        initials,
        joined: "Hoy",
        photo: formPhoto,
      }
      updateMembersState([newMember, ...membersList])
    }
    closeForm()
  }

  const filteredMembers = membersList.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.org.toLowerCase().includes(search.toLowerCase()),
  )

  if (memberView === "form") {
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
          Volver a Colaboradores
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="font-semibold text-navy-900 text-lg">
              {editingMember
                ? "Editar Registro de Colaborador"
                : "Agregar Nuevo Colaborador"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete la información del colaborador institucional
            </p>
          </div>
          <form onSubmit={handleSaveMember} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre Completo *
              </label>
              <input
                required
                type="text"
                className="input text-sm"
                placeholder="Ej. Ing. Juan Pérez"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correo Electrónico *
                </label>
                <input
                  required
                  type="email"
                  className="input text-sm"
                  placeholder="correo@entidad.gt"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rol de Sistema *
                </label>
                <CustomSelect
                  value={formRole}
                  onChange={(val) => setFormRole(val as Role)}
                  options={[
                    { value: "comision", label: "Comisión (Admin)" },
                    { value: "editor", label: "Editor" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Puesto / Función (Distribución Plana) *
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  className="input text-sm bg-slate-100 text-slate-600 cursor-not-allowed font-medium"
                  value="Colaborador"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Estructura plana: sin cargos jerárquicos.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Organización / Entidad *
                </label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="Ej. Cámara de Comercio de Quetzaltenango"
                  value={formOrg}
                  onChange={(e) => setFormOrg(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fotografía de Perfil (URL o Archivo) *
              </label>
              <div className="flex gap-2">
                <input
                  required
                  type="text"
                  className="input text-sm flex-1"
                  placeholder="https://images.unsplash.com/... o sube una foto local"
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
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
                    onChange={handleMemberPhotoFileChange}
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ingresa un enlace de imagen o presiona "Subir foto" para cargar
                un archivo desde tu dispositivo.
              </p>
              {formPhoto && (
                <div className="mt-3 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={formPhoto}
                      alt="Vista previa"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-white flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs text-slate-700 font-semibold block">
                        Vista previa de la imagen de perfil
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                        {formPhoto.startsWith("data:")
                          ? "Imagen cargada localmente"
                          : formPhoto}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormPhoto("")}
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
                {editingMember
                  ? "Guardar Cambios de Colaborador"
                  : "Registrar Colaborador"}
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
      {filteredMembers.map((m) => (
        <div
          key={m.email}
          className={`bg-white rounded-xl border p-5 transition-all ${
            m.status === "inactivo"
              ? "opacity-60 border-slate-200 bg-slate-50/50"
              : "border-slate-200 hover:border-navy-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-navy-800 flex-shrink-0 bg-slate-100">
              {m.photo ? (
                <img
                  src={m.photo}
                  alt={m.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-navy-900 flex items-center justify-center text-celeste-400 font-bold text-xs">
                  {m.initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy-900 text-sm leading-tight">
                    {m.name}
                  </p>
                  {m.position && (
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${getPositionBadgeStyle(m.position)}`}
                    >
                      {m.position}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLOR[m.role]}`}
                >
                  {ROLE_LABEL[m.role]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{m.org}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {m.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    m.status === "activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {m.status === "activo"
                    ? "Activo (en web)"
                    : "Inactivo (oculto)"}
                </span>
                <span className="text-[10px] text-slate-400">
                  Desde {m.joined}
                </span>
              </div>
            </div>
          </div>

          {canAdmin && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs">
              <button
                onClick={() => openEditMember(m)}
                className="text-navy-600 hover:text-navy-900 font-semibold transition-colors cursor-pointer"
              >
                Editar
              </button>
              <span className="text-slate-200">·</span>
              <button
                onClick={() => handleToggleRole(m.email)}
                className="text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
              >
                Cambiar rol
              </button>
              <span className="text-slate-200">·</span>
              <button
                onClick={() => handleToggleMemberStatus(m.email)}
                className={`${
                  m.status === "activo"
                    ? "text-amber-600 hover:text-amber-800"
                    : "text-green-600 hover:text-green-800"
                } font-medium transition-colors cursor-pointer`}
              >
                {m.status === "activo" ? "Desactivar" : "Activar"}
              </button>
              <span className="text-slate-200">·</span>
              <button
                onClick={() => handleDeleteMember(m.email)}
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

export default MembersListSubtab
