import type { DocumentItem, Initiative, Meeting, Notice, Proposal } from "./types";

// Datos sintéticos para revisar la interfaz. No proceden de una API.
export const meetings: Meeting[] = [
  {
    id: "REU-DEMO-01", title: "Sesión ordinaria", date: "25 oct 2026",
    time: "09:00", place: "Sede de la Mesa", mode: "Presencial",
    agenda: ["Revisión del acta anterior", "Avance de iniciativas", "Propuestas abiertas"],
  },
  {
    id: "REU-DEMO-02", title: "Mesa de infraestructura", date: "02 nov 2026",
    time: "14:00", place: "Enlace por confirmar", mode: "Virtual",
    agenda: ["Seguimiento de proyectos", "Acuerdos y próximos pasos"],
  },
];

export const proposals: Proposal[] = [
  {
    id: "VOT-DEMO-01", title: "Plan operativo 2027",
    summary: "Propuesta de ejemplo para revisar el recorrido de votación.",
    deadline: "30 oct 2026", status: "abierta",
  },
  {
    id: "VOT-DEMO-02", title: "Reglamento de sesiones",
    summary: "Propuesta cerrada de ejemplo para mostrar el estado de resultados.",
    deadline: "15 sep 2026", status: "cerrada",
  },
];

export const notices: Notice[] = [
  { id: "AV-DEMO-01", kind: "Reunión", title: "Nueva sesión programada", detail: "Consulta fecha, lugar y agenda.", body: "Se agregó una sesión de ejemplo a la agenda de la Mesa. Este aviso ilustra cómo se consultaría una convocatoria; no confirma una reunión real." },
  { id: "AV-DEMO-02", kind: "Propuesta", title: "Propuesta disponible", detail: "Revisa el contenido antes del cierre.", body: "Hay una propuesta de demostración disponible para explorar la interfaz. Este aviso no procede de un sistema de notificaciones ni acredita una votación real." },
];

export const initiatives: Initiative[] = [
  {
    id: "INI-DEMO-01", area: "Desarrollo territorial", title: "Conectividad regional",
    summary: "Ejemplo de iniciativa para explorar la consulta móvil.",
    description: "Ficha ilustrativa de una posible iniciativa de conectividad entre municipios. El nombre y la descripción son ficticios; no representan un proyecto aprobado por la Mesa.",
  },
  {
    id: "INI-DEMO-02", area: "Formación", title: "Talento para la región",
    summary: "Ejemplo de seguimiento a oportunidades de formación.",
    description: "Ficha ilustrativa sobre formación de talento local. Los avances y documentos reales deberán provenir de la API cuando el equipo defina su visibilidad.",
  },
];

export const documents: DocumentItem[] = [
  { id: "DOC-DEMO-01", kind: "Acta", title: "Sesión ordinaria", detail: "Referencia de ejemplo · archivo aún no disponible", preview: "Esta ficha muestra cómo se identificaría un acta de reunión. El contenido y el archivo PDF reales deberán recibirse desde el servidor según los permisos acordados." },
  { id: "DOC-DEMO-02", kind: "Informe", title: "Avance de iniciativas", detail: "Referencia de ejemplo · archivo aún no disponible", preview: "Esta ficha muestra cómo se consultaría un informe asociado a iniciativas. El contenido es ilustrativo y no representa avances oficiales de la Mesa." },
];
