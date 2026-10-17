import React, { useState, useEffect } from "react"
import { Role, Tab, AdminMeeting } from "../../../types/admin"
import { ADMIN_MEETINGS } from "../../../data/admin"
import { useCountdown } from "../../../hooks/useCountdown"
import { useSyncedStorage } from "../../../hooks/useSyncedStorage"
import { getRecentAuditEvents, type AuditEventRecord } from "../../../api/admin"
import {
  ChevronRightIcon,
  CalIcon,
  PlusIcon,
} from "../../../components/icons/AdminIcons"

interface OverviewTabProps {
  role: Role
  setTab: (t: Tab) => void
}

function parseMeetingTimestamp(m: AdminMeeting): number {
  // ISO 8601 targetDate directo (prioridad principal)
  if (m.targetDate) {
    const t = new Date(m.targetDate).getTime()
    if (!isNaN(t)) return t
  }
  // Fecha estructurada YYYY-MM-DD
  if (m.date && m.date.includes("-")) {
    const startTime = m.time ? m.time.split(" – ")[0].trim() : "09:00"
    const t = new Date(`${m.date}T${startTime}:00`).getTime()
    if (!isNaN(t)) return t
  }
  // Respaldo para fechas en texto libre ("15 oct 2026")
  if (m.date) {
    const months: Record<string, string> = {
      ene: "01",
      feb: "02",
      mar: "03",
      abr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      ago: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dic: "12",
    }
    const parts = m.date.toLowerCase().replace(/,/g, "").split(/\s+/)
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, "0")
      const mStr = parts[1].slice(0, 3)
      const month = months[mStr] || "10"
      const year = parts[2]
      const startTime = m.time
        ? m.time
            .split(" – ")[0]
            .replace(/[^\d:]/g, "")
            .trim()
        : "09:00"
      const t = new Date(`${year}-${month}-${day}T${startTime}:00`).getTime()
      if (!isNaN(t)) return t
    }
  }
  return NaN
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ role, setTab }) => {
  const [now, setNow] = useState<number>(Date.now())
  const [activity, setActivity] = useState<AuditEventRecord[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState("")

  // Actualizar reloj cada segundo para detectar vencimiento de reuniones automáticamente
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    getRecentAuditEvents()
      .then((events) => {
        if (active) setActivity(events)
      })
      .catch((error: unknown) => {
        if (active) setActivityError(error instanceof Error ? error.message : "No se pudo cargar la actividad.")
      })
      .finally(() => {
        if (active) setActivityLoading(false)
      })
    return () => { active = false }
  }, [])

  // Cargar reuniones desde localStorage sincronizadas reactivamente con MeetingsTab
  const [meetings] = useSyncedStorage<AdminMeeting[]>(
    "mesa_admin_reuniones",
    ADMIN_MEETINGS,
    {
      eventName: "mesa_reuniones_updated",
      validate: (val) => Array.isArray(val) && val.length > 0,
    },
  )

  // Filtrar estrictamente las reuniones que están programadas Y cuya fecha/hora aún no ha ocurrido
  const validUpcoming = meetings
    .filter((m: AdminMeeting) => m.status === "upcoming")
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

  const activeProjectsCount = (() => {
    if (typeof window === "undefined") return "6"
    const saved = localStorage.getItem("site_projects")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return String(parsed.filter((p: any) => p.status === "activo").length)
        }
      } catch (e) {}
    }
    return "6"
  })()

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
      value: "147",
      delta: "+23 esta semana",
      accent: "text-celeste-600",
      bg: "bg-celeste-50 border-celeste-300",
    },
    {
      label: "Actas Pendientes",
      value: "2",
      delta: "Por finalizar",
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

  const recentActivity = activity
    .filter((event) => {
      const timestamp = Date.parse(event.created_at)
      return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= 48 * 60 * 60 * 1000
    })
    .slice(0, 6)

  const relativeTime = (createdAt: string) => {
    const minutes = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60_000))
    if (minutes < 1) return "ahora"
    if (minutes < 60) return `hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `hace ${hours} h`
    return `hace ${Math.floor(hours / 24)} d`
  }

  const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SI"

  const bars = [52, 38, 71, 44, 89, 63, 78, 55, 92, 67, 84, 96]
  const bMax = Math.max(...bars)

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
                  {nextMeeting.title} — {nextMeeting.date} · {nextMeeting.time}{" "}
                  hrs
                </p>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-navy-800 bg-navy-50 border border-navy-100 px-3 py-1 rounded-full self-start sm:self-auto">
                {nextMeeting.loc}
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
          <div className="divide-y divide-slate-50">
            {activityLoading ? <p className="px-5 py-6 text-sm text-slate-500">Cargando actividad del sistema…</p> : activityError ? <p role="alert" className="px-5 py-6 text-sm text-amber-800">{activityError}</p> : recentActivity.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">No hay actividad registrada en las últimas 48 horas.</p> : recentActivity.map((event) => {
              const actor = event.actor_name || "Sistema"
              const objectType = event.object_type.split(".").pop()?.split("_").join(" ") || "registro"
              return (
              <div
                key={event.id}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/40 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 bg-navy-100 text-navy-700"
                >
                  {initials(actor)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-navy-800">{actor}</span>{" "}
                    {event.summary || event.action.split(".").join(" ")} <span className="text-navy-600">{objectType} #{event.object_id}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{relativeTime(event.created_at)}</p>
                </div>
              </div>
            )})}
          </div>
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
                Q 287M total
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Cartera activa · Oct 2025 – Sep 2026
            </p>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                [
                  "Q 194.9M",
                  "67.9%",
                  "Ejecutado",
                  "text-green-700",
                  "bg-green-50 border-green-200",
                ],
                [
                  "Q 70.2M",
                  "24.5%",
                  "En proceso",
                  "text-navy-700",
                  "bg-navy-50 border-navy-200",
                ],
                [
                  "Q 21.9M",
                  "7.6%",
                  "Pendiente",
                  "text-amber-600",
                  "bg-amber-50 border-amber-200",
                ],
              ].map(([amt, pct, lbl, tc, bg]) => (
                <div
                  key={lbl as string}
                  className={`border rounded-xl p-2.5 text-center ${bg}`}
                >
                  <p
                    style={{ fontFamily: "var(--font-mono)" }}
                    className={`text-xs font-bold ${tc}`}
                  >
                    {pct}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
            {/* Stacked bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 mb-1">
              <div className="bg-green-500 h-full" style={{ width: "67.9%" }} />
              <div className="bg-navy-400 h-full" style={{ width: "24.5%" }} />
              <div className="bg-amber-400 h-full" style={{ width: "7.6%" }} />
            </div>
            <div className="flex items-end gap-1 h-14 mt-3">
              {bars.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <div
                    className={`rounded-sm transition-all ${
                      i === bars.length - 1 ? "bg-navy-700" : "bg-navy-200"
                    }`}
                    style={{ height: `${(v / bMax) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
              <span>Oct 2025</span>
              <span>Sep 2026</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-navy-900 text-sm mb-4">
              Estado de Proyectos
            </h3>
            <div className="space-y-2.5">
              {[
                ["En Ejecución", "bg-navy-600", 15],
                ["Completados", "bg-green-500", 5],
                ["Planificación", "bg-amber-500", 2],
                ["Revisión", "bg-slate-400", 1],
              ].map(([l, c, n]) => (
                <div key={l as string} className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${c as string}`}
                  />
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c as string}`}
                      style={{ width: `${(n as number / 23) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-4 text-right">
                    {n as number}
                  </span>
                  <span className="text-xs text-slate-400 w-20 truncate">
                    {l as string}
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
