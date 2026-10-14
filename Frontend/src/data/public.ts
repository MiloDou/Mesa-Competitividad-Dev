import {
  PublicProject,
  DirectivaMember,
  DocItem,
  SummitSpeaker,
} from "../types/public"

export const ROLE_SHORT: Record<string, string> = {
  Colaborador: "COLAB",
  Presidente: "COLAB",
  Vicepresidenta: "COLAB",
  Secretario: "COLAB",
  Tesorera: "COLAB",
  "Vocal I": "COLAB",
  "Vocal II": "COLAB",
}

export const PUBLIC_PROJECTS: PublicProject[] = [
  {
    id: "PRY-001",
    title: "Corredor Logístico Altiplano Occidental",
    cat: "Infraestructura",
    status: "En Ejecución",
    pct: 68,
    lead: "Min. de Comunicaciones",
    budget: "Q 45.2M",
    date: "Sep 2026",
    color: "#1A4280",
    visibility: "public",
  },
  {
    id: "PRY-002",
    title: "Plataforma Digital de Trámites Municipales",
    cat: "Modernización",
    status: "En Ejecución",
    pct: 42,
    lead: "Municipalidad de Xela",
    budget: "Q 8.7M",
    date: "Ago 2026",
    color: "#1A4280",
    visibility: "public",
  },
  {
    id: "PRY-003",
    title: "Programa de Formación Técnica Artesanal",
    cat: "Desarrollo Humano",
    status: "Completado",
    pct: 100,
    lead: "INTECAP Regional",
    budget: "Q 3.1M",
    date: "Jul 2026",
    color: "#15803D",
    visibility: "public",
  },
  {
    id: "PRY-004",
    title: "Zona Económica Especial Quetzaltenango",
    cat: "Inversión",
    status: "Planificación",
    pct: 18,
    lead: "AGEXPORT",
    budget: "Q 120M",
    date: "Sep 2026",
    color: "#D97706",
    visibility: "private",
  },
  {
    id: "PRY-005",
    title: "Gestión Hídrica Cuenca Samalá",
    cat: "Medio Ambiente",
    status: "En Ejecución",
    pct: 55,
    lead: "MARN / INAB",
    budget: "Q 22.4M",
    date: "Sep 2026",
    color: "#1A4280",
    visibility: "public",
  },
  {
    id: "PRY-006",
    title: "Red de Encadenamientos Productivos Textiles",
    cat: "Economía Local",
    status: "En Ejecución",
    pct: 31,
    lead: "Cámara de Industria",
    budget: "Q 6.8M",
    date: "Ago 2026",
    color: "#1A4280",
    visibility: "private",
  },
]

export const PROJECTS = PUBLIC_PROJECTS

export const STATUS_MAP: Record<string, {
  bg: string
  text: string
  dot: string
  label?: string
}> = {
  // Public standard labels
  "En Ejecución": {
    bg: "bg-navy-100",
    text: "text-navy-700",
    dot: "bg-navy-500",
    label: "En Ejecución",
  },
  Completado: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-600",
    label: "Completado",
  },
  Planificación: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Planificación",
  },
  Suspendido: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Suspendido",
  },

  // Admin and case-insensitive aliases
  activo: {
    bg: "bg-navy-100",
    text: "text-navy-700",
    dot: "bg-navy-500",
    label: "En Ejecución",
  },
  Activo: {
    bg: "bg-navy-100",
    text: "text-navy-700",
    dot: "bg-navy-500",
    label: "En Ejecución",
  },
  "en ejecución": {
    bg: "bg-navy-100",
    text: "text-navy-700",
    dot: "bg-navy-500",
    label: "En Ejecución",
  },
  completado: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-600",
    label: "Completado",
  },
  revision: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "En Revisión",
  },
  Revisión: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "En Revisión",
  },
  revisión: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "En Revisión",
  },
  borrador: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-500",
    label: "Borrador",
  },
  Borrador: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-500",
    label: "Borrador",
  },
  planificación: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Planificación",
  },
  planificacion: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Planificación",
  },
  suspendido: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Suspendido",
  },
}

export const DIRECTIVA: DirectivaMember[] = [
  {
    name: "Lic. Carlos Montúfar",
    role: "Colaborador",
    org: "Cámara de Comercio de Occidente",
    initials: "CM",
    photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&auto=format",
  },
  {
    name: "Ing. María Fuentes",
    role: "Colaborador",
    org: "AGEXPORT — Delegación Regional",
    initials: "MF",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop&auto=format",
  },
  {
    name: "Dr. Roberto Ajú",
    role: "Colaborador",
    org: "CUNOC / Universidad de San Carlos",
    initials: "RA",
    photo:
      "https://images.unsplash.com/photo-1624797432677-6f803a98acb3?w=400&h=500&fit=crop&auto=format",
  },
  {
    name: "Dra. Ana Hernández",
    role: "Colaborador",
    org: "Municipalidad de Quetzaltenango",
    initials: "AH",
    photo:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=500&fit=crop&auto=format",
  },
  {
    name: "Lic. Pedro Tzul",
    role: "Colaborador",
    org: "INGUAT — Delegación Occidente",
    initials: "PT",
    photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&auto=format",
  },
  {
    name: "Ing. Sandra Ortiz",
    role: "Colaborador",
    org: "Ministerio de Economía",
    initials: "SO",
    photo:
      "https://images.unsplash.com/photo-1614786269829-d24616faf56d?w=400&h=500&fit=crop&auto=format",
  },
]

export const DOCS: DocItem[] = [
  {
    abbr: "ACT",
    title: "Actas de Sesión",
    count: "38 documentos",
    tag: "Últimas 24 meses",
    color: "border-navy-200  bg-navy-50",
    abbr_color: "bg-navy-700  text-white",
  },
  {
    abbr: "INF",
    title: "Informes de Avance",
    count: "12 informes en 2026",
    tag: "Actualización trim.",
    color: "border-celeste-200  bg-celeste-50",
    abbr_color: "bg-celeste-600  text-white",
  },
  {
    abbr: "PLN",
    title: "Plan de Trabajo 2026",
    count: "Vigente · Jun 2026",
    tag: "6 líneas de acción",
    color: "border-slate-200 bg-slate-50",
    abbr_color: "bg-slate-600 text-white",
  },
  {
    abbr: "PRE",
    title: "Ejecución Presupuestaria",
    count: "Reportes trimestrales",
    tag: "Transparencia fiscal",
    color: "border-green-200 bg-green-50",
    abbr_color: "bg-green-700 text-white",
  },
]

import hito1Src from "../imports/hitos/hito1-fundacion.jpg"
import hito2Src from "../imports/hitos/hito2-icongreso.png"
import hito3Src from "../imports/hitos/hito3-intermedios.jpg"
import hito4Src from "../imports/hitos/hito4-ivcongreso.jpg"
import hito5Src from "../imports/hitos/hito5-vcongreso.png"
import hito6Src from "../imports/hitos/hito6-summit2026.jpg"

export const HITO_IMAGES = [
  hito1Src,
  hito2Src,
  hito3Src,
  hito4Src,
  hito5Src,
  hito6Src,
]

export const SUMMIT_SPEAKERS: SummitSpeaker[] = [
  {
    id: "SPK-001",
    name: "Inga. Carla Morales",
    role: "Especialista en Logística Territorial & Puertos",
    org: "Banco Interamericano de Desarrollo (BID)",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&auto=format",
    talkTitle:
      "Corredores Logísticos Inteligentes: El Futuro del Altiplano Occidental",
    talkDate: "29 de octubre de 2026",
    day: 1,
    talkTime: "09:00 - 10:15 hrs",
    room: "Salón Principal Villa L'katos",
    category: "Infraestructura & Logística",
    summary:
      "Análisis estratégico sobre la integración de redes viales principales y secundarias en Quetzaltenango para optimizar el transporte regional de carga.",
    bio: "Consultora internacional senior del BID con más de 15 años de experiencia liderando proyectos de logística territorial y movilidad sostenible en Latinoamérica.",
    topics: [
      "Logística multimodal",
      "Altiplano Occidental",
      "Reducción de costos",
      "Infraestructura vial",
    ],
  },
  {
    id: "SPK-002",
    name: "Dr. Alejandro Toledo",
    role: "Director de Transformación Digital Municipal",
    org: "Universidad Rafael Landívar",
    photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&auto=format",
    talkTitle:
      "Ventanilla Única de Inversión y Trámites Digitales para Municipios",
    talkDate: "29 de octubre de 2026",
    day: 1,
    talkTime: "10:30 - 11:45 hrs",
    room: "Salón Los Volcanes · Villa L'katos",
    category: "Innovación & Smart Cities",
    summary:
      "Presentación del modelo de arquitectura digital e interoperabilidad para licencias de construcción y permisos de operación sin burocracia.",
    bio: "Doctor en Ciencias de la Computación, investigador en gobernanza digital y modernización de gobiernos locales en la región centroamericana.",
    topics: [
      "Gobierno digital",
      "Interoperabilidad",
      "Ventanilla única",
      "Trámites ágiles",
    ],
  },
  {
    id: "SPK-003",
    name: "MSc. Sofía Mendoza",
    role: "Coordinadora Regional de Capital Humano",
    org: "INTECAP & Cámara de Industria de Guatemala",
    photo:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&auto=format",
    talkTitle:
      "Formación Técnica Dual: Conectando la Academia con la Industria 4.0",
    talkDate: "29 de octubre de 2026",
    day: 1,
    talkTime: "14:00 - 15:15 hrs",
    room: "Salón Principal Villa L'katos",
    category: "Desarrollo Humano",
    summary:
      "Estrategias para acelerar la empleabilidad juvenil y alinear las competencias técnicas con la demanda de manufactura ligera y tecnologías.",
    bio: "Especialista en educación técnica dual y modelos de certificación de competencias laborales con enfoque de inclusión y equidad.",
    topics: [
      "Educación técnica",
      "Empleo juvenil",
      "Industria 4.0",
      "Competencias laborales",
    ],
  },
  {
    id: "SPK-004",
    name: "Lic. Rodrigo Arriola",
    role: "Director de Atracción de Inversiones",
    org: "AGEXPORT / PRONACOM",
    photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&auto=format",
    talkTitle:
      "Zonas Económicas Especiales y Parques Industriales de Quetzaltenango",
    talkDate: "29 de octubre de 2026",
    day: 2,
    talkTime: "15:30 - 16:30 hrs",
    room: "Salón Principal Villa L'katos",
    category: "Inversión & Comercio",
    summary:
      "Marco legal, incentivos fiscales y modelo de desarrollo para el parque industrial y logístico de la Zona Económica Especial ZDEEP.",
    bio: "Economista con especialización en comercio internacional, atracción de inversión extranjera directa y desarrollo de regímenes especiales.",
    topics: [
      "ZDEEP",
      "Incentivos fiscales",
      "Encadenamientos productivos",
      "Exportaciones",
    ],
  },
  {
    id: "SPK-005",
    name: "Dra. Claudia Reyes",
    role: "Comisionada de Sostenibilidad e Hídrica",
    org: "MARN & Alianza por la Cuenca del Samalá",
    photo:
      "https://images.unsplash.com/photo-1614786269829-d24616faf56d?w=400&h=400&fit=crop&auto=format",
    talkTitle:
      "Gestión Sostenible del Agua y Resiliencia Climática Metropolitana",
    talkDate: "29 de octubre de 2026",
    day: 2,
    talkTime: "16:45 - 17:45 hrs",
    room: "Salón Los Volcanes · Villa L'katos",
    category: "Sostenibilidad & Medio Ambiente",
    summary:
      "Planes de tratamiento, protección de zonas de recarga hídrica y modelos de economía circular aplicados a sectores productivos regionales.",
    bio: "Ingeniera ambiental y doctora en Recursos Hídricos. Asesora en gestión de cuencas y políticas públicas de resiliencia ambiental.",
    topics: [
      "Cuenca Samalá",
      "Tratamiento hídrico",
      "Resiliencia urbana",
      "Economía circular",
    ],
  },
  {
    id: "SPK-006",
    name: "Lic. Carlos Montúfar",
    role: "Colaborador de la Mesa Departamental de Competitividad de Quetzaltenango",
    org: "Mesa Departamental de Competitividad de Quetzaltenango",
    photo:
      "https://images.unsplash.com/photo-1624797432677-6f803a98acb3?w=400&h=400&fit=crop&auto=format",
    talkTitle:
      "Presentación de la Hoja de Ruta de Competitividad Territorial 2026-2030",
    talkDate: "29 de octubre de 2026",
    day: 2,
    talkTime: "18:00 - 19:00 hrs",
    room: "Salón Plenario · Villa L'katos",
    category: "Estrategia & Gobernanza",
    summary:
      "Firma de acuerdos interinstitucionales y consolidación del portafolio de proyectos clave para el desarrollo económico del departamento.",
    bio: "Colaborador de la Mesa Departamental de Competitividad de Quetzaltenango y referente del sector empresarial regional.",
    topics: [
      "Plan Estratégico 2026-2030",
      "Gobernanza",
      "Compromisos territoriales",
      "Proyectos clave",
    ],
  },
]
