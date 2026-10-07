import { AgendaActivity } from "../types/public";

export const MOCK_AGENDA_ACTIVITIES: AgendaActivity[] = [
  {
    id: "ACT-001",
    title: "Mesa de Trabajo: Conectividad e Infraestructura Vial",
    subtitle: "Sesión Técnica No. 014",
    date: "14 Oct 2026",
    time: "09:00 AM – 11:30 AM",
    location: "Sala de Sesiones CUNOC / Virtual (Zoom)",
    modality: "Híbrida",
    organizer: "Comisión de Infraestructura y Transporte",
    description: "Reunión técnica para evaluar los avances del Corredor Logístico del Altiplano Occidental (PRY-001) y la coordinación interinstitucional con el Ministerio de Comunicaciones.",
    agendaTopics: [
      "Lectura y aprobación de la agenda anterior",
      "Informe trimestral de avance físico y financiero PRY-001",
      "Presentación del mapa de tramos prioritarios Xela-Salcajá",
      "Acuerdos y asignación de compromisos para Q4 2026",
    ],
    status: "programada",
  },
  {
    id: "ACT-002",
    title: "Conferencia Magistral: Innovación y Competitividad Territorial",
    subtitle: "Foro Pre-Summit 2026",
    date: "15 Oct 2026",
    time: "02:00 PM – 04:30 PM",
    location: "Centro de Convenciones Gran Karmel, Quetzaltenango",
    modality: "Presencial",
    organizer: "Mesa Departamental & AGEXPORT",
    description: "Jornada de conferencias con expertos internacionales para analizar modelos de desarrollo económico local y transformación digital en la región suroccidente.",
    agendaTopics: [
      "Palabras de apertura por la Presidencia de la Mesa",
      "Conferencia: Estrategias de Clústeres en América Latina",
      "Panel de discusión: Academia y Sector Privado",
      "Espacio de networking y cierre",
    ],
    status: "programada",
  },
  {
    id: "ACT-003",
    title: "Taller: Simplificación de Trámites Municipales para PyMEs",
    subtitle: "Mesa de Modernización",
    date: "22 Oct 2026",
    time: "10:00 AM – 12:00 PM",
    location: "Virtual — Plataforma Teams",
    modality: "Virtual",
    organizer: "Municipalidad de Quetzaltenango & MINECO",
    description: "Capacitación práctica dirigida a emprendedores y PYMES sobre la ventanilla única digital para licencias de construcción y permisos comerciales.",
    agendaTopics: [
      "Demostración de la plataforma digital de trámites (PRY-002)",
      "Resolución de dudas sobre requisitos legales",
      "Guía paso a paso para registro en línea",
    ],
    status: "programada",
  },
  {
    id: "ACT-004",
    title: "Sesión Plenaria Ordinaria: Presentación POA 2027",
    subtitle: "Asamblea General",
    date: "28 Oct 2026",
    time: "09:00 AM – 01:00 PM",
    location: "Auditorio Principal CUNOC, Quetzaltenango",
    modality: "Presencial",
    organizer: "Junta Directiva Mesa de Competitividad",
    description: "Sesión plenaria con representantes del sector público, privado y academia para la revisión y aprobación del Plan Operativo Anual (POA) 2027.",
    agendaTopics: [
      "Presentación del informe de gestión 2026",
      "Votación de la propuesta de POA y presupuesto 2027",
      "Ratificación de nuevas comisiones de trabajo",
    ],
    status: "programada",
  },
];

export interface FetchAgendaOptions {
  simulateError?: boolean;
  simulateEmpty?: boolean;
}

/**
 * Servicio para obtener la agenda de actividades.
 * Reutiliza los endpoints existentes o datos sintéticos con fallback para la API backend.
 */
export async function fetchAgendaActivities(options?: FetchAgendaOptions): Promise<AgendaActivity[]> {
  // Simular latencia de red de 400ms para experiencia realista
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (options?.simulateError) {
    throw new Error("No se pudo establecer conexión con el servicio de agenda.");
  }

  if (options?.simulateEmpty) {
    return [];
  }

  try {
    // Si existiera un endpoint backend configurado (ej. VITE_API_URL):
    // const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/agenda`);
    // if (!res.ok) throw new Error("Error en la respuesta de la API");
    // return await res.json();
    return MOCK_AGENDA_ACTIVITIES;
  } catch (err) {
    console.warn("API de agenda no disponible, usando datos locales:", err);
    return MOCK_AGENDA_ACTIVITIES;
  }
}
