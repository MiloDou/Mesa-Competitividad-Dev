import { Project, AdminProposal, AdminMeeting, Member, SiteSection, Role, SectionType } from "../types/admin";

export const PROJECTS: Project[] = [
  { id:"PRY-001", title:"Corredor Logístico Altiplano Occidental",    cat:"Infraestructura",   status:"activo",    pct:68,  lead:"Carlos Montúfar",  budget:"Q 45.2M", updated:"08 Sep", visibility:"public",  desc:"Diseño e implementación de la red vial y logística que conecta los principales centros de producción del altiplano occidental con los mercados nacionales e internacionales." },
  { id:"PRY-002", title:"Plataforma Digital de Trámites Municipales", cat:"Modernización",     status:"activo",    pct:42,  lead:"María Fuentes",    budget:"Q 8.7M",  updated:"05 Sep", visibility:"public",  desc:"Sistema unificado de trámites en línea para ciudadanos y empresas ante la Municipalidad de Quetzaltenango." },
  { id:"PRY-003", title:"Formación Técnica Artesanal",                cat:"Desarrollo Humano", status:"completado",pct:100, lead:"Roberto Ajú",      budget:"Q 3.1M",  updated:"20 Jul", visibility:"public",  desc:"Programa de capacitación técnica para artesanos y microempresarios de los sectores textil y gastronómico." },
  { id:"PRY-004", title:"Zona Económica Especial Quetzaltenango",     cat:"Inversión",         status:"borrador",  pct:18,  lead:"Sandra Ortiz",     budget:"Q 120M",  updated:"09 Sep", visibility:"private", desc:"Estudio de factibilidad y propuesta de decreto legislativo para la creación de una Zona Económica Especial." },
  { id:"PRY-005", title:"Gestión Hídrica Cuenca Samalá",              cat:"Medio Ambiente",    status:"activo",    pct:55,  lead:"Pedro Tzul",       budget:"Q 22.4M", updated:"07 Sep", visibility:"public",  desc:"Plan integral de manejo de la cuenca hidrográfica del río Samalá, incluyendo reforestación y sistema de alerta temprana." },
  { id:"PRY-006", title:"Encadenamientos Productivos Textiles",       cat:"Economía Local",    status:"revision",  pct:31,  lead:"Ana Hernández",    budget:"Q 6.8M",  updated:"03 Sep", visibility:"private", desc:"Articulación de la cadena de valor del sector textil indígena, desde materia prima hasta comercialización internacional." },
];

export const ADMIN_PROPOSALS: AdminProposal[] = [
  { id:"P-001", title:"Aprobación del Plan Operativo Anual 2027",
    desc:"Se somete a votación la aprobación del POA 2027 incluyendo presupuesto de Q 4.2 millones y 8 líneas de acción prioritarias.",
    category:"Planificación", deadline:"18 Sep 2026", status:"activa",
    favor:8, contra:2, abstencion:1, total:14, created:"10 Sep 2026" },
  { id:"P-002", title:"Incorporación de nuevas gremiales al directorio",
    desc:"Propuesta para incorporar 3 nuevas gremiales: Asociación de Hoteles de Xela, Cámara de Minoristas, y Asociación de Emprendedores Juveniles.",
    category:"Membresía", deadline:"25 Sep 2026", status:"activa",
    favor:5, contra:1, abstencion:2, total:14, created:"10 Sep 2026" },
  { id:"P-003", title:"Convenio de cooperación con BANGUAT",
    desc:"Aprobación del convenio marco de cooperación técnica y financiera con el Banco de Guatemala para estudios de competitividad regional.",
    category:"Cooperación", deadline:"30 Sep 2026", status:"borrador",
    favor:0, contra:0, abstencion:0, total:14, created:"09 Sep 2026" },
  { id:"P-004", title:"Reglamento interno de sesiones 2025",
    desc:"Actualización del reglamento de sesiones ordinarias y extraordinarias de la Mesa.",
    category:"Gobernanza", deadline:"15 Ago 2026", status:"cerrada",
    favor:12, contra:1, abstencion:1, total:14, created:"01 Ago 2026" },
];

export const PROPOSALS = ADMIN_PROPOSALS;

export const ADMIN_MEETINGS: AdminMeeting[] = [
  { id:"REU-021", title:"Sesión Ordinaria No. 021", date:"25 Sep 2026", time:"09:00 – 12:00", loc:"Sala de Sesiones, CUNOC",     n:14, status:"upcoming", file:null, targetDate:"2026-09-25T09:00:00-06:00" },
  { id:"REU-022", title:"Mesa de Trabajo Infraestructura", date:"02 Oct 2026", time:"14:00 – 16:00", loc:"Virtual (Zoom)",      n:8,  status:"upcoming", file:null, targetDate:"2026-10-02T14:00:00-06:00" },
  { id:"REU-020", title:"Sesión Ordinaria No. 020", date:"21 Ago 2026", time:"09:00 – 12:00", loc:"Sala de Sesiones, CUNOC",    n:16, status:"done",     file:"Acta-020.pdf"},
  { id:"REU-019", title:"Comisión Especial",    date:"10 Ago 2026", time:"15:00 – 17:30", loc:"Municipalidad de Xela",n:11,status:"done",     file:"Acta-019.pdf"},
];

export const MEETINGS = ADMIN_MEETINGS;

export const MEMBERS: Member[] = [
  { name:"Carlos Montúfar", email:"c.montufa@camaraxela.gt",  role:"comision", org:"Cámara de Comercio",   status:"activo",   initials:"CM", joined:"Mar 2022", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
  { name:"María Fuentes",   email:"m.fuentes@agexport.gt",    role:"comision", org:"AGEXPORT",             status:"activo",   initials:"MF", joined:"Mar 2022", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
  { name:"Roberto Ajú",     email:"r.aju@cunoc.usac.gt",      role:"editor",   org:"CUNOC / USAC",         status:"activo",   initials:"RA", joined:"Jun 2022", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { name:"Sandra Ortiz",    email:"s.ortiz@mineco.gob.gt",    role:"editor",   org:"MINECO",               status:"activo",   initials:"SO", joined:"Ene 2023", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
  { name:"Pedro Tzul",      email:"p.tzul@inguat.gob.gt",     role:"editor",   org:"INGUAT",               status:"activo",   initials:"PT", joined:"Ago 2023", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { name:"Ana Hernández",   email:"a.hernandez@xela.gob.gt",  role:"comision", org:"Municipalidad",        status:"activo",   initials:"AH", joined:"Mar 2022", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
  { name:"Luis Morales",    email:"l.morales@cige.gt",         role:"editor",   org:"CIGE",                status:"inactivo", initials:"LM", joined:"May 2024", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
];

export const ROLE_COLOR: Record<Role, string> = {
  comision: "bg-navy-800 text-white",
  editor:   "bg-celeste-100 text-celeste-700",
};

export const ROLE_LABEL: Record<Role, string> = { comision:"Comisión", editor:"Editor" };

export const STATUS_CHIP: Record<string, string> = {
  activo:    "bg-navy-100 text-navy-700",
  completado:"bg-green-100 text-green-700",
  borrador:  "bg-slate-100 text-slate-600",
  revision:  "bg-amber-100 text-amber-700",
};

export const SECTION_LABELS: Record<SectionType, string> = {
  hero:      "Portada principal",
  about:     "Quiénes somos",
  timeline:  "Línea de tiempo",
  news:      "Noticias y comunicados",
  event:     "Evento / Summit",
  projects:  "Cartera de proyectos",
  documents: "Documentos públicos",
  contact:   "Contacto",
  cta:       "Llamada a la acción",
  stats:     "Estadísticas",
  custom:    "Apartado Personalizado",
};

export const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  hero:      "Banner principal con título, descripción, imagen y botones",
  about:     "Descripción institucional, misión y cifras clave con imagen",
  timeline:  "Hitos cronológicos de la Mesa desde su fundación",
  news:      "Artículos, comunicados e imágenes de noticias recientes",
  event:     "Bloque informativo con afiche/imagen para eventos y foros",
  projects:  "Cartera de iniciativas con indicadores de avance público",
  documents: "Repositorio de documentos, actas e informes de acceso ciudadano",
  contact:   "Datos de contacto y formulario de comunicación",
  cta:       "Banda destacada con mensaje y llamada a la acción",
  stats:     "Fila de indicadores numéricos clave de la institución",
  custom:    "Crea un nuevo apartado personalizado (ej. Juegos Nacionales)",
};

export const DEFAULT_SECTIONS: SiteSection[] = [
  { id:"s1", type:"hero",      visible:true, data:{
    eyebrow:  "Región Occidente · Guatemala",
    title:    "Mesa de Competitividad de Quetzaltenango",
    subtitle: "Articulamos sector público, privado y academia para construir la agenda de desarrollo económico sostenible del occidente guatemalteco.",
    cta1:     "Ver iniciativas activas",
    cta2:     "Summit de Competitividad 2026",
  }},
  { id:"s2", type:"about",     visible:true, data:{
    title:       "Un espacio de diálogo y construcción colectiva",
    description: "La Mesa de Competitividad de Quetzaltenango es un mecanismo de coordinación interinstitucional que reúne representantes del sector público, empresarial, académico y de la sociedad civil para diseñar e implementar la agenda de competitividad territorial.",
    stat1_n:"12", stat1_label:"Instituciones públicas",
    stat2_n:"18", stat2_label:"Gremiales privadas",
    stat3_n:"6",  stat3_label:"Universidades",
  }},
  { id:"s3", type:"timeline",  visible:true, data:{
    title: "Hitos de la Mesa",
    m1_year:"2019", m1_label:"Fundación",       m1_desc:"Decreto de creación y primera sesión constitutiva",
    m2_year:"2021", m2_label:"Plan Estratégico", m2_desc:"Aprobación del primer Plan de Trabajo 2021–2024",
    m3_year:"2022", m3_label:"Q 100 millones",  m3_desc:"Primer portafolio de proyectos articulados",
    m4_year:"2024", m4_label:"47 aliados",       m4_desc:"Incorporación de 12 nuevas instituciones miembro",
    m5_year:"2026", m5_label:"Summit",           m5_desc:"Primer Summit de Competitividad Regional",
  }},
  { id:"s4", type:"news",      visible:true, data:{
    title:       "Comunicados y Noticias",
    a1_title:    "Mesa aprueba nuevo corredor logístico con inversión de Q 45 millones",
    a1_category: "Sesión Ordinaria",
    a1_date:     "21 agosto 2026",
    a1_excerpt:  "La Sesión Ordinaria No. 020 aprobó por unanimidad el expediente técnico del Corredor Logístico del Altiplano Occidental.",
    a2_title:    "Abiertas inscripciones para el Summit de Competitividad 2026",
    a2_category: "Convocatoria",
    a2_date:     "05 sep 2026",
    a2_excerpt:  "400 cupos disponibles para dos jornadas de conferencias y mesas de trabajo.",
    a3_title:    "Informe de avance Q3 2026: 68% de ejecución en proyectos prioritarios",
    a3_category: "Informe",
    a3_date:     "02 sep 2026",
    a3_excerpt:  "El tercer informe trimestral revela una ejecución presupuestaria del 68% en la cartera activa.",
  }},
  { id:"s5", type:"event",     visible:true, data:{
    name:        "Summit de Competitividad Quetzaltenango 2026",
    eyebrow:     "Evento Anual 2026",
    date:        "14–15 Nov 2026",
    venue:       "Hotel Intercontinental Xela",
    capacity:    "400 participantes",
    speakers:    "+28 confirmados",
    description: "Dos días de conferencias magistrales, mesas de trabajo y networking estratégico para construir la hoja de ruta de la competitividad regional.",
    alert_title: "Registro anticipado",
    alert_body:  "Complete su pre-registro antes del 31 de octubre de 2026 para garantizar su lugar.",
  }},
  { id:"s6", type:"projects",  visible:true, data:{
    title:    "Iniciativas en Seguimiento",
    subtitle: "Panel Ciudadano de Auditoría",
  }},
  { id:"s7", type:"documents", visible:true, data:{
    title:      "Documentos y Registros Públicos",
    d1_title:   "Actas de Sesión",
    d1_count:   "38 documentos",
    d1_tag:     "Últimas 24 meses",
    d2_title:   "Informes de Avance",
    d2_count:   "12 informes en 2026",
    d2_tag:     "Actualización trimestral",
    d3_title:   "Plan de Trabajo 2026",
    d3_count:   "Vigente · Jun 2026",
    d3_tag:     "6 líneas de acción",
    d4_title:   "Ejecución Presupuestaria",
    d4_count:   "Reportes trimestrales",
    d4_tag:     "Transparencia fiscal",
  }},
  { id:"s8", type:"contact",   visible:true, data:{
    title:   "Comuníquese con la Mesa",
    address: "7ª Av. 3-33 Zona 1, Quetzaltenango, Guatemala",
    phone:   "+502 7767-0000",
    email:   "mesa.competitividad@quetzaltenango.gob.gt",
    hours:   "Lun – Vie · 8:00 – 17:00 hrs.",
  }},
];

export interface FieldDef { key:string; label:string; type:"text"|"textarea"|"image"; required?:boolean; hint?:string }

export const SECTION_FIELDS: Record<SectionType, FieldDef[]> = {
  hero: [
    { key:"eyebrow",  label:"Texto de identificación",   type:"text",     hint:"Aparece encima del título principal (ej. Región Occidente · Guatemala)" },
    { key:"title",    label:"Título principal",          type:"text",     required:true },
    { key:"subtitle", label:"Párrafo de introducción",   type:"textarea", required:true },
    { key:"imageUrl", label:"Imagen de portada (URL)",   type:"image",    required:true, hint:"Ingrese la URL de la imagen principal para la portada" },
    { key:"cta1",     label:"Botón principal (texto)",   type:"text",     hint:"Texto del botón dorado" },
    { key:"cta2",     label:"Botón secundario (texto)",  type:"text" },
  ],
  about: [
    { key:"title",       label:"Título de la sección",  type:"text",     required:true },
    { key:"description", label:"Descripción principal", type:"textarea", required:true, hint:"Puede ser un párrafo o dos. Se mostrará como texto de cuerpo." },
    { key:"imageUrl",    label:"Imagen institucional (URL)", type:"image", required:true, hint:"Imagen ilustrativa para el apartado Quiénes Somos" },
    { key:"stat1_n",     label:"Cifra 1 — número",      type:"text",     hint:"Ej. 12" },
    { key:"stat1_label", label:"Cifra 1 — descripción", type:"text",     hint:"Ej. Instituciones públicas" },
    { key:"stat2_n",     label:"Cifra 2 — número",      type:"text" },
    { key:"stat2_label", label:"Cifra 2 — descripción", type:"text" },
    { key:"stat3_n",     label:"Cifra 3 — número",      type:"text" },
    { key:"stat3_label", label:"Cifra 3 — descripción", type:"text" },
  ],
  timeline: [
    { key:"title",    label:"Título de la sección", type:"text", required:true },
    { key:"m1_year",  label:"Hito 1 — año",         type:"text" }, { key:"m1_label", label:"Hito 1 — nombre",      type:"text" }, { key:"m1_desc", label:"Hito 1 — descripción", type:"text" },
    { key:"m2_year",  label:"Hito 2 — año",         type:"text" }, { key:"m2_label", label:"Hito 2 — nombre",      type:"text" }, { key:"m2_desc", label:"Hito 2 — descripción", type:"text" },
    { key:"m3_year",  label:"Hito 3 — año",         type:"text" }, { key:"m3_label", label:"Hito 3 — nombre",      type:"text" }, { key:"m3_desc", label:"Hito 3 — descripción", type:"text" },
    { key:"m4_year",  label:"Hito 4 — año",         type:"text" }, { key:"m4_label", label:"Hito 4 — nombre",      type:"text" }, { key:"m4_desc", label:"Hito 4 — descripción", type:"text" },
    { key:"m5_year",  label:"Hito 5 — año",         type:"text" }, { key:"m5_label", label:"Hito 5 — nombre",      type:"text" }, { key:"m5_desc", label:"Hito 5 — descripción", type:"text" },
  ],
  news: [
    { key:"title",       label:"Título de la sección", type:"text", required:true },
    { key:"a1_title",    label:"Artículo 1 — título",    type:"text",     required:true },
    { key:"a1_category", label:"Artículo 1 — categoría", type:"text",     hint:"Ej. Sesión Ordinaria, Informe, Convocatoria" },
    { key:"a1_date",     label:"Artículo 1 — fecha",     type:"text" },
    { key:"a1_excerpt",  label:"Artículo 1 — resumen",   type:"textarea" },
    { key:"a1_image",    label:"Artículo 1 — imagen (URL)", type:"image", hint:"URL de la foto de portada de la noticia" },
    { key:"a2_title",    label:"Artículo 2 — título",    type:"text" },
    { key:"a2_category", label:"Artículo 2 — categoría", type:"text" },
    { key:"a2_date",     label:"Artículo 2 — fecha",     type:"text" },
    { key:"a2_excerpt",  label:"Artículo 2 — resumen",   type:"textarea" },
    { key:"a2_image",    label:"Artículo 2 — imagen (URL)", type:"image" },
    { key:"a3_title",    label:"Artículo 3 — título",    type:"text" },
    { key:"a3_category", label:"Artículo 3 — categoría", type:"text" },
    { key:"a3_date",     label:"Artículo 3 — fecha",     type:"text" },
    { key:"a3_excerpt",  label:"Artículo 3 — resumen",   type:"textarea" },
    { key:"a3_image",    label:"Artículo 3 — imagen (URL)", type:"image" },
  ],
  event: [
    { key:"eyebrow",     label:"Etiqueta de identificación",  type:"text",     hint:"Aparece como pastilla encima del título (ej. Evento Anual 2026)" },
    { key:"name",        label:"Nombre del evento",          type:"text",     required:true },
    { key:"date",        label:"Fecha(s)",                   type:"text",     hint:"Ej. 14–15 Nov 2026" },
    { key:"venue",       label:"Lugar / recinto",            type:"text" },
    { key:"capacity",    label:"Capacidad",                  type:"text",     hint:"Ej. 400 participantes" },
    { key:"speakers",    label:"Ponentes confirmados",       type:"text",     hint:"Ej. +28 confirmados" },
    { key:"imageUrl",    label:"Afiche / Imagen del evento (URL)", type:"image", required:true, hint:"Imagen o banner promocional del evento" },
    { key:"description", label:"Descripción del evento",     type:"textarea", required:true },
    { key:"alert_title", label:"Aviso destacado — título",   type:"text",     hint:"Ej. Registro anticipado" },
    { key:"alert_body",  label:"Aviso destacado — texto",    type:"textarea" },
  ],
  projects: [
    { key:"title",    label:"Título de la sección",       type:"text", required:true },
    { key:"subtitle", label:"Descripción breve (eyebrow)", type:"text", hint:"Aparece en letra pequeña encima del título" },
  ],
  documents: [
    { key:"title",      label:"Título de la sección", type:"text", required:true },
    { key:"d1_title",   label:"Documento 1 — nombre",       type:"text" }, { key:"d1_count", label:"Documento 1 — cantidad/estado", type:"text" }, { key:"d1_tag", label:"Documento 1 — etiqueta", type:"text" },
    { key:"d2_title",   label:"Documento 2 — nombre",       type:"text" }, { key:"d2_count", label:"Documento 2 — cantidad/estado", type:"text" }, { key:"d2_tag", label:"Documento 2 — etiqueta", type:"text" },
    { key:"d3_title",   label:"Documento 3 — nombre",       type:"text" }, { key:"d3_count", label:"Documento 3 — cantidad/estado", type:"text" }, { key:"d3_tag", label:"Documento 3 — etiqueta", type:"text" },
    { key:"d4_title",   label:"Documento 4 — nombre",       type:"text" }, { key:"d4_count", label:"Documento 4 — cantidad/estado", type:"text" }, { key:"d4_tag", label:"Documento 4 — etiqueta", type:"text" },
  ],
  contact: [
    { key:"title",   label:"Título de la sección", type:"text",    required:true },
    { key:"address", label:"Dirección",            type:"text" },
    { key:"phone",   label:"Teléfono",             type:"text" },
    { key:"email",   label:"Correo electrónico",   type:"text" },
    { key:"hours",   label:"Horario de atención",  type:"text",    hint:"Ej. Lun – Vie · 8:00 – 17:00 hrs." },
  ],
  cta: [
    { key:"eyebrow",  label:"Texto de identificación", type:"text" },
    { key:"title",    label:"Título",                  type:"text",     required:true },
    { key:"subtitle", label:"Descripción",             type:"textarea" },
    { key:"button",   label:"Texto del botón",         type:"text",     required:true },
  ],
  stats: [
    { key:"title",        label:"Título de la sección (opcional)", type:"text" },
    { key:"s1_value",label:"Indicador 1 — cifra",  type:"text" }, { key:"s1_label",label:"Indicador 1 — descripción", type:"text" },
    { key:"s2_value",label:"Indicador 2 — cifra",  type:"text" }, { key:"s2_label",label:"Indicador 2 — descripción", type:"text" },
    { key:"s3_value",label:"Indicador 3 — cifra",  type:"text" }, { key:"s3_label",label:"Indicador 3 — descripción", type:"text" },
    { key:"s4_value",label:"Indicador 4 — cifra",  type:"text" }, { key:"s4_label",label:"Indicador 4 — descripción", type:"text" },
  ],
  custom: [
    { key:"title",       label:"Título del apartado",        type:"text",     required:true, hint:"Ej. Juegos Nacionales 2026" },
    { key:"subtitle",    label:"Subtítulo / Categoría",      type:"text",     hint:"Ej. Iniciativa Deportiva Regional" },
    { key:"description", label:"Contenido principal",        type:"textarea", required:true, hint:"Describa la información del nuevo apartado" },
    { key:"imageUrl",    label:"Imagen destacada (URL)",     type:"image",    required:true, hint:"Ingrese la URL de la imagen requerida para este apartado" },
    { key:"cta",         label:"Texto de enlace / Botón",    type:"text",     hint:"Ej. Más información" },
  ],
};
