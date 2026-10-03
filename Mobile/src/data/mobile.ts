import { Meeting, Proposal, Notif } from "../types/mobile";

export const MOBILE_MEETINGS: Meeting[] = [
  { id:"REU-021", title:"Sesión Ordinaria", subtitle:"No. 021 / 2026",
    date:"18 Sep 2026", dateNum:"18", dateMonth:"Sep",
    time:"9:00 AM", loc:"Sala de Sesiones, CUNOC", virtual:false, urgent:true,
    agenda:["Lectura y aprobación del acta anterior","Informe de avance PRY-001 Corredor Logístico","Votación: Plan Operativo 2027","Puntos varios"] },
  { id:"REU-022", title:"Mesa de Trabajo", subtitle:"Infraestructura",
    date:"25 Sep 2026", dateNum:"25", dateMonth:"Sep",
    time:"2:00 PM", loc:"Virtual — Zoom", virtual:true, urgent:false,
    agenda:["Revisión de avance PRY-001","Propuestas de conectividad vial","Coordinación con Ministerio de Comunicaciones"] },
  { id:"REU-023", title:"Comisión Especial", subtitle:"Zona Económica",
    date:"2 Oct 2026", dateNum:"2", dateMonth:"Oct",
    time:"10:00 AM", loc:"AGEXPORT Xela", virtual:false, urgent:false,
    agenda:["Revisión de factibilidad PRY-004","Consulta con expertos ZEE"] },
];

export const MEETINGS = MOBILE_MEETINGS;

export const MOBILE_PROPOSALS: Proposal[] = [
  { id:"P-001",
    title:"Aprobación del Plan Operativo Anual 2027",
    desc:"Aprobación del POA 2027 incluyendo presupuesto de Q 4.2 millones y 8 líneas de acción prioritarias.",
    category:"Planificación", deadline:"18 Sep 2026",
    favor:8, contra:2, abstencion:1, total:14 },
  { id:"P-002",
    title:"Incorporación de nuevas gremiales",
    desc:"Propuesta para incorporar 3 nuevas gremiales: Asociación de Hoteles, Cámara de Minoristas, y Emprendedores Juveniles.",
    category:"Membresía", deadline:"25 Sep 2026",
    favor:5, contra:1, abstencion:2, total:14 },
];

export const PROPOSALS = MOBILE_PROPOSALS;

export const NOTIFS: Notif[] = [
  { id:1, title:"Sesión Ordinaria mañana",     body:"Recuerde la Sesión No. 021 es mañana a las 9:00 AM en CUNOC.",      time:"Hace 2 h",  type:"meeting", unread:true  },
  { id:2, title:"Nueva propuesta para votar",  body:"Se ha publicado la propuesta P-002 para su votación.",               time:"Hace 5 h",  type:"vote",    unread:true  },
  { id:3, title:"Acta REU-020 publicada",       body:"El acta de la Sesión Ordinaria No. 020 ya está disponible.",        time:"Ayer",      type:"doc",     unread:false },
  { id:4, title:"Recordatorio de reunión",      body:"Mesa de Trabajo — Infraestructura el 25 de septiembre a las 2 PM.", time:"Hace 2 d",  type:"meeting", unread:false },
];
