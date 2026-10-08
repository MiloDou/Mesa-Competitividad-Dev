import React, { useState, useEffect } from "react";
import { AgendaActivity } from "../../../types/public";
import { fetchAgendaActivities } from "../../../services/agendaService";
import { CalSvg, PinSvg, ClockIcon } from "../../../components/icons/PublicIcons";

interface AgendaSectionProps {
  onSelectActivity: (activity: AgendaActivity) => void;
}

export const AgendaSection: React.FC<AgendaSectionProps> = ({ onSelectActivity }) => {
  const [activities, setActivities] = useState<AgendaActivity[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadAgenda = async (options?: { error?: boolean; empty?: boolean }) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const data = await fetchAgendaActivities({
        simulateError: options?.error,
        simulateEmpty: options?.empty,
      });

      if (data.length === 0) {
        setStatus("empty");
        setActivities([]);
      } else {
        setActivities(data);
        setStatus("success");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "No se pudo cargar la agenda de actividades.");
    }
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  return (
    <section id="agenda" className="py-6 lg:py-10 bg-slate-50 text-slate-700 relative overflow-hidden border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        
        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-navy-100 border border-navy-200 rounded-full px-3.5 py-1 mb-3">
              <span className="w-2 h-2 bg-gold-500 rounded-full" />
              <span className="text-navy-900 text-xs font-bold uppercase tracking-wider">Próximos Eventos y Sesiones</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-navy-950 tracking-tight">
              Agenda de <span className="text-gold-600">Actividades</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Consulte la programación oficial de reuniones de comisiones, foros regionales y sesiones plenarias de la Mesa de Competitividad.
            </p>
          </div>
        </div>

        {/* ESTADO DE CARGA */}
        {status === "loading" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-6 bg-slate-200 rounded-full w-20" />
                </div>
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="pt-4 flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-10 bg-slate-200 rounded-xl w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ESTADO VACÍO */}
        {status === "empty" && (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center max-w-lg mx-auto my-6 animate-fadeup">
            <div className="w-16 h-16 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalSvg />
            </div>
            <h3 className="text-xl font-bold text-navy-950 mb-2">No hay actividades programadas</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              En este momento no se encuentran reuniones ni eventos agendados en el sistema. Vuelva a consultar más tarde.
            </p>
            <button
              onClick={() => loadAgenda()}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md min-h-[44px]"
            >
              Actualizar Agenda
            </button>
          </div>
        )}

        {/* ESTADO DE ERROR */}
        {status === "error" && (
          <div className="bg-red-50 rounded-3xl p-8 border border-red-200 text-center max-w-lg mx-auto my-6 animate-fadeup">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-950 mb-2">Error al cargar la agenda</h3>
            <p className="text-red-700 text-sm leading-relaxed mb-6">{errorMessage}</p>
            <button
              onClick={() => loadAgenda()}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md min-h-[44px]"
            >
              Reintentar Conexión
            </button>
          </div>
        )}

        {/* ESTADO EXITOSO: LISTADO DE ACTIVIDADES */}
        {status === "success" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-gold-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.id}
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        item.modality === "Virtual"
                          ? "bg-celeste-100 text-celeste-800"
                          : item.modality === "Híbrida"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gold-100 text-gold-900"
                      }`}
                    >
                      {item.modality}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-navy-950 mb-2 group-hover:text-gold-600 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <div className="space-y-2 mt-4 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 text-gold-600 flex-shrink-0"><CalSvg /></div>
                      <span className="font-semibold text-navy-900">{item.date}</span>
                      <span className="text-slate-400">•</span>
                      <ClockIcon className="w-4 h-4 text-gold-600 flex-shrink-0" />
                      <span>{item.time}</span>
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <div className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"><PinSvg /></div>
                      <span className="line-clamp-1">{item.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400 hidden sm:inline font-medium">
                    {item.agendaTopics ? `${item.agendaTopics.length} puntos en agenda` : "Detalles disponibles"}
                  </span>
                  <button
                    onClick={() => onSelectActivity(item)}
                    className="w-full sm:w-auto bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-sm group-hover:bg-gold-500 group-hover:text-navy-950 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Ver Detalle</span>
                    <span className="text-sm">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
