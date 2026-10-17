import React, { useState, useEffect } from "react"
import { Role, Tab } from "../../../types/admin"
import { useCountdown } from "../../../hooks/useCountdown"
import { getMeetings, getMinutes, getProjects, type MeetingRecord } from "../../../api/admin"
import {
  ChevronRightIcon,
  CalIcon,
  PlusIcon,
} from "../../../components/icons/AdminIcons"

interface OverviewTabProps {
  role: Role
  setTab: (t: Tab) => void
}

function parseMeetingTimestamp(meeting: MeetingRecord): number {
  return new Date(meeting.scheduled_at).getTime()
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ role, setTab }) => {
  const [now, setNow] = useState<number>(Date.now())

  // Actualizar reloj cada segundo para detectar vencimiento de reuniones automáticamente
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [projects, setProjects] = useState<Awaited<ReturnType<typeof getProjects>>>([])
  const [activeProjectsCount, setActiveProjectsCount] = useState("—")
  const [pendingMinutesCount, setPendingMinutesCount] = useState("—")

  useEffect(() => {
    let active = true
    Promise.all([getMeetings(), getProjects(), getMinutes()]).then(([meetingRows, projectRows, minutes]) => {
      if (!active) return
      setMeetings(meetingRows)
      setProjects(projectRows)
      setActiveProjectsCount(String(projectRows.filter((project) => project.status === "activo").length))
      setPendingMinutesCount(String(minutes.filter((minute) => minute.status === "draft").length))
    }).catch(() => {
      if (active) {
        setMeetings([])
        setProjects([])
        setActiveProjectsCount("—")
        setPendingMinutesCount("—")
      }
    })
    return () => { active = false }
  }, [])

  // Filtrar estrictamente las reuniones que están programadas Y cuya fecha/hora aún no ha ocurrido
  const validUpcoming = meetings
    .filter((meeting) => new Date(meeting.scheduled_at).getTime() >= now)
    .map((m) => ({ m, ts: parseMeetingTimestamp(m) }))
    .filter(({ ts }) => !isNaN(ts) && ts > now)
    .sort((a, b) => a.ts - b.ts)

  // Si una reunión pasa, automáticamente toma la siguiente más próxima
  const nextMeeting = validUpcoming.length > 0 ? validUpcoming[0].m : null
  const targetDateStr =
    validUpcoming.length > 0
      ? new Date(validUpcoming[0].ts).toISOString()
      : undefined

  const countdown = useCountdown(targetDateStr)

  const kpis = [
    {
      label: "Proyectos Activos",
      value: activeProjectsCount,
      delta: "En desarrollo",
      accent: "text-navy-700",
      bg: "bg-navy-50 border-navy-200",
    },
    {
      label: "Pre-registros Summit",
      value: "—",
      delta: "No conectado al servidor",
      accent: "text-celeste-600",
      bg: "bg-celeste-50 border-celeste-300",
    },
    {
      label: "Actas Pendientes",
      value: pendingMinutesCount,
      delta: "Borradores en el servidor",
      accent: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
    },
    {
      label: "Próximas Reuniones",
      value: String(validUpcoming.length),
      delta: validUpcoming.length > 0 ? "En calendario" : "Sin pendientes",
      accent: validUpcoming.length > 0 ? "text-green-700" : "text-slate-500",
      bg: "bg-green-50 border-green-200",
    },
  ]

  const projectStatuses = [
    { label: "En ejecución", key: "activo", color: "bg-navy-600" },
    { label: "Completados", key: "completado", color: "bg-green-500" },
    { label: "Borradores", key: "borrador", color: "bg-amber-500" },
    { label: "Pausados", key: "pausado", color: "bg-slate-400" },
  ].map((status) => ({ ...status, count: projects.filter((project) => project.status === status.key).length }))
  const projectStatusTotal = projectStatuses.reduce((total, status) => total + status.count, 0)
  const budgetTotal = projects.reduce((total, project) => total + (Number(project.budgetAmount) || 0), 0)

  return (
    <div className="space-y-6 animate-fadeup">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.bg}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {k.label}
            </p>
            <p
              style={{ fontFamily: "var(--font-display)" }}
              className={`text-4xl font-normal ${k.accent}`}
            >
              {k.value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{k.delta}</p>
          </div>
        ))}
      </div>

      {/* Countdown KPI */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
        {nextMeeting ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <p className="text-[11px] font-bold text-navy-700 uppercase tracking-wider mb-0.5">
                  Próxima Reunión Oficial
                </p>
                <p className="text-slate-800 font-semibold text-xs sm:text-sm">
                  {nextMeeting.title} — {new Date(nextMeeting.scheduled_at).toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-navy-800 bg-navy-50 border border-navy-100 px-3 py-1 rounded-full self-start sm:self-auto">
                {nextMeeting.location || "Lugar por confirmar"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
              {[
                { v: countdown.days, l: "días" },
                { v: countdown.hours, l: "horas" },
                { v: countdown.minutes, l: "minutos" },
                { v: countdown.seconds, l: "segundos" },
              ].map(({ v, l }) => (
                <div
                  key={l}
                  className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 text-center transition-all hover:border-slate-300"
                >
                  <p
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-navy-900 text-2xl sm:text-3xl font-extrabold leading-none tabular-nums"
                  >
                    {String(v).padStart(2, "0")}
                  </p>
                  <p className="text-slate-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1.5">
                    {l}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-navy-900/60 border border-navy-800 rounded-xl p-6 sm:p-7 text-center my-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-400">
              <CalIcon className="w-6 h-6" />
            </div>
            <p className="text-amber-400 font-bold text-base sm:text-lg">
              No hay reuniones programadas
            </p>
            <p className="text-navy-300 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Actualmente no existen sesiones pendientes en el calendario
              oficial de la Mesa de Competitividad.
            </p>
            <button
              onClick={() => setTab("meetings")}
              className="mt-4 inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-celeste-400 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-navy-700 cursor-pointer shadow-sm"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Programar Nueva Reunión
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-navy-900 text-sm">
              Actividad Reciente
            </h3>
            <span className="text-xs text-slate-400">Últimas 48 h</span>
          </div>
          <p className="px-5 py-6 text-sm text-slate-500">No hay actividad reciente disponible.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-navy-900 text-sm">
                Ejecución Presupuestaria
              </h3>
              <span
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-xs text-navy-600 font-semibold"
              >
                {budgetTotal ? `Q ${budgetTotal.toLocaleString("es-GT")}` : "Sin presupuesto registrado"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {projects.length} proyectos cargados desde el servidor
            </p>
            <p className="mt-4 text-sm text-slate-500">El API todavía no registra avances presupuestarios ni históricos.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-navy-900 text-sm mb-4">
              Estado de Proyectos
            </h3>
            <div className="space-y-2.5">
              {projectStatuses.map(({ label, color, count }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`}
                  />
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${projectStatusTotal ? (count / projectStatusTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-4 text-right">
                    {count}
                  </span>
                  <span className="text-xs text-slate-400 w-20 truncate">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-navy-900 text-sm mb-3">
              Acceso Rápido
            </h3>
            <div className="space-y-0.5">
              {[
                ["Programar reunión", "meetings"],
                ["Nueva propuesta", "proposals"],
                ["Editar sitio web", "site"],
                ["Generar acta", "minutes"],
              ].map(([l, t]) => (
                <button
                  key={l}
                  onClick={() => setTab(t as Tab)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-50 text-sm text-navy-700 transition-colors"
                >
                  {l}
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewTab
