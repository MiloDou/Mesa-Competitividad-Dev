export type Role = "comision" | "editor" | "lector";
export type Tab = "overview" | "projects" | "meetings" | "minutes" | "proposals" | "site" | "members" | "settings";

export type SectionType = "hero" | "about" | "timeline" | "news" | "event" | "projects" | "documents" | "contact" | "cta" | "stats";

export interface SiteSection {
  id: string;
  type: SectionType;
  visible: boolean;
  data: Record<string, string>;
}

export interface Project {
  id: string;
  title: string;
  cat: string;
  status: string;
  pct: number;
  lead: string;
  budget: string;
  updated: string;
  visibility: "public" | "private";
  desc?: string;
}

export interface AdminProposal {
  id: string;
  title: string;
  desc: string;
  category: string;
  deadline: string;
  status: "activa" | "cerrada" | "borrador";
  favor: number;
  contra: number;
  abstencion: number;
  total: number;
  created: string;
}

// Alias for backward compatibility within admin views
export type Proposal = AdminProposal;

export interface AdminMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  loc: string;
  n: number;
  status: string;
  file: string | null;
}

// Alias for backward compatibility within admin views
export type Meeting = AdminMeeting;

export interface Member {
  name: string;
  email: string;
  role: Role;
  org: string;
  status: string;
  initials: string;
  joined: string;
}
