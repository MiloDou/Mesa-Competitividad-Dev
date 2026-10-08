// Votaciones ficticias de presentación. Cada sesión parte de este estado y de estos conteos base.
export const votings = [
  {
    id: 101, status: "open", closes_at: "2026-10-30T23:59:00Z", options: ["A favor", "En contra", "Abstención"],
    title: "Aprobación del Plan de conectividad regional, fase 1",
    summary: "Se somete a votación la aprobación de la fase 1 del Plan de conectividad regional, conforme al acuerdo ACU-13-01.",
    background: "El informe técnico DOC-2026-029 propone intervenir tres corredores prioritarios en 18 meses mediante coinversión con operadores. La propuesta fue presentada en la sesión ordinaria del 18 de septiembre de 2026.",
  },
  {
    id: 102, status: "open", closes_at: "2026-11-05T23:59:00Z", options: ["A favor", "En contra"],
    title: "Calendario de sesiones ordinarias 2027",
    summary: "Propuesta de doce sesiones ordinarias mensuales para 2027, el último jueves de cada mes.",
    background: "Integrada por la Secretaría Técnica conforme al acuerdo ACU-13-02.",
  },
  {
    id: 103, status: "open", closes_at: "2026-11-12T23:59:00Z", options: ["A favor", "En contra", "Abstención"],
    title: "Lineamientos de la segunda etapa del Programa de talento local",
    summary: "Aprobación de los criterios de selección y metas descritos en el documento DOC-2026-032.",
    background: "La primera convocatoria concluyó en septiembre. La segunda etapa propone 300 participantes en al menos cinco municipios.",
  },
  {
    id: 104, status: "closed", closes_at: "2026-09-30T23:59:00Z", options: ["A favor", "En contra", "Abstención"],
    title: "Informe trimestral de iniciativas, tercer trimestre",
    summary: "Aprobación del informe trimestral presentado en la sesión ordinaria de septiembre.",
    background: "Votación cerrada el 30 de septiembre de 2026. Los conteos se publicaron el 1 de octubre.",
  },
];

export const seedCounts = {
  101: { "A favor": 9, "En contra": 3, "Abstención": 1 },
  102: { "A favor": 11, "En contra": 4 },
  103: { "A favor": 6, "En contra": 2, "Abstención": 3 },
  104: { "A favor": 14, "En contra": 3, "Abstención": 2 },
};
