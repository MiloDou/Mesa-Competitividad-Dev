import React, { useState } from "react";
import { Role, Tab, Project } from "../../types/admin";
import { PROJECTS } from "../../data/admin";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { OverviewTab } from "./tabs/OverviewTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { MeetingsTab } from "./tabs/MeetingsTab";
import { MinutesTab } from "./tabs/MinutesTab";
import { ProposalsTab } from "./tabs/ProposalsTab";
import { SiteEditorTab } from "./tabs/SiteEditorTab";
import { MembersTab } from "./tabs/MembersTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { MinuteModal } from "./modals/MinuteModal";
import { ProjectDrawer } from "./modals/ProjectDrawer";
import { NotificationPanel } from "./modals/NotificationPanel";

export default function AdminSystem() {
  const [tab, setTab] = useState<Tab>("overview");
  const [role, setRole] = useState<Role>("comision");
  const [collapsed, setCollapsed] = useState(false);
  const [vis, setVis] = useState<Record<string, "public" | "private">>(
    Object.fromEntries(PROJECTS.map((p) => [p.id, p.visibility]))
  );
  const [minuteOpen, setMinuteOpen] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [showNotif, setShowNotif] = useState(false);

  const canEdit = role !== "lector";
  const canAdmin = role === "comision";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        role={role}
        setRole={setRole}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader
          tab={tab}
          role={role}
          showNotif={showNotif}
          setShowNotif={setShowNotif}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 pb-24">
            {tab === "overview" && <OverviewTab role={role} setTab={setTab} />}
            {tab === "projects" && <ProjectsTab canEdit={canEdit} vis={vis} setVis={(id, v) => setVis({ ...vis, [id]: v })} onEdit={setEditProject} />}
            {tab === "meetings" && <MeetingsTab canEdit={canEdit} newMeeting={newMeeting} setNewMeeting={setNewMeeting} openMinute={setMinuteOpen} />}
            {tab === "minutes" && <MinutesTab canEdit={canEdit} onOpen={setMinuteOpen} />}
            {tab === "proposals" && <ProposalsTab canEdit={canEdit} />}
            {tab === "site" && canEdit && <SiteEditorTab canAdmin={canAdmin} />}
            {tab === "members" && <MembersTab canAdmin={canAdmin} search={memberSearch} setSearch={setMemberSearch} />}
            {tab === "settings" && <SettingsTab />}
          </div>
        </main>
      </div>

      {minuteOpen && <MinuteModal id={minuteOpen} onClose={() => setMinuteOpen(null)} />}
      {editProject && <ProjectDrawer project={editProject} onClose={() => setEditProject(null)} canEdit={canEdit} />}

      {/* ── NOTIFICATION PANEL ───────────────────────────────────────────── */}
      {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
    </div>
  );
}
