import React, { useState, useEffect } from "react";
import { Member, Role, ParticipatingEntity } from "../../../types/admin";
import { MEMBERS, DEFAULT_ENTITIES, ROLE_COLOR, ROLE_LABEL } from "../../../data/admin";
import { PlusIcon } from "../../../components/icons/AdminIcons";
import { CustomSelect } from "../../../components/ui/CustomSelect";

interface MembersTabProps {
  canAdmin: boolean;
  search: string;
  setSearch: (s: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Sector Público": "bg-teal-100 text-teal-800",
  "Academia": "bg-rose-100 text-rose-800",
  "Sector Social": "bg-emerald-100 text-emerald-800",
  "Sector Productivo": "bg-amber-100 text-amber-800",
  "Sector Investigativo": "bg-indigo-100 text-indigo-800",
};

export const getPositionBadgeStyle = (pos?: string) => {
  const p = (pos || "").toLowerCase();
  if (p.includes("presi")) {
    return "bg-blue-100 text-blue-800 border border-blue-300";
  }
  if (p.includes("vocal")) {
    return "bg-rose-100 text-rose-800 border border-rose-300";
  }
  return "bg-amber-100 text-amber-800 border border-amber-300";
};

const DEFAULT_POSITIONS = [
  "Presidente",
  "Vicepresidente",
  "Secretario",
  "Tesorero",
  "Vocal I",
  "Vocal II",
  "Vocal III",
];

export const MembersTab: React.FC<MembersTabProps> = ({
  canAdmin,
  search,
  setSearch,
}) => {
  const [subTab, setSubTab] = useState<"members" | "entities">("entities");

  // --- MIEMBROS STATE ---
  const [membersList, setMembersList] = useState<Member[]>(() => {
    if (typeof window === "undefined") return MEMBERS;
    const saved = localStorage.getItem("mesa_directiva_miembros");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MEMBERS;
  });

  const [customPositions, setCustomPositions] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("mesa_custom_positions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allPositions = Array.from(new Set([...DEFAULT_POSITIONS, ...customPositions]));

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberView, setMemberView] = useState<"list" | "form">("list");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formRole, setFormRole] = useState<Role>("editor");
  const [formPosition, setFormPosition] = useState<string>("Presidente");
  const [isCustomPosition, setIsCustomPosition] = useState<boolean>(false);
  const [customPositionInput, setCustomPositionInput] = useState<string>("");
  const [formPhoto, setFormPhoto] = useState("");

  const updateMembersState = (list: Member[]) => {
    setMembersList(list);
    if (typeof window !== "undefined") {
      localStorage.setItem("mesa_directiva_miembros", JSON.stringify(list));
      window.dispatchEvent(new Event("mesa_miembros_updated"));
    }
  };

  // --- ENTIDADES STATE ---
  const [entitiesList, setEntitiesList] = useState<ParticipatingEntity[]>(() => {
    if (typeof window === "undefined") return DEFAULT_ENTITIES;
    const saved = localStorage.getItem("mesa_conformados_entidades");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_ENTITIES;
  });

  const [editingEntity, setEditingEntity] = useState<ParticipatingEntity | null>(null);
  const [entityView, setEntityView] = useState<"list" | "form">("list");
  const [entityName, setEntityName] = useState("");
  const [entityCategory, setEntityCategory] = useState<ParticipatingEntity["category"]>("Sector Público");
  const [entityPhoto, setEntityPhoto] = useState("");
  const [entityStatus, setEntityStatus] = useState<"activo" | "inactivo">("activo");

  const updateEntitiesState = (list: ParticipatingEntity[]) => {
    setEntitiesList(list);
    if (typeof window !== "undefined") {
      localStorage.setItem("mesa_conformados_entidades", JSON.stringify(list));
      window.dispatchEvent(new Event("mesa_entidades_updated"));
    }
  };

  // Sincronización bidireccional de eventos
  useEffect(() => {
    const handleSync = () => {
      const savedEnt = localStorage.getItem("mesa_conformados_entidades");
      if (savedEnt) {
        try {
          const parsed = JSON.parse(savedEnt);
          if (Array.isArray(parsed)) setEntitiesList(parsed);
        } catch (e) {}
      }
      const savedMemb = localStorage.getItem("mesa_directiva_miembros");
      if (savedMemb) {
        try {
          const parsed = JSON.parse(savedMemb);
          if (Array.isArray(parsed)) setMembersList(parsed);
        } catch (e) {}
      }
    };
    window.addEventListener("mesa_entidades_updated", handleSync);
    window.addEventListener("mesa_miembros_updated", handleSync);
    return () => {
      window.removeEventListener("mesa_entidades_updated", handleSync);
      window.removeEventListener("mesa_miembros_updated", handleSync);
    };
  }, []);

  const handleEntityPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setEntityPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleMemberPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFormPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // --- ACCIONES MIEMBROS ---
  function handleToggleMemberStatus(email: string) {
    const next = membersList.map((m) =>
      m.email === email ? { ...m, status: m.status === "activo" ? "inactivo" : "activo" } : m
    );
    updateMembersState(next);
  }

  function handleToggleRole(email: string) {
    const next = membersList.map((m) =>
      m.email === email ? { ...m, role: m.role === "comision" ? ("editor" as Role) : ("comision" as Role) } : m
    );
    updateMembersState(next);
  }

  function handleDeleteMember(email: string) {
    if (window.confirm("¿Seguro que deseas eliminar este miembro de la Junta Directiva?")) {
      const next = membersList.filter((m) => m.email !== email);
      updateMembersState(next);
    }
  }

  function openAddMember() {
    setEditingMember(null);
    setFormName("");
    setFormEmail("");
    setFormOrg("");
    setFormRole("editor");
    setFormPosition("Presidente");
    setIsCustomPosition(false);
    setCustomPositionInput("");
    setFormPhoto("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
    setMemberView("form");
  }

  function openEditMember(m: Member) {
    setEditingMember(m);
    setFormName(m.name);
    setFormEmail(m.email);
    setFormOrg(m.org);
    setFormRole(m.role);
    const pos = m.position || "Presidente";
    if (allPositions.includes(pos)) {
      setFormPosition(pos);
      setIsCustomPosition(false);
      setCustomPositionInput("");
    } else {
      setFormPosition("otro");
      setIsCustomPosition(true);
      setCustomPositionInput(pos);
    }
    setFormPhoto(m.photo || "");
    setMemberView("form");
  }

  function handleSaveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formPhoto.trim()) return;

    let finalPosition = formPosition;
    if (isCustomPosition || formPosition === "otro") {
      const trimmed = customPositionInput.trim();
      if (trimmed) {
        finalPosition = trimmed;
        if (!allPositions.includes(trimmed)) {
          const updated = [...customPositions, trimmed];
          setCustomPositions(updated);
          if (typeof window !== "undefined") {
            localStorage.setItem("mesa_custom_positions", JSON.stringify(updated));
          }
        }
      } else {
        finalPosition = "Miembro";
      }
    }

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
          : m
      );
      updateMembersState(next);
    } else {
      const initials =
        formName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "MB";
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
      };
      updateMembersState([newMember, ...membersList]);
    }
    setMemberView("list");
  }

  // --- ACCIONES ENTIDADES ---
  function handleToggleEntityStatus(id: string) {
    const next = entitiesList.map((e) =>
      e.id === id ? { ...e, status: e.status === "activo" ? ("inactivo" as const) : ("activo" as const) } : e
    );
    updateEntitiesState(next);
  }

  function handleDeleteEntity(id: string) {
    if (window.confirm("¿Seguro que deseas eliminar esta entidad participante?")) {
      const next = entitiesList.filter((e) => e.id !== id);
      updateEntitiesState(next);
    }
  }

  function openAddEntity() {
    setEditingEntity(null);
    setEntityName("");
    setEntityCategory("Sector Público");
    setEntityPhoto("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop&auto=format");
    setEntityStatus("activo");
    setEntityView("form");
  }

  function openEditEntity(ent: ParticipatingEntity) {
    setEditingEntity(ent);
    setEntityName(ent.name);
    setEntityCategory(ent.category);
    setEntityPhoto(ent.photo || "");
    setEntityStatus(ent.status);
    setEntityView("form");
  }

  function handleSaveEntity(e: React.FormEvent) {
    e.preventDefault();
    if (!entityName.trim()) return;

    const initials =
      entityName
        .split(" ")
        .filter((w) => w.length > 2)
        .slice(0, 3)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || entityName.substring(0, 4).toUpperCase();

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
          : ent
      );
      updateEntitiesState(next);
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
      };
      updateEntitiesState([...entitiesList, newEntity]);
    }
    setEntityView("list");
  }

  // Filtrado de listas según búsqueda
  const filteredMembers = membersList.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.org.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEntities = entitiesList.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  // --- FORMULARIO MIEMBRO ---
  if (memberView === "form") {
    return (
      <div className="space-y-4 animate-fadeup max-w-2xl">
        <button
          onClick={() => setMemberView("list")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors cursor-pointer"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rol de Sistema *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Puesto en la Comisión / Mesa *</label>
                <CustomSelect
                  value={isCustomPosition ? "otro" : formPosition}
                  onChange={(val) => {
                    if (val === "otro") {
                      setIsCustomPosition(true);
                      setFormPosition("otro");
                    } else {
                      setIsCustomPosition(false);
                      setFormPosition(val);
                    }
                  }}
                  options={[
                    ...allPositions.map((p) => ({ value: p, label: p })),
                    { value: "otro", label: "+ Otro (Ingresar nuevo puesto...)" },
                  ]}
                />
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
            </div>

            {isCustomPosition && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 animate-fadeup">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Especificar Nuevo Puesto en la Comisión *
                </label>
                <input
                  required
                  type="text"
                  className="input text-sm"
                  placeholder="Ej. Coordinador de Cooperación, Secretario de Actas..."
                  value={customPositionInput}
                  onChange={(e) => setCustomPositionInput(e.target.value)}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Este nuevo puesto se guardará automáticamente en las opciones para futuros miembros.
                </p>
              </div>
            )}
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
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                Ingresa un enlace de imagen o presiona "Subir foto" para cargar un archivo desde tu dispositivo.
              </p>
              {formPhoto && (
                <div className="mt-3 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={formPhoto} alt="Vista previa" className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-white flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-slate-700 font-semibold block">Vista previa de la imagen de perfil</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                        {formPhoto.startsWith("data:") ? "Imagen cargada localmente" : formPhoto}
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
                {editingMember ? "Guardar Cambios de Miembro" : "Registrar Miembro"}
              </button>
              <button
                type="button"
                onClick={() => setMemberView("list")}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-5 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- FORMULARIO ENTIDAD ---
  if (entityView === "form") {
    return (
      <div className="space-y-4 animate-fadeup max-w-2xl">
        <button
          onClick={() => setEntityView("list")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Entidades
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="font-semibold text-navy-900 text-lg">
              {editingEntity ? "Editar Entidad Participante" : "Agregar Nueva Entidad Participante"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete la información de la institución aliada conformadora de la Mesa
            </p>
          </div>
          <form onSubmit={handleSaveEntity} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombre de la Entidad / Institución *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Área / Sector al que pertenece *</label>
                <CustomSelect
                  value={entityCategory}
                  onChange={(val) => setEntityCategory(val as ParticipatingEntity["category"])}
                  options={[
                    { value: "Sector Público", label: "Sector Público" },
                    { value: "Academia", label: "Academia" },
                    { value: "Sector Social", label: "Sector Social" },
                    { value: "Sector Productivo", label: "Sector Productivo" },
                    { value: "Sector Investigativo", label: "Sector Investigativo" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estado Inicial *</label>
                <CustomSelect
                  value={entityStatus}
                  onChange={(val) => setEntityStatus(val as "activo" | "inactivo")}
                  options={[
                    { value: "activo", label: "Activo (Visible en la web pública)" },
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
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                Puedes ingresar un enlace de imagen o presionar "Subir foto" para cargar un archivo desde tu dispositivo.
              </p>
              {entityPhoto && (
                <div className="mt-3 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                      <img src={entityPhoto} alt="Vista previa" className="w-full h-full object-contain object-center" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-slate-700 font-semibold block">Vista previa del logotipo / foto</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                        {entityPhoto.startsWith("data:") ? "Imagen cargada localmente" : entityPhoto}
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
                {editingEntity ? "Guardar Cambios de Entidad" : "Registrar Entidad"}
              </button>
              <button
                type="button"
                onClick={() => setEntityView("list")}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm px-5 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA LISTA PRINCIPAL (TABS INTERNOS: MIEMBROS Y ENTIDADES) ---
  return (
    <div className="space-y-5 animate-fadeup">
      {/* Barra de Navegación entre Miembros y Entidades */}
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
            Entidades Participantes ({entitiesList.filter((e) => e.status === "activo").length} activas de {entitiesList.length})
          </button>
          <button
            onClick={() => setSubTab("members")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "members"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Junta Directiva ({membersList.filter((m) => m.status === "activo").length} activos de {membersList.length})
          </button>
        </div>

        {/* Buscador y Botón de Agregar correspondiente */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
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
              className="input pl-9.5! pl-9 py-2 w-52 sm:w-60 text-sm"
              style={{ paddingLeft: "2.35rem" }}
              placeholder={subTab === "entities" ? "Buscar entidad o sector…" : "Buscar miembro…"}
            />
          </div>

          {canAdmin && (
            <button
              onClick={subTab === "entities" ? openAddEntity : openAddMember}
              className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              {subTab === "entities" ? "Agregar Entidad" : "Agregar Miembro"}
            </button>
          )}
        </div>
      </div>

      {/* RENDER DE ENTIDADES */}
      {subTab === "entities" && (
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
                {/* Logo / Imagen de la Entidad */}
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-gold-400/80 flex-shrink-0 bg-white p-1.5 flex items-center justify-center shadow-xs">
                  {ent.photo ? (
                    <img src={ent.photo} alt={ent.name} className="w-full h-full object-contain object-center" />
                  ) : (
                    <div className="w-full h-full bg-navy-900 rounded-lg flex items-center justify-center text-gold-400 font-bold text-xs">
                      {ent.initials || "ENT"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-navy-900 text-sm leading-tight">{ent.name}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        CATEGORY_COLORS[ent.category] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {ent.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Mesa Departamental de Competitividad</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        ent.status === "activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {ent.status === "activo" ? "Activo (en web)" : "Inactivo (oculto)"}
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
      )}

      {/* RENDER DE MIEMBROS */}
      {subTab === "members" && (
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
                {/* Photo */}
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
                    <div>
                      <p className="font-semibold text-navy-900 text-sm leading-tight">{m.name}</p>
                      {m.position && (
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${getPositionBadgeStyle(m.position)}`}>
                          {m.position}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLOR[m.role]}`}>
                      {ROLE_LABEL[m.role]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{m.org}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{m.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        m.status === "activo" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {m.status === "activo" ? "Activo (en web)" : "Inactivo (oculto)"}
                    </span>
                    <span className="text-[10px] text-slate-400">Desde {m.joined}</span>
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
                      m.status === "activo" ? "text-amber-600 hover:text-amber-800" : "text-green-600 hover:text-green-800"
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
      )}
    </div>
  );
};

export default MembersTab;
