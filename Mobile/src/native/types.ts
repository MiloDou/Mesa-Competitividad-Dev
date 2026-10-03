export type Screen =
  | "login" | "home" | "meetings" | "meeting-detail"
  | "votes" | "vote-detail" | "vote-confirm" | "vote-preview" | "vote-done"
  | "results" | "notifications" | "notice-detail" | "documents" | "document-detail" | "profile"
  | "initiatives" | "initiative-detail";

export type DemoListMode = "content" | "loading" | "empty" | "error";

export type VoteChoice = "favor" | "contra" | "abstencion";

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  place: string;
  mode: string;
  agenda: string[];
}

export interface Proposal {
  id: string;
  title: string;
  summary: string;
  deadline: string;
  status: "abierta" | "cerrada";
}

export interface Notice {
  id: string;
  kind: string;
  title: string;
  detail: string;
  body: string;
}

export interface Initiative {
  id: string;
  area: string;
  title: string;
  summary: string;
  description: string;
}

export interface DocumentItem {
  id: string;
  kind: string;
  title: string;
  detail: string;
  preview: string;
}
