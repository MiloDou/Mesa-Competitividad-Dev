export interface RegForm {
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string;
  organizacion: string;
  sector: string;
  modalidad: string;
  comentarios: string;
}

export interface DirectivaMember {
  name: string;
  role: string;
  org: string;
  initials: string;
  photo: string;
}

export interface PublicProject {
  id: string;
  title: string;
  cat: string;
  status: string;
  pct: number;
  lead: string;
  budget: string;
  date: string;
  color: string;
}

export interface DocItem {
  abbr: string;
  title: string;
  count: string;
  tag: string;
  color: string;
  abbr_color: string;
}

export type PublicDoc = DocItem;

export interface AgendaActivity {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  time: string;
  location: string;
  modality: "Presencial" | "Virtual" | "Híbrida";
  description: string;
  agendaTopics?: string[];
  organizer?: string;
  status?: "programada" | "en_curso" | "finalizada";
}

export interface SummitSpeaker {
  id: string;
  name: string;
  role: string;
  org: string;
  photo: string;
  talkTitle: string;
  talkTime: string;
  talkDate: string;
  day: 1 | 2;
  room: string;
  category: string;
  summary: string;
  bio: string;
  topics: string[];
}

