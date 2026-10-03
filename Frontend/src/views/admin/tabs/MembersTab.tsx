import React, { useState } from "react";
import { Member, Role } from "../../../types/admin";
import { MEMBERS, ROLE_COLOR, ROLE_LABEL } from "../../../data/admin";
import { PlusIcon, PencilIcon, TrashIcon } from "../../../components/icons/AdminIcons";
import { CustomSelect } from "../../../components/ui/CustomSelect";

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
  const [membersList, setMembersList] = useState<Member[]>(MEMBERS);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [view, setView] = useState<"list" | "form">("list");

  // Form states for Add / Edit
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formRole, setFormRole] = useState<Role>("editor");
  const [formPhoto, setFormPhoto] = useState("");

  const filtered = membersList.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.org.toLowerCase().includes(search.toLowerCase())
  );

  function handleToggleStatus(email: string) {
    setMembersList(prev =>
      prev.map(m => (m.email === email ? { ...m, status: m.status === "activo" ? "inactivo" : "activo" } : m))
    );
  }

  function handleToggleRole(email: string) {
    setMembersList(prev =>
      prev.map(m => (m.email === email ? { ...m, role: m.role === "comision" ? "editor" : "comision" } : m))
    );
  }

  function openAddModal() {
    setEditingMember(null);
    setFormName("");
    setFormEmail("");
    setFormOrg("");
    setFormRole("editor");
    setFormPhoto("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
    setView("form");
  }

  function openEditModal(m: Member) {
    setEditingMember(m);
    setFormName(m.name);
    setFormEmail(m.email);
    setFormOrg(m.org);
    setFormRole(m.role);
    setFormPhoto(m.photo || "");
    setView("form");
  }

  function handleSaveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formPhoto.trim()) return;

    if (editingMember) {
      setMembersList(prev =>
        prev.map(m =>
          m.email === editingMember.email
            ? { ...m, name: formName, email: formEmail, org: formOrg, role: formRole, photo: formPhoto }
            : m
        )
      );
    } else {
      const initials = formName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "MB";
      const newMember: Member = {
        name: formName,
        email: formEmail,
        org: formOrg,
        role: formRole,
        status: "activo",
        initials,
        joined: "Hoy",
        photo: formPhoto,
      };
      setMembersList([newMember, ...membersList]);
    }
    setView("list");
  }

  if (view === "form") {
    return (
      <div className="space-y-4 animate-fadeup max-w-2xl">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Miembros
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="font-semibold text-navy-900 text-lg">
              {editingMember ? "Editar Registro de Miembro" : "Agregar Nuevo Miembro"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete la información del representante institucional
            </p>
          </div>
          <form onSubmit={handleSaveMember} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombre Completo *</label>
              <input
                required
                type="text"
                className="input text-sm"
                placeholder="Ej. Ing. Juan Pérez"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Correo Electrónico *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rol *</label>
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Organización / Entidad *</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="Ej. Cámara de Comercio de Quetzaltenango"
                value={formOrg}
                onChange={(e) => setFormOrg(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fotografía de Perfil (URL OBLIGATORIA) *
              </label>
              <input
                required
                type="url"
                className="input text-sm"
                placeholder="https://images.unsplash.com/..."
                value={formPhoto}
                onChange={(e) => setFormPhoto(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1">Obligatorio para presentar a los miembros en la web pública.</p>
              {formPhoto && (
                <div className="mt-3 flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <img src={formPhoto} alt="Vista previa" className="w-12 h-12 rounded-full object-cover border" />
                  <span className="text-xs text-slate-600 font-medium">Vista previa de la imagen de perfil</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-sm"
              >
                {editingMember ? "Guardar Cambios de Miembro" : "Registrar Miembro"}
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-5 py-3 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
          <button
            onClick={openAddModal}
            className="ml-auto flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Agregar Miembro
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <div
            key={m.email}
            className={`bg-white rounded-xl border p-5 transition-all ${
              m.status === "inactivo" ? "opacity-50 border-slate-200" : "border-slate-200 hover:border-navy-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Photo - mandatory display */}
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-navy-800 flex-shrink-0 bg-slate-100">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-navy-900 flex items-center justify-center text-celeste-400 font-bold text-xs">
                    {m.initials}
                  </div>
                )}
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
                <button onClick={() => openEditModal(m)} className="text-navy-600 hover:text-navy-900 font-semibold transition-colors">
                  Editar
                </button>
                <span className="text-slate-200">·</span>
                <button onClick={() => handleToggleRole(m.email)} className="text-slate-500 hover:text-slate-800 font-medium transition-colors">
                  Cambiar rol
                </button>
                <span className="text-slate-200">·</span>
                <button
                  onClick={() => handleToggleStatus(m.email)}
                  className={`${m.status === "activo" ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"} font-medium transition-colors`}
                >
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
