import type { DocumentItem, Initiative, Meeting, Notice } from "./types";

// Contenido ficticio de presentación: no procede de una API ni de acuerdos reales de la Mesa.
// Las votaciones se consultan al servidor (`src/api/votings.ts`) o, en modo demostración, a `src/demo/api.ts`.
export const meetings: Meeting[] = [
  {
    id: "REU-2026-14", title: "Sesión ordinaria de octubre", date: "25 oct 2026", time: "09:00 – 11:30",
    place: "Sala de juntas, sede de la Mesa", mode: "Presencial", status: "Convocada",
    convener: "Secretaría Técnica", documents: ["DOC-2026-031", "DOC-2026-029"],
    agenda: [
      "Verificación de asistencia y quórum",
      "Lectura y aprobación del acta de la sesión del 18 de septiembre",
      "Informe de avance del Plan de conectividad regional",
      "Presentación de la propuesta de calendario de sesiones 2027",
      "Asuntos generales",
    ],
  },
  {
    id: "REU-2026-15", title: "Comisión de infraestructura y logística", date: "06 nov 2026", time: "14:00 – 15:30",
    place: "Videoconferencia (enlace enviado por la Secretaría Técnica)", mode: "Virtual", status: "Reprogramada",
    convener: "Coordinación de la Comisión", note: "Reprogramada del 02 nov 2026 por coincidencia con el periodo de cierre presupuestal.",
    documents: ["DOC-2026-030"],
    agenda: ["Seguimiento a la cartera de proyectos de infraestructura", "Revisión de indicadores logísticos del tercer trimestre", "Acuerdos y responsables"],
  },
  {
    id: "REU-2026-16", title: "Sesión extraordinaria: Programa de talento local", date: "20 nov 2026", time: "10:00 – 11:00",
    place: "Modalidad mixta: sala de juntas y videoconferencia", mode: "Mixta", status: "Convocada",
    convener: "Presidencia de la Mesa", documents: ["DOC-2026-032"],
    agenda: ["Presentación de resultados de la convocatoria de formación", "Definición de la segunda etapa del programa"],
  },
  {
    id: "REU-2026-13", title: "Sesión ordinaria de septiembre", date: "18 sep 2026", time: "09:00 – 11:15",
    place: "Sala de juntas, sede de la Mesa", mode: "Presencial", status: "Realizada",
    convener: "Secretaría Técnica", documents: ["DOC-2026-028"],
    agenda: ["Verificación de asistencia y quórum", "Seguimiento de acuerdos de agosto", "Informe trimestral de iniciativas", "Asuntos generales"],
  },
];

export const notices: Notice[] = [
  {
    id: "AV-2026-41", kind: "Reunión", date: "07 oct 2026", title: "Convocatoria: sesión ordinaria de octubre",
    detail: "25 oct 2026 · 09:00 · Presencial",
    body: "La Secretaría Técnica convoca a las y los miembros a la sesión ordinaria del 25 de octubre de 2026, a las 09:00, en la sala de juntas de la sede. El orden del día y los documentos de apoyo están disponibles en la ficha de la reunión.",
    target: { kind: "meeting", id: "REU-2026-14" },
  },
  {
    id: "AV-2026-40", kind: "Votación", date: "06 oct 2026", title: "Votación abierta: Plan de conectividad regional",
    detail: "Cierra el 30 oct 2026 a las 23:59",
    body: "Se abrió la votación sobre la aprobación del Plan de conectividad regional, fase 1. Revisa la propuesta y sus antecedentes antes de emitir tu voto. Cada miembro puede votar una sola vez y el voto no puede modificarse.",
    target: { kind: "votes" },
  },
  {
    id: "AV-2026-39", kind: "Reunión", date: "03 oct 2026", title: "Reprogramación: Comisión de infraestructura",
    detail: "Nueva fecha: 06 nov 2026 · 14:00",
    body: "La sesión de la Comisión de infraestructura y logística prevista para el 2 de noviembre se reprograma al 6 de noviembre de 2026, a las 14:00, en modalidad virtual.",
    target: { kind: "meeting", id: "REU-2026-15" },
  },
  {
    id: "AV-2026-37", kind: "Resultados", date: "01 oct 2026", title: "Resultados publicados: Programa de talento local",
    detail: "Votación cerrada el 30 sep 2026",
    body: "Se publicaron los conteos de la votación sobre el Programa de talento local. Los resultados pueden consultarse en la sección Votaciones.",
    target: { kind: "votes" },
  },
];

export const initiatives: Initiative[] = [
  {
    id: "INI-2026-03", area: "Desarrollo territorial", title: "Plan de conectividad regional", status: "En evaluación · 35 %",
    summary: "Ampliación de la cobertura de conectividad entre cabeceras municipales.",
    description: "Iniciativa orientada a reducir la brecha de conectividad en municipios con menor cobertura, mediante un diagnóstico técnico, la priorización de corredores y un esquema de inversión mixta. La fase 1 se encuentra en votación para su aprobación.",
  },
  {
    id: "INI-2026-02", area: "Capital humano", title: "Programa de talento local", status: "En ejecución · 60 %",
    summary: "Formación técnica vinculada a la demanda de las empresas de la región.",
    description: "Programa de formación en competencias técnicas y digitales, en coordinación con instituciones educativas y el sector productivo. La primera convocatoria concluyó y la segunda etapa se definirá en la sesión extraordinaria de noviembre.",
  },
  {
    id: "INI-2026-01", area: "Infraestructura", title: "Corredor logístico regional", status: "Seguimiento · 80 %",
    summary: "Mejora de tiempos y costos de traslado de mercancías.",
    description: "Iniciativa de seguimiento a los proyectos de infraestructura logística de la región, con indicadores trimestrales de tiempos de traslado, costos y ocupación de patios.",
  },
];

export const documents: DocumentItem[] = [
  {
    id: "DOC-2026-028", kind: "Acta", title: "Acta de la sesión ordinaria de septiembre", date: "18 sep 2026", pages: 4, access: "Miembros",
    detail: "Acta · 18 sep 2026 · Pendiente de aprobación",
    preview: "Registro de asistencia, acuerdos y compromisos de la sesión ordinaria del 18 de septiembre de 2026.",
    sections: [
      { heading: "1. Asistencia y quórum", body: "Se registró la asistencia de 19 de 23 miembros con derecho a voto, por lo que se declaró la existencia de quórum y se instaló válidamente la sesión a las 09:10." },
      { heading: "2. Seguimiento de acuerdos", body: "La Secretaría Técnica informó que, de los seis acuerdos de la sesión de agosto, cuatro se encuentran concluidos y dos en proceso, con fecha compromiso en octubre." },
      { heading: "3. Informe trimestral de iniciativas", body: "Se presentó el avance de las tres iniciativas vigentes. Se solicitó a la coordinación del Plan de conectividad regional integrar la propuesta de fase 1 para someterla a votación." },
      { heading: "4. Acuerdos", body: "ACU-13-01: Someter a votación la fase 1 del Plan de conectividad regional. ACU-13-02: Integrar la propuesta de calendario de sesiones 2027 para la sesión de octubre." },
      { heading: "5. Cierre", body: "Sin más asuntos que tratar, se dio por concluida la sesión a las 11:15." },
    ],
  },
  {
    id: "DOC-2026-031", kind: "Orden del día", title: "Orden del día · sesión ordinaria de octubre", date: "07 oct 2026", pages: 1, access: "Miembros",
    detail: "Orden del día · 25 oct 2026",
    preview: "Temas a tratar en la sesión ordinaria del 25 de octubre de 2026.",
    sections: [
      { heading: "Convocatoria", body: "Sesión ordinaria, 25 de octubre de 2026, 09:00, sala de juntas de la sede. Convoca: Secretaría Técnica." },
      { heading: "Temas", body: "1. Verificación de asistencia y quórum. 2. Lectura y aprobación del acta del 18 de septiembre. 3. Informe de avance del Plan de conectividad regional. 4. Propuesta de calendario de sesiones 2027. 5. Asuntos generales." },
    ],
  },
  {
    id: "DOC-2026-029", kind: "Informe", title: "Informe técnico · Plan de conectividad regional, fase 1", date: "29 sep 2026", pages: 12, access: "Miembros",
    detail: "Informe · 29 sep 2026 · 12 páginas",
    preview: "Diagnóstico, alcance, presupuesto estimado y cronograma de la fase 1.",
    sections: [
      { heading: "Resumen ejecutivo", body: "La fase 1 propone intervenir tres corredores prioritarios que concentran el 42 % de la población sin cobertura estable, con un horizonte de ejecución de 18 meses." },
      { heading: "Alcance", body: "Incluye estudio de factibilidad, priorización de puntos de acceso público y un esquema de coinversión con operadores. No incluye obra civil mayor." },
      { heading: "Cronograma", body: "Trimestre 1: factibilidad. Trimestres 2 y 3: licitación y contratación. Trimestres 4 a 6: implementación y medición de resultados." },
    ],
  },
  {
    id: "DOC-2026-030", kind: "Informe", title: "Indicadores logísticos · tercer trimestre 2026", date: "02 oct 2026", pages: 6, access: "Miembros",
    detail: "Informe · 02 oct 2026 · 6 páginas",
    preview: "Tiempos de traslado, costos y ocupación del corredor logístico regional.",
    sections: [
      { heading: "Resultados", body: "El tiempo promedio de traslado disminuyó 7 % respecto al trimestre anterior; el costo por tonelada se mantuvo estable y la ocupación de patios alcanzó 81 %." },
      { heading: "Recomendaciones", body: "Priorizar el mantenimiento del tramo norte y homologar el registro de tiempos entre operadores." },
    ],
  },
  {
    id: "DOC-2026-032", kind: "Lineamientos", title: "Lineamientos · segunda etapa del Programa de talento local", date: "05 oct 2026", pages: 3, access: "Miembros",
    detail: "Lineamientos · 05 oct 2026 · Borrador",
    preview: "Propuesta de criterios de selección y metas para la segunda etapa.",
    sections: [
      { heading: "Objetivo", body: "Ampliar la formación técnica a 300 participantes, con prioridad en perfiles digitales y de mantenimiento industrial." },
      { heading: "Criterios", body: "Vinculación con empresas de la región, cobertura en al menos cinco municipios y seguimiento de la inserción laboral a seis meses." },
    ],
  },
];
