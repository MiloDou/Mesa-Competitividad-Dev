import React from "react";
import { RegForm } from "../../../types/public";
import { CalSvg, PinSvg, UsersSvg } from "../../../components/icons/PublicIcons";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import type { PublicEventRecord } from "../../../api/client";

function field(err: boolean) {
  return `input text-sm focus-visible:ring-2 focus-visible:ring-navy-800 focus-visible:outline-none transition-all ${err ? "border-brand-red bg-red-50/50 focus:border-brand-red focus:ring-red-900/40" : ""}`;
}

function Field({ label, error, dark, children }: { label:string; error?:boolean; dark?:boolean; children:React.ReactNode }) {
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-navy-300" : error ? "text-brand-red" : "text-slate-600"}`}>{label}</label>
      {children}
    </div>
  );
}

interface EventSectionProps {
  event?: PublicEventRecord;
  eventsLoaded?: boolean;
  regForm: RegForm;
  setRegForm: React.Dispatch<React.SetStateAction<RegForm>>;
  regStatus: "idle" | "loading" | "success" | "error";
  regTouched: Set<string>;
  touch: (k: string) => void;
  regInvalid: (k: keyof RegForm) => boolean;
  submitReg: (e: React.FormEvent) => void;
}

export default function EventSection({
  event,
  eventsLoaded = false,
  regForm,
  setRegForm,
  regStatus,
  regTouched,
  touch,
  regInvalid,
  submitReg,
}: EventSectionProps) {
  if (eventsLoaded && !event) return (
    <section id="summit-2026" className="bg-gray-50 py-20 border-t border-gray-200">
      <div className="mx-auto max-w-screen-xl px-5 text-center text-slate-600">No hay eventos publicados que acepten inscripciones por el momento.</div>
    </section>
  );

  return (
    <section id="summit-2026" className="relative overflow-hidden bg-gray-50 py-24 border-t border-gray-200">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gold-50/50" />

      <div className="relative max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-14 items-start">

          {/* Left: summit info */}
          <div className="reveal-left">
            <div className="inline-flex items-center gap-2 bg-gold-100 border border-gold-300 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
              <span className="text-gold-800 text-xs font-bold tracking-wider uppercase">Evento Anual 2026</span>
            </div>

            <h2 className="text-navy-950 text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-6">
              {event ? event.title : <>Summit de<br/><span className="text-gold-600">Competitividad</span><br/>Quetzaltenango 2026</>}
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-xl font-normal">
              {event?.description || "Dos días de conferencias magistrales, mesas de trabajo y networking estratégico para construir juntos la hoja de ruta de la competitividad regional."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[
                { label:"Fecha",     val:event ? new Date(event.starts_at).toLocaleDateString("es-GT", { dateStyle: "long" }) : "14–15 Nov 2026",          icon:<CalSvg/> },
                { label:"Lugar",     val:event?.location || "Hotel Intercontinental Xela", icon:<PinSvg/> },
              { label:"Capacidad", val:event?.capacity ? `${event.capacity} participantes` : "Sin límite publicado", icon:<UsersSvg/> },
              ].map(d => (
                <div key={d.label} className="card-lift bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="w-6 h-6 text-gold-600 mb-2">{d.icon}</div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide font-bold">{d.label}</p>
                  <p className="text-navy-950 font-bold text-sm mt-1 leading-snug">{d.val}</p>
                </div>
              ))}
            </div>

          </div>

          {/* Right: form */}
          <div className="reveal-right bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-navy-900 px-6 py-6 border-b border-navy-800">
              <h3 className="text-white text-xl font-bold">Pre-registro al Summit</h3>
              <p className="text-gold-400 text-xs mt-1 font-semibold">Complete el formulario para reservar su lugar.</p>
            </div>

            {regStatus === "success" ? (
              <div className="p-8 text-center animate-fadeup">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h4 className="text-brand-dark text-2xl font-bold mb-2">¡Pre-registro exitoso!</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Su inscripción para <strong className="text-navy-950">{event?.title}</strong> quedó registrada con el correo <strong className="text-navy-950">{regForm.correo}</strong>.
                </p>
                <button onClick={() => { setRegForm({ nombre:"", apellidos:"", correo:"", telefono:"", organizacion:"", sector:"", modalidad:"", comentarios:"" }); }}
                        className="text-sm font-bold text-brand-blue hover:text-navy-900 underline underline-offset-2 transition-colors">
                  Registrar otra persona
                </button>
              </div>
            ) : (
              <form onSubmit={submitReg} className="p-6 space-y-4" noValidate>
                {regStatus === "error" && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-fadeup">
                    <svg className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="text-brand-red text-sm font-semibold">Algunos campos requeridos están vacíos. Por favor revise el formulario.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre *" error={regInvalid("nombre")}>
                    <input className={field(regInvalid("nombre"))} placeholder="María" value={regForm.nombre}
                           onChange={e => setRegForm({...regForm, nombre:e.target.value})} onBlur={() => touch("nombre")} />
                  </Field>
                  <Field label="Apellidos *" error={regInvalid("apellidos")}>
                    <input className={field(regInvalid("apellidos"))} placeholder="García López" value={regForm.apellidos}
                           onChange={e => setRegForm({...regForm, apellidos:e.target.value})} onBlur={() => touch("apellidos")} />
                  </Field>
                </div>

                <Field label="Correo electrónico *" error={regInvalid("correo")}>
                  <input type="email" className={field(regInvalid("correo"))} placeholder="correo@organizacion.gt" value={regForm.correo}
                         onChange={e => setRegForm({...regForm, correo:e.target.value})} onBlur={() => touch("correo")} />
                </Field>

                <Field label="Organización / Empresa *" error={regInvalid("organizacion")}>
                  <input className={field(regInvalid("organizacion"))} placeholder="Nombre de su institución" value={regForm.organizacion}
                         onChange={e => setRegForm({...regForm, organizacion:e.target.value})} onBlur={() => touch("organizacion")} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Sector *" error={regInvalid("sector")}>
                    <CustomSelect
                      value={regForm.sector}
                      onChange={(val) => {
                        setRegForm({ ...regForm, sector: val });
                        touch("sector");
                      }}
                      options={["Sector Público", "Sector Privado", "Academia", "Sociedad Civil", "Coop. Internacional"]}
                      placeholder="Seleccione…"
                    />
                  </Field>
                  <Field label="Modalidad *" error={regInvalid("modalidad")}>
                    <CustomSelect
                      value={regForm.modalidad}
                      onChange={(val) => {
                        setRegForm({ ...regForm, modalidad: val });
                        touch("modalidad");
                      }}
                      options={["Presencial", "Virtual"]}
                      placeholder="Seleccione…"
                    />
                  </Field>
                </div>

                <Field label="Comentarios">
                  <textarea rows={2} className="input resize-none text-sm" placeholder="Requerimientos especiales, preguntas…" value={regForm.comentarios}
                            onChange={e => setRegForm({...regForm, comentarios:e.target.value})} />
                </Field>

                <button type="submit" disabled={regStatus === "loading" || !event}
                        className="w-full bg-navy-900 hover:bg-navy-800 active:bg-navy-950 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-navy-900/20 focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:outline-none">
                  {regStatus === "loading"
                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Enviando…</>
                    : "Enviar Pre-registro"}
                </button>

                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Sus datos son tratados con confidencialidad conforme a la normativa de Gobierno Abierto de Guatemala.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
