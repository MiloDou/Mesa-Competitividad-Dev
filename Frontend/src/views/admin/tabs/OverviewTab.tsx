import React from "react";
import { Role, Tab, AdminMeeting } from "../../../types/admin";
import { ADMIN_MEETINGS } from "../../../data/admin";
import { useCountdown } from "../../../hooks/useCountdown";
import { ChevronRightIcon } from "../../../components/icons/AdminIcons";

interface OverviewTabProps {
  role: Role;
  setTab: (t: Tab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ role, setTab }) => {
  // Find the next upcoming meeting based on status
  const upcomingMeetings = ADMIN_MEETINGS.filter((m: AdminMeeting) => m.status === "upcoming");
  const nextMeeting = upcomingMeetings.length > 0 ? upcomingMeetings[0] : null;

  // Derive target date string ISO for countdown matching the next upcoming meeting exactly
  const targetDateStr = nextMeeting
    ? nextMeeting.targetDate || "2026-09-18T09:00:00-06:00"
    : undefined;

  const countdown = useCountdown(targetDateStr);

  const kpis = [
    { label: "Proyectos Activos", value: "23", delta: "+2 este mes", accent: "text-navy-700", bg: "bg-navy-50 border-navy-200" },
    { label: "Pre-registros Summit", value: "147", delta: "+23 esta semana", accent: "text-celeste-600", bg: "bg-celeste-50 border-celeste-300" },
    { label: "Actas Pendientes", value: "2", delta: "Por finalizar", accent: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { label: "Próximas Reuniones", value: String(upcomingMeetings.length), delta: "En seguimiento", accent: "text-green-700", bg: "bg-green-50 border-green-200" },
  ];

  const activity = [
    { who: "S. Ortiz", action: "actualizó avance", target: "PRY-004 a 18%", t: "2h", type: "edit" },
    { who: "M. Fuentes", action: "publicó", target: "Informe Avance Q3 2026", t: "5h", type: "publish" },
    { who: "C. Montúfar", action: "abrió propuesta", target: "P-003 Convenio BANGUAT", t: "6h", type: "vote" },
    { who: "C. Montúfar", action: "programó reunión", target: "REU-022 Mesa Infraestructura", t: "1d", type: "meeting" },
    { who: "A. Hernández", action: "aprobó el acta", target: "REU-020 Sesión Ordinaria", t: "1d", type: "approve" },
    { who: "R. Ajú", action: "editó sección", target: "Sitio Web — Noticias", t: "2d", type: "site" },
  ];

  const bars = [52, 38, 71, 44, 89, 63, 78, 55, 92, 67, 84, 96];
  const bMax = Math.max(...bars);

  return (
    <div className="space-y-6 animate-fadeup">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.bg}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{k.label}</p>
            <p style={{ fontFamily: "var(--font-display)" }} className={`text-4xl font-normal ${k.accent}`}>
              {k.value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{k.delta}</p>
          </div>
        ))}
      </div>

      {/* Countdown KPI */}
      <div className="bg-navy-950 rounded-xl border border-navy-800 p-4 sm:p-5">
        {nextMeeting ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <p className="text-xs font-semibold text-celeste-400 uppercase tracking-wide mb-0.5">Próxima Reunión</p>
                <p className="text-white font-semibold text-xs sm:text-sm">
                  {nextMeeting.title} — {nextMeeting.date} · {nextMeeting.time} hrs
                </p>
              </div>
              <span className="text-[10px] sm:text-xs text-navy-400 bg-navy-800 px-2.5 py-1 rounded-full self-start sm:self-auto">{nextMeeting.loc}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { v: countdown.days, l: "días" },
                { v: countdown.hours, l: "horas" },
                { v: countdown.minutes, l: "minutos" },
                { v: countdown.seconds, l: "segundos" },
              ].map(({ v, l }) => (
                <div key={l} className="bg-navy-900 border border-navy-800 rounded-xl p-2.5 sm:p-3 text-center">
                  <p
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-celeste-400 text-2xl sm:text-3xl font-bold leading-none tabular-nums"
                  >
                    {String(v).padStart(2, "0")}
                  </p>
                  <p className="text-navy-500 text-[9px] sm:text-[10px] uppercase tracking-widest mt-1">{l}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-center my-2">
            <p className="text-amber-400 font-bold text-base">No hay reuniones programadas</p>
            <p className="text-navy-300 text-xs mt-1">Actualmente no existen sesiones pendientes en el calendario oficial.</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-navy-900 text-sm">Actividad Reciente</h3>
            <span className="text-xs text-slate-400">Últimas 48 h</span>
          </div>
          <div className="divide-y divide-slate-50">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/40 transition-colors">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 ${
                    a.type === "publish"
                      ? "bg-green-100 text-green-700"
                      : a.type === "meeting"
                      ? "bg-celeste-100 text-celeste-700"
                      : a.type === "approve"
                      ? "bg-navy-100 text-navy-700"
                      : a.type === "vote"
                      ? "bg-purple-100 text-purple-700"
                      : a.type === "site"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {a.who.split(".")[0].trim()[0]}
                  {a.who.split(" ")[1][0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-navy-800">{a.who}</span> {a.action}{" "}
                    <span className="text-navy-600">{a.target}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">hace {a.t}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-navy-900 text-sm">Ejecución Presupuestaria</h3>
              <span style={{ fontFamily: "var(--font-mono)" }} className="text-xs text-navy-600 font-semibold">
                Q 287M total
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Cartera activa · Oct 2025 – Sep 2026</p>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                ["Q 194.9M", "67.9%", "Ejecutado", "text-green-700", "bg-green-50 border-green-200"],
                ["Q 70.2M", "24.5%", "En proceso", "text-navy-700", "bg-navy-50 border-navy-200"],
                ["Q 21.9M", "7.6%", "Pendiente", "text-amber-600", "bg-amber-50 border-amber-200"],
              ].map(([amt, pct, lbl, tc, bg]) => (
                <div key={lbl as string} className={`border rounded-xl p-2.5 text-center ${bg}`}>
                  <p style={{ fontFamily: "var(--font-mono)" }} className={`text-xs font-bold ${tc}`}>
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
                    className={`rounded-sm transition-all ${i === bars.length - 1 ? "bg-navy-700" : "bg-navy-200"}`}
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
            <h3 className="font-semibold text-navy-900 text-sm mb-4">Estado de Proyectos</h3>
            <div className="space-y-2.5">
              {[
                ["En Ejecución", "bg-navy-600", 15],
                ["Completados", "bg-green-500", 5],
                ["Planificación", "bg-amber-500", 2],
                ["Revisión", "bg-slate-400", 1],
              ].map(([l, c, n]) => (
                <div key={l as string} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c as string}`} />
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c as string}`} style={{ width: `${((n as number) / 23) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-4 text-right">{n as number}</span>
                  <span className="text-xs text-slate-400 w-20 truncate">{l as string}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-navy-900 text-sm mb-3">Acceso Rápido</h3>
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
  );
};

export default OverviewTab;
