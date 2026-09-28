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
