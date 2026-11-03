export const STATUS_MAP: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-600", label: "En ejecución" },
  paused: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-600", label: "En pausa" },
  completed: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500", label: "Completado" },
  draft: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500", label: "Borrador" },
  archived: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500", label: "Archivado" },
  "en curso": { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-600", label: "En ejecución" },
  "en ejecución": { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-600", label: "En ejecución" },
  "en pausa": { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-600", label: "En pausa" },
  completado: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500", label: "Completado" },
};
