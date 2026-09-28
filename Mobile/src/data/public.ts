import { PublicProject, DirectivaMember, DocItem } from "../types/public";

export const ROLE_SHORT: Record<string, string> = {
  "Presidente":    "PRES",
  "Vicepresidenta": "VP",
  "Secretario":    "SEC",
  "Tesorera":      "TES",
  "Vocal I":       "V-I",
  "Vocal II":      "V-II",
};

export const PUBLIC_PROJECTS: PublicProject[] = [
  { id:"PRY-001", title:"Corredor Logístico Altiplano Occidental", cat:"Infraestructura",    status:"En Ejecución", pct:68, lead:"Min. de Comunicaciones",  budget:"Q 45.2M", date:"Sep 2026", color:"#1A4280" },
  { id:"PRY-002", title:"Plataforma Digital de Trámites Municipales", cat:"Modernización",   status:"En Ejecución", pct:42, lead:"Municipalidad de Xela",   budget:"Q 8.7M",  date:"Ago 2026", color:"#1A4280" },
  { id:"PRY-003", title:"Programa de Formación Técnica Artesanal",    cat:"Desarrollo Humano",status:"Completado",   pct:100,lead:"INTECAP Regional",        budget:"Q 3.1M",  date:"Jul 2026", color:"#15803D" },
  { id:"PRY-004", title:"Zona Económica Especial Quetzaltenango",     cat:"Inversión",       status:"Planificación",pct:18, lead:"AGEXPORT",                  budget:"Q 120M",  date:"Sep 2026", color:"#D97706" },
  { id:"PRY-005", title:"Gestión Hídrica Cuenca Samalá",              cat:"Medio Ambiente",  status:"En Ejecución", pct:55, lead:"MARN / INAB",              budget:"Q 22.4M", date:"Sep 2026", color:"#1A4280" },
  { id:"PRY-006", title:"Red de Encadenamientos Productivos Textiles",cat:"Economía Local",  status:"En Ejecución", pct:31, lead:"Cámara de Industria",      budget:"Q 6.8M",  date:"Ago 2026", color:"#1A4280" },
];

export const PROJECTS = PUBLIC_PROJECTS;

export const STATUS_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  "En Ejecución": { bg:"bg-navy-100", text:"text-navy-700",     dot:"bg-navy-500"   },
  "Completado":   { bg:"bg-green-100",text:"text-green-700",    dot:"bg-green-600"  },
  "Planificación":{ bg:"bg-amber-100",text:"text-amber-700",    dot:"bg-amber-500"  },
  "Suspendido":   { bg:"bg-red-100",  text:"text-red-700",      dot:"bg-red-500"    },
};

export const DIRECTIVA: DirectivaMember[] = [
  { name:"Lic. Carlos Montúfar",  role:"Presidente",    org:"Cámara de Comercio de Occidente",    initials:"CM", photo:"https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&auto=format" },
  { name:"Ing. María Fuentes",    role:"Vicepresidenta",org:"AGEXPORT — Delegación Regional",      initials:"MF", photo:"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop&auto=format" },
  { name:"Dr. Roberto Ajú",       role:"Secretario",    org:"CUNOC / Universidad de San Carlos",   initials:"RA", photo:"https://images.unsplash.com/photo-1624797432677-6f803a98acb3?w=400&h=500&fit=crop&auto=format" },
  { name:"Dra. Ana Hernández",    role:"Tesorera",      org:"Municipalidad de Quetzaltenango",     initials:"AH", photo:"https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=500&fit=crop&auto=format" },
  { name:"Lic. Pedro Tzul",       role:"Vocal I",       org:"INGUAT — Delegación Occidente",       initials:"PT", photo:"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&auto=format" },
  { name:"Ing. Sandra Ortiz",     role:"Vocal II",      org:"Ministerio de Economía",              initials:"SO", photo:"https://images.unsplash.com/photo-1614786269829-d24616faf56d?w=400&h=500&fit=crop&auto=format" },
];

export const DOCS: DocItem[] = [
  { abbr:"ACT", title:"Actas de Sesión",         count:"38 documentos",         tag:"Últimas 24 meses",   color:"border-navy-200  bg-navy-50",  abbr_color:"bg-navy-700  text-white"  },
  { abbr:"INF", title:"Informes de Avance",       count:"12 informes en 2026",   tag:"Actualización trim.",color:"border-celeste-200  bg-celeste-50",  abbr_color:"bg-celeste-600  text-white"  },
  { abbr:"PLN", title:"Plan de Trabajo 2026",     count:"Vigente · Jun 2026",    tag:"6 líneas de acción", color:"border-slate-200 bg-slate-50", abbr_color:"bg-slate-600 text-white"  },
  { abbr:"PRE", title:"Ejecución Presupuestaria", count:"Reportes trimestrales", tag:"Transparencia fiscal",color:"border-green-200 bg-green-50",abbr_color:"bg-green-700 text-white"  },
];

export const HITO_IMAGES = [
  "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=400&h=250&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1560523160-754a9e25c68f?w=400&h=250&fit=crop&auto=format",
];
