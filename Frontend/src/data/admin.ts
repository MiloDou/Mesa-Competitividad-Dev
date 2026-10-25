import {
  Project,
  AdminProposal,
  AdminMeeting,
  Member,
  SiteSection,
  Role,
  SectionType,
} from "../types/admin"


export const PROJECTS: Project[] = [
  {
    id: "PRY-001",
    title: "Corredor Logístico Altiplano Occidental",
    cat: "Infraestructura",
    status: "activo",
    pct: 68,
    lead: "Carlos Montúfar",
    budget: "Q 45.2M",
    updated: "08 Sep",
    visibility: "public",
    desc: "Diseño e implementación de la red vial y logística que conecta los principales centros de producción del altiplano occidental con los mercados nacionales e internacionales.",
  },

  {
    id: "PRY-002",
    title: "Plataforma Digital de Trámites Municipales",
    cat: "Modernización",
    status: "activo",
    pct: 42,
    lead: "María Fuentes",
    budget: "Q 8.7M",
    updated: "05 Sep",
    visibility: "public",
    desc: "Sistema unificado de trámites en línea para ciudadanos y empresas ante la Municipalidad de Quetzaltenango.",
  },

  {
    id: "PRY-003",
    title: "Formación Técnica Artesanal",
    cat: "Desarrollo Humano",
    status: "completado",
    pct: 100,
    lead: "Roberto Ajú",
    budget: "Q 3.1M",
    updated: "20 Jul",
    visibility: "public",
    desc: "Programa de capacitación técnica para artesanos y microempresarios de los sectores textil y gastronómico.",
  },

  {
    id: "PRY-004",
    title: "Zona Económica Especial Quetzaltenango",
    cat: "Inversión",
    status: "borrador",
    pct: 18,
    lead: "Sandra Ortiz",
    budget: "Q 120M",
    updated: "09 Sep",
    visibility: "private",
    desc: "Estudio de factibilidad y propuesta de decreto legislativo para la creación de una Zona Económica Especial.",
  },

  {
    id: "PRY-005",
    title: "Gestión Hídrica Cuenca Samalá",
    cat: "Medio Ambiente",
    status: "activo",
    pct: 55,
    lead: "Pedro Tzul",
    budget: "Q 22.4M",
    updated: "07 Sep",
    visibility: "public",
    desc: "Plan integral de manejo de la cuenca hidrográfica del río Samalá, incluyendo reforestación y sistema de alerta temprana.",
  },

  {
    id: "PRY-006",
    title: "Encadenamientos Productivos Textiles",
    cat: "Economía Local",
    status: "revision",
    pct: 31,
    lead: "Ana Hernández",
    budget: "Q 6.8M",
    updated: "03 Sep",
    visibility: "private",
    desc: "Articulación de la cadena de valor del sector textil indígena, desde materia prima hasta comercialización internacional.",
  },
]

export const ADMIN_PROPOSALS: AdminProposal[] = [
  {
    id: "P-001",
    title: "Aprobación del Plan Operativo Anual 2027",

    desc: "Se somete a votación la aprobación del POA 2027 incluyendo presupuesto de Q 4.2 millones y 8 líneas de acción prioritarias.",

    category: "Planificación",
    deadline: "18 Sep 2026",
    status: "activa",

    favor: 8,
    contra: 2,
    abstencion: 1,
    total: 14,
    created: "10 Sep 2026",
  },

  {
    id: "P-002",
    title: "Incorporación de nuevas gremiales al directorio",

    desc: "Propuesta para incorporar 3 nuevas gremiales: Asociación de Hoteles de Xela, Cámara de Minoristas, y Asociación de Emprendedores Juveniles.",

    category: "Membresía",
    deadline: "25 Sep 2026",
    status: "activa",

    favor: 5,
    contra: 1,
    abstencion: 2,
    total: 14,
    created: "10 Sep 2026",
  },

  {
    id: "P-003",
    title: "Convenio de cooperación con BANGUAT",

    desc: "Aprobación del convenio marco de cooperación técnica y financiera con el Banco de Guatemala para estudios de competitividad regional.",

    category: "Cooperación",
    deadline: "30 Sep 2026",
    status: "borrador",

    favor: 0,
    contra: 0,
    abstencion: 0,
    total: 14,
    created: "09 Sep 2026",
  },

  {
    id: "P-004",
    title: "Reglamento interno de sesiones 2025",

    desc: "Actualización del reglamento de sesiones ordinarias y extraordinarias de la Mesa.",

    category: "Gobernanza",
    deadline: "15 Ago 2026",
    status: "cerrada",

    favor: 12,
    contra: 1,
    abstencion: 1,
    total: 14,
    created: "01 Ago 2026",
  },
]

export const PROPOSALS = ADMIN_PROPOSALS

export const ADMIN_MEETINGS: AdminMeeting[] = [
  {
    id: "REU-023",
    title: "Mesa de Trabajo: Conectividad e Infraestructura Vial",
    date: "14 Oct 2026",
    time: "09:00 – 11:30",
    loc: "Sala de Sesiones, CUNOC",
    n: 14,
    status: "upcoming",
    file: null,
    targetDate: "2026-10-14T09:00:00-06:00",
  },

  {
    id: "REU-024",
    title: "Taller: Simplificación de Trámites Municipales",
    date: "22 Oct 2026",
    time: "10:00 – 12:00",
    loc: "Virtual (MS Teams)",
    n: 12,
    status: "upcoming",
    file: null,
    targetDate: "2026-10-22T10:00:00-06:00",
  },

  {
    id: "REU-025",
    title: "Sesión Plenaria Ordinaria: Presentación POA 2027",
    date: "28 Oct 2026",
    time: "09:00 – 13:00",
    loc: "Auditorio Principal, CUNOC",
    n: 18,
    status: "upcoming",
    file: null,
    targetDate: "2026-10-28T09:00:00-06:00",
  },

  {
    id: "REU-022",
    title: "Mesa de Trabajo Infraestructura",
    date: "02 Oct 2026",
    time: "14:00 – 16:00",
    loc: "Virtual (Zoom)",
    n: 8,
    status: "done",
    file: "Acta-022.pdf",
    targetDate: "2026-10-02T14:00:00-06:00",
  },

  {
    id: "REU-021",
    title: "Sesión Ordinaria No. 021",
    date: "25 Sep 2026",
    time: "09:00 – 12:00",
    loc: "Sala de Sesiones, CUNOC",
    n: 14,
    status: "done",
    file: "Acta-021.pdf",
    targetDate: "2026-09-25T09:00:00-06:00",
  },

  {
    id: "REU-020",
    title: "Sesión Ordinaria No. 020",
    date: "21 Ago 2026",
    time: "09:00 – 12:00",
    loc: "Sala de Sesiones, CUNOC",
    n: 16,
    status: "done",
    file: "Acta-020.pdf",
    targetDate: "2026-08-21T09:00:00-06:00",
  },

  {
    id: "REU-019",
    title: "Comisión Especial",
    date: "10 Ago 2026",
    time: "15:00 – 17:30",
    loc: "Municipalidad de Xela",
    n: 11,
    status: "done",
    file: "Acta-019.pdf",
    targetDate: "2026-08-10T15:00:00-06:00",
  },
]

export const MEETINGS = ADMIN_MEETINGS

export const MEMBERS: Member[] = [
  {
    name: "Carlos Montúfar",
    email: "c.montufa@camaraxela.gt",
    role: "comision",
    position: "Colaborador",
    org: "Cámara de Comercio",
    status: "activo",
    initials: "CM",
    joined: "Mar 2022",
    photo:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },

  {
    name: "María Fuentes",
    email: "m.fuentes@agexport.gt",
    role: "comision",
    position: "Colaborador",
    org: "AGEXPORT",
    status: "activo",
    initials: "MF",
    joined: "Mar 2022",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },

  {
    name: "Roberto Ajú",
    email: "r.aju@cunoc.usac.gt",
    role: "editor",
    position: "Colaborador",
    org: "CUNOC / USAC",
    status: "activo",
    initials: "RA",
    joined: "Jun 2022",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },

  {
    name: "Sandra Ortiz",
    email: "s.ortiz@mineco.gob.gt",
    role: "editor",
    position: "Colaborador",
    org: "MINECO",
    status: "activo",
    initials: "SO",
    joined: "Ene 2023",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },

  {
    name: "Pedro Tzul",
    email: "p.tzul@inguat.gob.gt",
    role: "editor",
    position: "Colaborador",
    org: "INGUAT",
    status: "activo",
    initials: "PT",
    joined: "Ago 2023",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },

  {
    name: "Ana Hernández",
    email: "a.hernandez@xela.gob.gt",
    role: "comision",
    position: "Colaborador",
    org: "Municipalidad",
    status: "activo",
    initials: "AH",
    joined: "Mar 2022",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  },

  {
    name: "Luis Morales",
    email: "l.morales@cige.gt",
    role: "editor",
    position: "Colaborador",
    org: "CIGE",
    status: "inactivo",
    initials: "LM",
    joined: "May 2024",
    photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
]

export const DEFAULT_ENTITIES: import("../types/admin").ParticipatingEntity[] =
  [
    // 02 Academia (4)

    {
      id: "cunoc",
      name: "CUNOC / USAC",
      category: "Academia",
      initials: "CUNOC",
      photo:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    {
      id: "url",
      name: "Univ. Rafael Landívar",
      category: "Academia",
      initials: "URL",
      photo:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    {
      id: "meso",
      name: "Univ. Mesoamericana",
      category: "Academia",
      initials: "MESO",
      photo:
        "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    {
      id: "udv",
      name: "Univ. Da Vinci",
      category: "Academia",
      initials: "UDV",
      photo:
        "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    // 03 Público (5)

    {
      id: "gobernacion",
      name: "Gobernación Departamental",
      category: "Sector Público",
      initials: "GOB",
      photo:
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    {
      id: "mineco",
      name: "MINECO",
      category: "Sector Público",
      initials: "MINECO",
      photo:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    {
      id: "inguat",
      name: "INGUAT",
      category: "Sector Público",
      initials: "INGUAT",
      photo:
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    {
      id: "metropoli",
      name: "Mancomunidad Metrópoli de los Altos",
      category: "Sector Público",
      initials: "MMA",
      photo:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    {
      id: "amdel",
      name: "AMDEL",
      category: "Sector Público",
      initials: "AMDEL",
      photo:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },

    // 05 Social (1)

    {
      id: "grupogestor",
      name: "Red Nacional de Grupos Gestores",
      category: "Sector Social",
      initials: "RNGG",
      photo:
        "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=400&fit=crop&auto=format",
      status: "activo",
    },
  ]

export const ROLE_COLOR: Record<Role, string> = {
  comision: "bg-navy-800 text-white",

  editor: "bg-celeste-100 text-celeste-700",
}

export const ROLE_LABEL: Record<Role, string> = {
  comision: "Comisión",
  editor: "Editor",
}

export const STATUS_CHIP: Record<string, string> = {
  activo: "bg-navy-100 text-navy-700",
  pausado: "bg-amber-100 text-amber-800",

  completado: "bg-green-100 text-green-700",

  borrador: "bg-slate-100 text-slate-600",

  archivado: "bg-slate-200 text-slate-800",

  revision: "bg-amber-100 text-amber-700",
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Portada principal",

  about: "Quiénes somos",

  conformados: "Conformados por (Sectores y Cifras)",

  timeline: "Línea de tiempo",

  news: "Noticias y comunicados",

  event: "Evento / Summit",

  projects: "Cartera de proyectos",

  documents: "Documentos públicos",

  contact: "Contacto",

  cta: "Llamada a la acción",

  stats: "Estadísticas",

  custom: "Apartado Personalizado",
}

export const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  hero: "Banner principal con título, descripción, imagen y botones",

  about: "Descripción institucional, misión y reseña de trayectoria con imagen",

  conformados:
    "Bloque editable independiente para mostrar el desglose de sectores e instituciones",

  timeline: "Hitos cronológicos de la Mesa desde su fundación",

  news: "Artículos, comunicados e imágenes de noticias recientes",

  event: "Bloque informativo con afiche/imagen para eventos y foros",

  projects: "Cartera de iniciativas con indicadores de avance público",

  documents: "Repositorio de documentos, actas e informes de acceso ciudadano",

  contact: "Datos de contacto y formulario de comunicación",

  cta: "Banda destacada con mensaje y llamada a la acción",

  stats: "Fila de indicadores numéricos clave de la institución",

  custom: "Crea un nuevo apartado personalizado (ej. Juegos Nacionales)",
}

export const DEFAULT_SECTIONS: SiteSection[] = [
  {
    id: "s1",
    type: "hero",
    visible: true,
    data: {
      eyebrow:
        "15 años Construyendo Competitividad Regional · Suroccidente de Guatemala",

      title: "Mesa Departamental de Competitividad de Quetzaltenango",

      subtitle:
        "Fortalecer a Quetzaltenango como nodo regional estratégico del suroccidente de Guatemala, articulando esfuerzos públicos y privados para dinamizar la economía, atraer inversión y generar oportunidades de desarrollo competitivo y sostenible para todo el territorio.",

      cta1: "Ver iniciativas activas",

      cta2: "Summit de Competitividad 2026",
    },
  },

  {
    id: "s2",
    type: "about",
    visible: true,
    data: {
      title: "Juntos hacemos del suroccidente un territorio de oportunidades",

      description:
        "Espacio de diálogo y colaboración multisectorial que articula esfuerzos del sector público, empresarial, académico y de cooperación para dinamizar la economía, atraer inversión y generar oportunidades de desarrollo sostenible en Quetzaltenango y la región.",
    },
  },

  {
    id: "s2_conformados",
    type: "conformados",
    visible: true,
    data: {
      title: "Conformados por",

      subtitle:
        "Red multisectorial de 10 instituciones aliadas que articulan la competitividad regional.",
    },
  },

  {
    id: "s3",
    type: "timeline",
    visible: true,
    data: {
      title: "Hitos Cronológicos y Congresos Históricos",

      m1_year: "Hace 15 años",
      m1_label: "Fundación / Inicio",
      m1_desc:
        "Consolidación y establecimiento de la Mesa como un espacio neutral de concertación y diálogo multisectorial para el desarrollo económico sostenible del occidente de Guatemala.",

      m1_img: "",

      m2_year: "2013",
      m2_label: "I Congreso",
      m2_desc:
        'Celebración del primer congreso bajo el lema "La Competitividad de la Región y sus Desafíos" en Gran Karmel, Quetzaltenango, con la participación de referentes como Roberto Gutiérrez, Hugo Maul y Luis Velásquez.',

      m2_img: "",

      m3_year: "Intermedios",
      m3_label: "II y III Congresos",
      m3_desc:
        'Realización del III Congreso de Competitividad titulado "Factores Territoriales como Detonantes para la Competitividad Empresarial" (18 de agosto), con ponentes de México, Colombia y Corea del Sur. Ferias y "Café Dialógico".',

      m3_img: "",

      m4_year: "2021",
      m4_label: "IV Congreso (Virtual)",
      m4_desc:
        'Adaptación y resiliencia institucional con el congreso virtual "Retos y Oportunidades para la Competitividad en el Marco del COVID-19" (4 de septiembre de 2021).',

      m4_img: "",

      m5_year: "V Congreso",
      m5_label: "Economía Verde",
      m5_desc:
        'Enfocado en la temática de "Economía Verde para elevar la competitividad, el empleo y disminuir la migración irregular".',

      m5_img: "",

      m6_year: "2026",
      m6_label: "VI Congreso / Summit",
      m6_desc:
        'Summit 2026: "Competitividad para el Suroccidente" (29 de octubre de 2026 en Villa L\'katos, cupo limitado a 150 personas), enfocado en la articulación público-privada-comunitaria, atracción de inversión y turismo regional.',

      m6_img: "",
    },
  },

  {
    id: "s4",
    type: "news",
    visible: true,
    data: {
      title: "Comunicados y Noticias",

      a1_title:
        "Mesa aprueba nuevo corredor logístico con inversión de Q 45 millones",

      a1_category: "Sesión Ordinaria",

      a1_date: "21 agosto 2026",

      a1_excerpt:
        "La Sesión Ordinaria No. 020 aprobó por unanimidad el expediente técnico del Corredor Logístico del Altiplano Occidental, marcando un hito para la conectividad regional.",

      a1_image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=700&fit=crop&auto=format",

      a1_content:
        "En una reunión histórica celebrada en la ciudad de Quetzaltenango, los delegados de la Mesa Departamental de Competitividad aprobaron el dictamen técnico final para la construcción y adecuación del Corredor Logístico del Altiplano Occidental. Este proyecto contempla la intervención de 42 kilómetros estratégicos para agilizar la movilización de carga pesada y productos agroindustriales entre Quetzaltenango, Totonicapán y San Marcos.",

      a2_title:
        "Abiertas inscripciones para el Summit de Competitividad 2026 (15 Años)",

      a2_category: "Convocatoria",

      a2_date: "05 sep 2026",

      a2_excerpt:
        "150 cupos disponibles para conferencias y mesas de trabajo sobre competitividad territorial en Villa L'katos (29 de octubre).",

      a2_image:
        "https://images.unsplash.com/photo-1560523160-754a9e25c68f?w=600&h=400&fit=crop&auto=format",

      a2_content:
        "Se han habilitado oficialmente los registros para el Summit Regional de Competitividad 2026 en Villa L'katos el próximo 29 de octubre de 2026. Con un aforo exclusivo limitado a 150 participantes, el evento reunirá a ponentes internacionales y nacionales expertos en logística, innovación digital, desarrollo de capital humano y atracción de inversiones.",

      a3_title:
        "Informe de avance Q3 2026: 68% de ejecución en proyectos prioritarios",

      a3_category: "Informe",

      a3_date: "02 sep 2026",

      a3_excerpt:
        "El tercer informe trimestral revela una ejecución presupuestaria del 68% en los proyectos de la cartera activa de la Mesa.",

      a3_image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format",

      a3_content:
        "El comité financiero y de auditoría ciudadana presentó el reporte de ejecución presupuestaria correspondiente al tercer trimestre del ejercicio fiscal 2026. Los proyectos de modernización municipal e infraestructura vial presentan los mayores porcentajes de avance.",

      a4_title: "Firma de alianza estratégica con universidades del occidente",

      a4_category: "Convenio",

      a4_date: "18 agosto 2026",

      a4_excerpt:
        "Consorcio universitario impulsará laboratorios de innovación tecnológica y becas de especialización técnica.",

      a4_image:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop&auto=format",

      a4_content:
        "Se suscribió un acuerdo marco de cooperación académica entre la Mesa Departamental de Competitividad de Quetzaltenango y 6 casas de estudios superiores para vincular la investigación universitaria con las necesidades reales del mercado laboral.",

      a5_title: "Lanzamiento del Plan Sostenible para la Cuenca del Río Samalá",

      a5_category: "Medio Ambiente",

      a5_date: "10 agosto 2026",

      a5_excerpt:
        "Iniciativa conjunta para reforestación de mantos freáticos y plantas de tratamiento de aguas residuales.",

      a5_image:
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop&auto=format",

      a5_content:
        "Con apoyo del Ministerio de Ambiente y Recursos Naturales (MARN) e INAB, se dio inicio al programa de protección ambiental de la cuenca hidrográfica del Samalá, beneficiando a más de 12 municipios.",

      a6_title:
        "Mesa realiza Rueda de Negocios Regional con más de 120 mipymes",

      a6_category: "Comercio",

      a6_date: "28 julio 2026",

      a6_excerpt:
        "Transacciones estimadas por más de Q 12 millones en sectores textil, agroindustria y servicios digitales.",

      a6_image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&auto=format",

      a6_content:
        "La comisión de Inversión y Comercio organizó la Quinta Rueda de Negocios de la Región Suroccidente, conectando a productores de Quetzaltenango con grandes distribuidores y cadenas supermercados del país.",
    },
  },

  {
    id: "s5",
    type: "event",
    visible: true,
    data: {
      name: "Summit de Competitividad Quetzaltenango 2026",

      eyebrow: "15 Años Construyendo Competitividad Regional",

      date: "29 de octubre de 2026",

      venue: "Villa L'katos",

      capacity: "150 personas",

      speakers: "+28 confirmados",

      imageUrl:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&auto=format",

      description:
        "Jornada de conferencias magistrales, mesas de trabajo y networking estratégico para construir la hoja de ruta de la competitividad regional.",

      alert_title: "Registro anticipado",

      alert_body:
        "Complete su pre-registro antes del 25 de octubre de 2026 para garantizar su lugar debido al cupo limitado de 150 personas.",
    },
  },

  {
    id: "s6",
    type: "projects",
    visible: true,
    data: {
      title: "Iniciativas en Seguimiento",

      subtitle: "Panel Ciudadano de Auditoría",
    },
  },

  {
    id: "s7",
    type: "documents",
    visible: true,
    data: {
      title: "Documentos y Registros Públicos",

      d1_title: "Actas de Sesión",

      d1_count: "38 documentos",

      d1_tag: "Últimas 24 meses",

      d2_title: "Informes de Avance",

      d2_count: "12 informes en 2026",

      d2_tag: "Actualización trimestral",

      d3_title: "Plan de Trabajo 2026",

      d3_count: "Vigente · Jun 2026",

      d3_tag: "6 líneas de acción",

      d4_title: "Ejecución Presupuestaria",

      d4_count: "Reportes trimestrales",

      d4_tag: "Transparencia fiscal",
    },
  },

  {
    id: "s8",
    type: "contact",
    visible: true,
    data: {
      title: "Comuníquese con la Mesa",

      phone: "+502 7765-5710 / +502 7968-7633",

      email: "mesadequetzaltenango@gmail.com",

      hours: "Lun – Vie · 8:00 – 17:00 hrs.",
    },
  },
]

export interface FieldDef {
  key: string

  label: string

  type: "text" | "textarea" | "image"

  required?: boolean

  hint?: string

  placeholder?: string
}

export const SECTION_FIELDS: Record<SectionType, FieldDef[]> = {
  hero: [
    {
      key: "eyebrow",
      label: "Texto de identificación",
      type: "text",
      hint: "Aparece encima del título principal (ej. Región Occidente · Guatemala)",
      placeholder: "15 años Construyendo Competitividad Regional",
    },

    {
      key: "title",
      label: "Título principal",
      type: "text",
      required: true,
      placeholder: "Mesa Departamental de Competitividad de Quetzaltenango",
    },

    {
      key: "subtitle",
      label: "Párrafo de introducción",
      type: "textarea",
      required: true,
      placeholder:
        "Fortalecer a Quetzaltenango como nodo regional estratégico...",
    },

    {
      key: "cta1",
      label: "Botón principal (texto)",
      type: "text",
      hint: "Texto del botón dorado",
      placeholder: "Ver iniciativas activas",
    },

    {
      key: "cta2",
      label: "Botón secundario (texto)",
      type: "text",
      placeholder: "Summit de Competitividad 2026",
    },
  ],

  about: [
    {
      key: "title",
      label: "Título de la sección",
      type: "text",
      required: true,
      placeholder:
        "Juntos hacemos del suroccidente un territorio de oportunidades",
    },

    {
      key: "description",
      label: "Descripción principal",
      type: "textarea",
      required: true,
      hint: "Puede ser un párrafo o dos. Se mostrará como texto de cuerpo.",
      placeholder: "Espacio de diálogo y colaboración multisectorial...",
    },
  ],

  conformados: [
    {
      key: "title",
      label: "Título del bloque",
      type: "text",
      required: true,
      hint: "Ej. Conformados por",
      placeholder: "Conformados por",
    },

    {
      key: "subtitle",
      label: "Subtítulo / Descripción",
      type: "textarea",
      hint: "Texto introductorio del bloque (las cifras y totales se calculan dinámicamente según las entidades registradas)",
      placeholder: "Red multisectorial de instituciones aliadas...",
    },
  ],

  timeline: [
    {
      key: "title",
      label: "Título de la sección",
      type: "text",
      required: true,
      placeholder: "Hitos Cronológicos y Congresos Históricos",
    },

    {
      key: "m1_year",
      label: "Hito 1 — año / tiempo",
      type: "text",
      placeholder: "Hace 15 años",
    },

    {
      key: "m1_label",
      label: "Hito 1 — nombre",
      type: "text",
      placeholder: "Fundación / Inicio",
    },

    {
      key: "m1_desc",
      label: "Hito 1 — descripción",
      type: "textarea",
      placeholder:
        "Consolidación y establecimiento de la Mesa como un espacio neutral de concertación...",
    },

    {
      key: "m1_img",
      label: "Hito 1 — imagen (URL)",
      type: "image",
      hint: "Espacio para colocar la imagen deseada del hito histórico",
      placeholder: "https://ejemplo.com/hito1.jpg",
    },

    {
      key: "m2_year",
      label: "Hito 2 — año / tiempo",
      type: "text",
      placeholder: "2013",
    },

    {
      key: "m2_label",
      label: "Hito 2 — nombre",
      type: "text",
      placeholder: "I Congreso",
    },

    {
      key: "m2_desc",
      label: "Hito 2 — descripción",
      type: "textarea",
      placeholder:
        'Celebración del primer congreso bajo el lema "La Competitividad de la Región y sus Desafíos"...',
    },

    {
      key: "m2_img",
      label: "Hito 2 — imagen (URL)",
      type: "image",
      hint: "Espacio para colocar la imagen deseada del hito histórico",
      placeholder: "https://ejemplo.com/hito2.jpg",
    },

    {
      key: "m3_year",
      label: "Hito 3 — año / tiempo",
      type: "text",
      placeholder: "Intermedios",
    },

    {
      key: "m3_label",
      label: "Hito 3 — nombre",
      type: "text",
      placeholder: "II y III Congresos",
    },

    {
      key: "m3_desc",
      label: "Hito 3 — descripción",
      type: "textarea",
      placeholder:
        'Realización del III Congreso de Competitividad titulado "Factores Territoriales..."',
    },

    {
      key: "m3_img",
      label: "Hito 3 — imagen (URL)",
      type: "image",
      hint: "Espacio para colocar la imagen deseada del hito histórico",
      placeholder: "https://ejemplo.com/hito3.jpg",
    },

    {
      key: "m4_year",
      label: "Hito 4 — año / tiempo",
      type: "text",
      placeholder: "2021",
    },

    {
      key: "m4_label",
      label: "Hito 4 — nombre",
      type: "text",
      placeholder: "IV Congreso (Virtual)",
    },

    {
      key: "m4_desc",
      label: "Hito 4 — descripción",
      type: "textarea",
      placeholder:
        "Adaptación y resiliencia institucional con el congreso virtual...",
    },

    {
      key: "m4_img",
      label: "Hito 4 — imagen (URL)",
      type: "image",
      hint: "Espacio para colocar la imagen deseada del hito histórico",
      placeholder: "https://ejemplo.com/hito4.jpg",
    },

    {
      key: "m5_year",
      label: "Hito 5 — año / tiempo",
      type: "text",
      placeholder: "V Congreso",
    },

    {
      key: "m5_label",
      label: "Hito 5 — nombre",
      type: "text",
      placeholder: "Economía Verde",
    },

    {
      key: "m5_desc",
      label: "Hito 5 — descripción",
      type: "textarea",
      placeholder:
        'Enfocado en la temática de "Economía Verde para elevar la competitividad..."',
    },

    {
      key: "m5_img",
      label: "Hito 5 — imagen (URL)",
      type: "image",
      hint: "Espacio para colocar la imagen deseada del hito histórico",
      placeholder: "https://ejemplo.com/hito5.jpg",
    },

    {
      key: "m6_year",
      label: "Hito 6 — año / tiempo",
      type: "text",
      placeholder: "2026",
    },

    {
      key: "m6_label",
      label: "Hito 6 — nombre",
      type: "text",
      placeholder: "VI Congreso / Summit 2026",
    },

    {
      key: "m6_desc",
      label: "Hito 6 — descripción",
      type: "textarea",
      placeholder: 'Summit 2026: "Competitividad para el Suroccidente"...',
    },

    {
      key: "m6_img",
      label: "Hito 6 — imagen (URL)",
      type: "image",
      hint: "Espacio para colocar la imagen deseada del hito histórico",
      placeholder: "https://ejemplo.com/hito6.jpg",
    },
  ],

  news: [
    {
      key: "title",
      label: "Título de la sección",
      type: "text",
      required: true,
      placeholder: "Comunicados y Noticias",
    },

    {
      key: "a1_title",
      label: "Artículo 1 — título",
      type: "text",
      required: true,
      placeholder:
        "Mesa aprueba nuevo corredor logístico con inversión de Q 45 mil",
    },

    {
      key: "a1_category",
      label: "Artículo 1 — categoría",
      type: "text",
      hint: "Ej. Sesión Ordinaria, Informe, Convocatoria",
      placeholder: "Sesión Ordinaria",
    },

    {
      key: "a1_date",
      label: "Artículo 1 — fecha",
      type: "text",
      placeholder: "21 agosto 2026",
    },

    {
      key: "a1_excerpt",
      label: "Artículo 1 — resumen",
      type: "textarea",
      placeholder:
        "La Sesión Ordinaria No. 020 aprobó por unanimidad el expediente técnico del Corredor Logístico del Altiplano Occidental.",
    },

    {
      key: "a1_image",
      label: "Artículo 1 — imagen (URL)",
      type: "image",
      hint: "URL de la foto de portada de la noticia",
      placeholder: "https://ejemplo.com/imagen.jpg",
    },

    {
      key: "a1_content",
      label: "Artículo 1 — contenido completo (lectura)",
      type: "textarea",
      hint: "Texto detallado que se mostrará al hacer clic en la noticia para leerla completa",
      placeholder: "En la reciente sesión de trabajo multisectorial...",
    },

    {
      key: "a2_title",
      label: "Artículo 2 — título",
      type: "text",
      placeholder:
        "Abiertas inscripciones para el Summit de Competitividad 2026 (15 Años)",
    },

    {
      key: "a2_category",
      label: "Artículo 2 — categoría",
      type: "text",
      hint: "Ej. Convocatoria, Informe, Noticia",
      placeholder: "Convocatoria",
    },

    {
      key: "a2_date",
      label: "Artículo 2 — fecha",
      type: "text",
      placeholder: "05 sep 2026",
    },

    {
      key: "a2_excerpt",
      label: "Artículo 2 — resumen",
      type: "textarea",
      placeholder:
        "150 cupos disponibles para conferencias y mesas de trabajo sobre competitividad territorial en Villa L'katos.",
    },

    {
      key: "a2_image",
      label: "Artículo 2 — imagen (URL)",
      type: "image",
      hint: "URL de la foto de portada de la noticia",
      placeholder: "https://ejemplo.com/imagen2.jpg",
    },

    {
      key: "a2_content",
      label: "Artículo 2 — contenido completo (lectura)",
      type: "textarea",
      hint: "Texto detallado que se mostrará al hacer clic en la noticia para leerla completa",
    },

    {
      key: "a3_title",
      label: "Artículo 3 — título",
      type: "text",
      placeholder:
        "Informe de avance Q3 2026: 23 proyectos estratégicos en cartera activa",
    },

    {
      key: "a3_category",
      label: "Artículo 3 — categoría",
      type: "text",
      hint: "Ej. Informe, Proyecto, Sesión",
      placeholder: "Informe",
    },

    {
      key: "a3_date",
      label: "Artículo 3 — fecha",
      type: "text",
      placeholder: "02 sep 2026",
    },

    {
      key: "a3_excerpt",
      label: "Artículo 3 — resumen",
      type: "textarea",
      placeholder:
        "Seguimiento a los proyectos prioritarios para Quetzaltenango como Hub Turístico y Logístico.",
    },

    {
      key: "a3_image",
      label: "Artículo 3 — imagen (URL)",
      type: "image",
      hint: "URL de la foto de portada de la noticia",
      placeholder: "https://ejemplo.com/imagen3.jpg",
    },

    {
      key: "a3_content",
      label: "Artículo 3 — contenido completo (lectura)",
      type: "textarea",
      hint: "Texto detallado que se mostrará al hacer clic en la noticia para leerla completa",
    },

    {
      key: "a4_title",
      label: "Artículo 4 — título",
      type: "text",
      placeholder:
        "Firma de alianza estratégica con universidades del occidente",
    },

    {
      key: "a4_category",
      label: "Artículo 4 — categoría",
      type: "text",
      hint: "Ej. Convenio, Alianza",
      placeholder: "Convenio",
    },

    {
      key: "a4_date",
      label: "Artículo 4 — fecha",
      type: "text",
      placeholder: "18 agosto 2026",
    },

    {
      key: "a4_excerpt",
      label: "Artículo 4 — resumen",
      type: "textarea",
      placeholder:
        "Consorcio universitario impulsará laboratorios de innovación tecnológica...",
    },

    {
      key: "a4_image",
      label: "Artículo 4 — imagen (URL)",
      type: "image",
      hint: "URL de la foto de portada de la noticia",
      placeholder: "https://ejemplo.com/imagen4.jpg",
    },

    {
      key: "a4_content",
      label: "Artículo 4 — contenido completo (lectura)",
      type: "textarea",
      hint: "Texto detallado que se mostrará al hacer clic en la noticia para leerla completa",
    },

    {
      key: "a5_title",
      label: "Artículo 5 — título",
      type: "text",
      placeholder:
        "Lanzamiento del Plan Sostenible para la Cuenca del Río Samalá",
    },

    {
      key: "a5_category",
      label: "Artículo 5 — categoría",
      type: "text",
      hint: "Ej. Medio Ambiente, Sostenibilidad",
      placeholder: "Medio Ambiente",
    },

    {
      key: "a5_date",
      label: "Artículo 5 — fecha",
      type: "text",
      placeholder: "10 agosto 2026",
    },

    {
      key: "a5_excerpt",
      label: "Artículo 5 — resumen",
      type: "textarea",
      placeholder:
        "Iniciativa conjunta para reforestación de mantos freáticos...",
    },

    {
      key: "a5_image",
      label: "Artículo 5 — imagen (URL)",
      type: "image",
      hint: "URL de la foto de portada de la noticia",
      placeholder: "https://ejemplo.com/imagen5.jpg",
    },

    {
      key: "a5_content",
      label: "Artículo 5 — contenido completo (lectura)",
      type: "textarea",
      hint: "Texto detallado que se mostrará al hacer clic en la noticia para leerla completa",
    },

    {
      key: "a6_title",
      label: "Artículo 6 — título",
      type: "text",
      placeholder:
        "Mesa realiza Rueda de Negocios Regional con más de 120 mipymes",
    },

    {
      key: "a6_category",
      label: "Artículo 6 — categoría",
      type: "text",
      hint: "Ej. Comercio, Economía",
      placeholder: "Comercio",
    },

    {
      key: "a6_date",
      label: "Artículo 6 — fecha",
      type: "text",
      placeholder: "28 julio 2026",
    },

    {
      key: "a6_excerpt",
      label: "Artículo 6 — resumen",
      type: "textarea",
      placeholder:
        "Transacciones estimadas por más de Q 12 millones en sectores clave...",
    },

    {
      key: "a6_image",
      label: "Artículo 6 — imagen (URL)",
      type: "image",
      hint: "URL de la foto de portada de la noticia",
      placeholder: "https://ejemplo.com/imagen6.jpg",
    },

    {
      key: "a6_content",
      label: "Artículo 6 — contenido completo (lectura)",
      type: "textarea",
      hint: "Texto detallado que se mostrará al hacer clic en la noticia para leerla completa",
    },
  ],

  event: [
    {
      key: "eyebrow",
      label: "Etiqueta de identificación",
      type: "text",
      hint: "Aparece como pastilla encima del título (ej. Evento Anual 2026)",
      placeholder: "15 Años Construyendo Competitividad Regional",
    },

    {
      key: "name",
      label: "Nombre del evento",
      type: "text",
      required: true,
      placeholder: "Summit de Competitividad Quetzaltenango 2026",
    },

    {
      key: "date",
      label: "Fecha(s)",
      type: "text",
      hint: "Ej. 29 de octubre de 2026",
      placeholder: "29 de octubre de 2026",
    },

    {
      key: "venue",
      label: "Lugar / recinto",
      type: "text",
      placeholder: "Villa L'katos",
    },

    {
      key: "capacity",
      label: "Capacidad",
      type: "text",
      hint: "Ej. 150 personas",
      placeholder: "150 personas",
    },

    {
      key: "speakers",
      label: "Ponentes confirmados",
      type: "text",
      hint: "Ej. +28 confirmados",
      placeholder: "+28 confirmados",
    },

    {
      key: "imageUrl",
      label: "Afiche / Imagen del evento (URL)",
      type: "image",
      required: true,
      hint: "Imagen o banner promocional del evento",
      placeholder: "https://ejemplo.com/evento.jpg",
    },

    {
      key: "description",
      label: "Descripción del evento",
      type: "textarea",
      required: true,
      placeholder:
        "Jornada de conferencias magistrales, mesas de trabajo y networking estratégico...",
    },

    {
      key: "alert_title",
      label: "Aviso destacado — título",
      type: "text",
      hint: "Ej. Registro anticipado",
      placeholder: "Registro anticipado",
    },

    {
      key: "alert_body",
      label: "Aviso destacado — texto",
      type: "textarea",
      placeholder:
        "Complete su pre-registro antes del 25 de octubre de 2026 debido al cupo limitado de 150 personas...",
    },
  ],

  projects: [
    {
      key: "title",
      label: "Título de la sección",
      type: "text",
      required: true,
      placeholder: "Iniciativas en Seguimiento",
    },

    {
      key: "subtitle",
      label: "Descripción breve (eyebrow)",
      type: "text",
      hint: "Aparece en letra pequeña encima del título",
      placeholder: "Panel Ciudadano de Auditoría",
    },
  ],

  documents: [
    {
      key: "title",
      label: "Título de la sección",
      type: "text",
      required: true,
      placeholder: "Documentos y Registros Públicos",
    },

    {
      key: "d1_title",
      label: "Documento 1 — nombre",
      type: "text",
      placeholder: "Actas de Sesión",
    },

    {
      key: "d1_count",
      label: "Documento 1 — cantidad/estado",
      type: "text",
      placeholder: "38 documentos",
    },

    {
      key: "d1_tag",
      label: "Documento 1 — etiqueta",
      type: "text",
      placeholder: "Últimas 24 meses",
    },

    {
      key: "d1_content",
      label: "Documento 1 — texto a exportar en PDF",
      type: "textarea",
      hint: "Texto o contenido oficial que se generará en el archivo PDF exportable",
      placeholder:
        "Acta No. 020-2026. Aprobación unánime del proyecto regional...",
    },

    {
      key: "d1_file",
      label: "Documento 1 — enlace o archivo PDF externo (URL)",
      type: "text",
      hint: "Opcional: enlace a PDF o archivo digital para descarga directa",
      placeholder: "https://ejemplo.com/actas.pdf",
    },

    {
      key: "d2_title",
      label: "Documento 2 — nombre",
      type: "text",
      placeholder: "Informes de Avance",
    },

    {
      key: "d2_count",
      label: "Documento 2 — cantidad/estado",
      type: "text",
      placeholder: "12 informes en 2026",
    },

    {
      key: "d2_tag",
      label: "Documento 2 — etiqueta",
      type: "text",
      placeholder: "Actualización trimestral",
    },

    {
      key: "d2_content",
      label: "Documento 2 — texto a exportar en PDF",
      type: "textarea",
      hint: "Texto o contenido oficial que se generará en el archivo PDF exportable",
    },

    {
      key: "d2_file",
      label: "Documento 2 — enlace o archivo PDF externo (URL)",
      type: "text",
      hint: "Opcional: enlace a PDF o archivo digital para descarga directa",
    },

    {
      key: "d3_title",
      label: "Documento 3 — nombre",
      type: "text",
      placeholder: "Plan de Trabajo 2026",
    },

    {
      key: "d3_count",
      label: "Documento 3 — cantidad/estado",
      type: "text",
      placeholder: "Vigente · Jun 2026",
    },

    {
      key: "d3_tag",
      label: "Documento 3 — etiqueta",
      type: "text",
      placeholder: "6 líneas de acción",
    },

    {
      key: "d3_content",
      label: "Documento 3 — texto a exportar en PDF",
      type: "textarea",
      hint: "Texto o contenido oficial que se generará en el archivo PDF exportable",
    },

    {
      key: "d3_file",
      label: "Documento 3 — enlace o archivo PDF externo (URL)",
      type: "text",
      hint: "Opcional: enlace a PDF o archivo digital para descarga directa",
    },

    {
      key: "d4_title",
      label: "Documento 4 — nombre",
      type: "text",
      placeholder: "Ejecución Presupuestaria",
    },

    {
      key: "d4_count",
      label: "Documento 4 — cantidad/estado",
      type: "text",
      placeholder: "Reportes trimestrales",
    },

    {
      key: "d4_tag",
      label: "Documento 4 — etiqueta",
      type: "text",
      placeholder: "Transparencia fiscal",
    },

    {
      key: "d4_content",
      label: "Documento 4 — texto a exportar en PDF",
      type: "textarea",
      hint: "Texto o contenido oficial que se generará en el archivo PDF exportable",
    },

    {
      key: "d4_file",
      label: "Documento 4 — enlace o archivo PDF externo (URL)",
      type: "text",
      hint: "Opcional: enlace a PDF o archivo digital para descarga directa",
    },
  ],

  contact: [
    {
      key: "title",
      label: "Título de la sección",
      type: "text",
      required: true,
    },

    { key: "phone", label: "Teléfono", type: "text" },

    { key: "email", label: "Correo electrónico", type: "text" },

    {
      key: "hours",
      label: "Horario de atención",
      type: "text",
      hint: "Ej. Lun – Vie · 8:00 – 17:00 hrs.",
    },
  ],

  cta: [
    { key: "eyebrow", label: "Texto de identificación", type: "text" },

    { key: "title", label: "Título", type: "text", required: true },

    { key: "subtitle", label: "Descripción", type: "textarea" },

    { key: "button", label: "Texto del botón", type: "text", required: true },
  ],

  stats: [
    { key: "title", label: "Título de la sección (opcional)", type: "text" },

    { key: "s1_value", label: "Indicador 1 — cifra", type: "text" },
    { key: "s1_label", label: "Indicador 1 — descripción", type: "text" },

    { key: "s2_value", label: "Indicador 2 — cifra", type: "text" },
    { key: "s2_label", label: "Indicador 2 — descripción", type: "text" },

    { key: "s3_value", label: "Indicador 3 — cifra", type: "text" },
    { key: "s3_label", label: "Indicador 3 — descripción", type: "text" },

    { key: "s4_value", label: "Indicador 4 — cifra", type: "text" },
    { key: "s4_label", label: "Indicador 4 — descripción", type: "text" },
  ],

  custom: [
    {
      key: "title",
      label: "Título del apartado",
      type: "text",
      required: true,
      hint: "Ej. Juegos Nacionales 2026",
    },

    {
      key: "subtitle",
      label: "Subtítulo / Categoría",
      type: "text",
      hint: "Ej. Iniciativa Deportiva Regional",
    },

    {
      key: "description",
      label: "Contenido principal",
      type: "textarea",
      required: true,
      hint: "Describa la información del nuevo apartado",
    },

    {
      key: "imageUrl",
      label: "Imagen destacada (URL)",
      type: "image",
      required: true,
      hint: "Ingrese la URL de la imagen requerida para este apartado",
    },

    {
      key: "cta",
      label: "Texto de enlace / Botón",
      type: "text",
      hint: "Ej. Más información",
    },
  ],
}
