export type Screen = "login" | "home" | "meetings" | "meeting-detail" | "vote-list" | "vote-cast" | "vote-done" | "notifications" | "profile" | "documents";

export interface Meeting {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  dateNum: string;
  dateMonth: string;
  time: string;
  loc: string;
  virtual: boolean;
  urgent: boolean;
  agenda: string[];
  targetDate?: string;
}

export type MeetingMobile = Meeting;

export interface Proposal {
  id: string;
  title: string;
  desc: string;
  category: string;
  deadline: string;
  favor: number;
  contra: number;
  abstencion: number;
  total: number;
}

export type ProposalMobile = Proposal;

export interface Notif {
  id: number;
  title: string;
  body: string;
  time: string;
  type: string;
  unread: boolean;
}

export type NotifMobile = Notif;
