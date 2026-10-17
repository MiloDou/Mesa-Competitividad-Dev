import React, { useEffect, useState } from "react";
import { Role, Tab, Project } from "../../types/admin";
import { PROJECTS } from "../../data/admin";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { OverviewTab } from "./tabs/OverviewTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { MeetingsTab } from "./tabs/MeetingsTab";
import { MinutesTab } from "./tabs/MinutesTab";
import { ProposalsTab } from "./tabs/ProposalsTab";
import { SiteEditorTab } from "./tabs/SiteEditorTab";
import { MembersTab } from "./tabs/MembersTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { MinuteModal } from "./modals/MinuteModal";
import { ProjectDrawer } from "./modals/ProjectDrawer";
import { NotificationPanel } from "./modals/NotificationPanel";
import { archiveProject, getProjects, updateProject } from "../../api/admin";

export default function AdminSystem({
  initialRole = "comision",
  onLogout,
}: {
  initialRole?: Role;
  onLogout?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [role] = useState<Role>(initialRole);
  const [collapsed, setCollapsed] = useState<boolean>(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [projectList, setProjectList] = useState<Project[]>(() => {
    const saved = localStorage.getItem("site_projects");
    return saved ? JSON.parse(saved) : PROJECTS;
  });
  const [projectsConnected, setProjectsConnected] = useState(false);

  const saveProjectsState = (action: React.SetStateAction<Project[]>) => {
    setProjectList((prev) => {
      const newList = typeof action === "function" ? action(prev) : action;
      localStorage.setItem("site_projects", JSON.stringify(newList));
      window.dispatchEvent(new Event("site_projects_updated"));
      return newList;
    });
  };

  const [vis, setVis] = useState<Record<string, "public" | "private">>(() =>
    Object.fromEntries(projectList.map((p) => [p.id, p.visibility || "public"]))
  );

  const handleSetVis = (id: string, newVisibility: "public" | "private") => {
    setVis((prev) => ({ ...prev, [id]: newVisibility }));
    saveProjectsState((prevList) =>
      prevList.map((p) =>
        p.id === id ? { ...p, visibility: newVisibility, updated: "Hoy" } : p
      )
    );
  };
  const [minuteOpen, setMinuteOpen] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);

  useEffect(() => {
    let active = true;
    getProjects().then((items) => {
      if (!active) return;
      setProjectList(items);
      setVis(Object.fromEntries(items.map((project) => [project.id, project.visibility])));
      setProjectsConnected(true);
    }).catch(() => {
      // Conserva la lista demostrativa existente cuando la API no está disponible.
    });
    return () => { active = false; };
  }, []);

  const [minutesList, setMinutesList] = useState([
    { id: "ACT-021", session: "Sesión Ordinaria No. 021", date: "18 Sep 2026", status: "pendiente", n: 0, file: null },
    { id: "ACT-022-BORRADOR", session: "Sesión Ordinaria No. 022 (Borrador)", date: "25 Sep 2026", status: "borrador", n: 0, file: null },
    { id: "ACT-020", session: "Sesión Ordinaria No. 020", date: "21 Ago 2026", status: "publicada", n: 16, file: "Acta-020.pdf" },
    { id: "ACT-019", session: "Comisión Especial de Infraestructura", date: "10 Ago 2026", status: "publicada", n: 11, file: "Acta-019.pdf" },
    { id: "ACT-018", session: "Sesión Ordinaria No. 018", date: "17 Jul 2026", status: "publicada", n: 14, file: "Acta-018.pdf" },
  ]);

  const pendingMinutesCount = minutesList.filter(
    (m) => m.status === "pendiente" || m.status === "borrador"
  ).length;

  const canEdit = role === "comision" || (role === "editor" && tab === "site");
  const canAdmin = role === "comision";
  const canManageProjects = role === "comision" || role === "editor";
  const canPublishProjects = role === "comision";
  const canManageDocuments = role === "comision" || role === "editor";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative" style={{ fontFamily: "var(--font-sans)" }}>
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        role={role}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pendingMinutesCount={pendingMinutesCount}
        onLogout={onLogout}
      />

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader
          tab={tab}
          role={role}
          showNotif={showNotif}
          setShowNotif={setShowNotif}
          hasUnread={hasUnreadNotif}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 pb-24 w-full max-w-full">
            {tab === "overview" && <OverviewTab role={role} setTab={setTab} projects={projectList} projectsConnected={projectsConnected} />}
            {tab === "projects" && (
              <ProjectsTab
                canEdit={canManageProjects}
                canPublish={canPublishProjects}
                apiConnected={projectsConnected}
                vis={vis}
                setVis={handleSetVis}
                onEdit={setEditProject}
                projectList={projectList}
                setProjectList={saveProjectsState}
              />
            )}
            {tab === "meetings" && <MeetingsTab canEdit={canEdit} newMeeting={newMeeting} setNewMeeting={setNewMeeting} openMinute={setMinuteOpen} />}
            {tab === "minutes" && <MinutesTab canEdit={canEdit} onOpen={setMinuteOpen} minutesList={minutesList} setMinutesList={setMinutesList} />}
            {tab === "documents" && <DocumentsTab canEdit={canManageDocuments} apiConnected={projectsConnected} projects={projectList} />}
            {tab === "proposals" && <ProposalsTab canEdit={canEdit} />}
            {tab === "site" && <SiteEditorTab canAdmin={canAdmin} />}
            {tab === "members" && <MembersTab canAdmin={canAdmin} search={memberSearch} setSearch={setMemberSearch} />}
            {tab === "settings" && <SettingsTab />}
          </div>
        </main>
      </div>

      {minuteOpen && <MinuteModal id={minuteOpen} onClose={() => setMinuteOpen(null)} />}
      {editProject && (
        <ProjectDrawer
          project={editProject}
          onClose={() => setEditProject(null)}
          canEdit={canManageProjects && projectsConnected}
          canPublish={role === "comision" && projectsConnected}
          apiConnected={projectsConnected}
          onSave={async (id, updatedFields) => {
            if (projectsConnected) {
              const savedProject = await updateProject(id, updatedFields);
              saveProjectsState((prevList) => prevList.map((project) => project.id === id ? savedProject : project));
              setVis((prev) => ({ ...prev, [id]: savedProject.visibility }));
              return;
            }
            saveProjectsState((prevList) => prevList.map((p) => p.id === id ? {
              ...p, title: updatedFields.title, desc: updatedFields.description, cat: updatedFields.sector,
              budget: updatedFields.budget || "Sin presupuesto registrado", lead: updatedFields.responsible_name || "Sin responsable asignado",
              status: ({ active: "activo", paused: "pausado", draft: "borrador", completed: "completado" } as const)[updatedFields.status],
              visibility: updatedFields.is_public ? "public" : "private", updated: "Hoy",
            } : p));
          }}
          onDelete={async (id) => {
            if (projectsConnected) await archiveProject(id);
            saveProjectsState((prevList) => prevList.filter((p) => p.id !== id));
          }}
        />
      )}

      {/* ── NOTIFICATION PANEL ───────────────────────────────────────────── */}
      {showNotif && (
        <NotificationPanel
          onClose={() => setShowNotif(false)}
          onClearUnread={() => setHasUnreadNotif(false)}
        />
      )}
    </div>
  );
}
