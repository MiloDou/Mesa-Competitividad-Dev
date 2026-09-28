import React from "react";
import { RegForm } from "../../../types/public";
import { CalSvg, PinSvg, UsersSvg, MicSvg } from "../../../components/icons/PublicIcons";

function field(err: boolean) {
  return `input text-sm ${err ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200" : ""}`;
}

function Field({ label, error, dark, children }: { label:string; error?:boolean; dark?:boolean; children:React.ReactNode }) {
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-navy-400" : error ? "text-red-600" : "text-slate-500"}`}>{label}</label>
      {children}
    </div>
  );
}

interface EventSectionProps {
  regForm: RegForm;
  setRegForm: React.Dispatch<React.SetStateAction<RegForm>>;
  regStatus: "idle" | "loading" | "success" | "error";
  regTouched: Set<string>;
  touch: (k: string) => void;
  regInvalid: (k: keyof RegForm) => boolean;
  submitReg: (e: React.FormEvent) => void;
}

export default function EventSection({
  regForm,
  setRegForm,
  regStatus,
  regTouched,
  touch,
  regInvalid,
  submitReg,
}: EventSectionProps) {
  return (
    <section id="summit-2026" className="relative overflow-hidden bg-navy-900">
      <img
        src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1800&h=1000&fit=crop&auto=format"
        alt="Conferencia regional"
        className="absolute inset-0 w-full h-full object-cover opacity-10"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900/90 to-navy-800/70" />

      <div className="relative max-w-screen-xl mx-auto px-5 lg:px-10 py-24">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-14 items-start">

          {/* Left: summit info */}
          <div>
            <div className="inline-flex items-center gap-2 bg-celeste-500/15 border border-celeste-500/30 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-celeste-400 rounded-full animate-pulse" />
              <span className="text-celeste-300 text-xs font-bold tracking-wide uppercase">Evento Anual 2026</span>
            </div>

            <h2 style={{ fontFamily:"var(--font-display)" }} className="text-white text-4xl lg:text-5xl xl:text-6xl font-normal leading-tight mb-6">
              Summit de<br/>
              <em className="text-gold-400 not-italic">Competitividad</em><br/>
              Quetzaltenango 2026
            </h2>

            <p className="text-navy-200 text-lg leading-relaxed mb-10 max-w-xl">
              Dos días de conferencias magistrales, mesas de trabajo y networking estratégico para construir juntos la hoja de ruta de la competitividad regional.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[
                { label:"Fecha",     val:"14–15 Nov 2026",          icon:<CalSvg/> },
                { label:"Lugar",     val:"Hotel Intercontinental Xela", icon:<PinSvg/> },
                { label:"Capacidad", val:"400 participantes",        icon:<UsersSvg/> },
                { label:"Ponentes",  val:"+28 confirmados",          icon:<MicSvg/> },
              ].map(d => (
                <div key={d.label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="w-6 h-6 text-celeste-400 mb-2">{d.icon}</div>
                  <p className="text-navy-300 text-xs uppercase tracking-wide font-semibold">{d.label}</p>
                  <p className="text-white font-semibold text-sm mt-1 leading-snug">{d.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-celeste-500/12 border border-celeste-500/25 rounded-xl p-5">
              <p className="text-celeste-400 font-semibold text-sm mb-1">Registro anticipado</p>
              <p className="text-navy-300 text-sm">Complete su pre-registro antes del 31 de octubre de 2026 para garantizar su lugar y acceder a la tarifa preferencial.</p>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gold-500">
            <div className="bg-navy-950 px-6 py-5">
              <h3 style={{ fontFamily:"var(--font-display)" }} className="text-white text-xl font-normal">Pre-registro al Summit</h3>
              <p className="text-navy-400 text-xs mt-1">Complete el formulario para reservar su lugar.</p>
            </div>

            {regStatus === "success" ? (
              <div className="p-8 text-center animate-fadeup">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h4 style={{ fontFamily:"var(--font-display)" }} className="text-navy-900 text-2xl font-normal mb-2">¡Pre-registro exitoso!</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Recibirá un correo de confirmación en <strong className="text-navy-800">{regForm.correo}</strong> con los detalles del evento.
                </p>
                <button onClick={() => { setRegForm({ nombre:"", apellidos:"", correo:"", telefono:"", organizacion:"", sector:"", modalidad:"", comentarios:"" }); }}
                        className="text-sm text-navy-600 hover:text-navy-900 underline underline-offset-2 transition-colors">
                  Registrar otra persona
                </button>
              </div>
            ) : (
              <form onSubmit={submitReg} className="p-6 space-y-4" noValidate>
                {regStatus === "error" && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-fadeup">
                    <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="text-red-700 text-sm">Algunos campos requeridos están vacíos. Por favor revise el formulario.</p>
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
                    <select className={field(regInvalid("sector"))} value={regForm.sector}
                            onChange={e => setRegForm({...regForm, sector:e.target.value})} onBlur={() => touch("sector")}>
                      <option value="">Seleccione…</option>
                      {["Sector Público","Sector Privado","Academia","Sociedad Civil","Coop. Internacional"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Modalidad *" error={regInvalid("modalidad")}>
                    <select className={field(regInvalid("modalidad"))} value={regForm.modalidad}
                            onChange={e => setRegForm({...regForm, modalidad:e.target.value})} onBlur={() => touch("modalidad")}>
                      <option value="">Seleccione…</option>
                      <option>Presencial</option>
                      <option>Virtual</option>
                    </select>
                  </Field>
                </div>

                <Field label="Comentarios">
                  <textarea rows={2} className="input resize-none text-sm" placeholder="Requerimientos especiales, preguntas…" value={regForm.comentarios}
                            onChange={e => setRegForm({...regForm, comentarios:e.target.value})} />
                </Field>

                <button type="submit" disabled={regStatus === "loading"}
                        className="w-full bg-navy-900 hover:bg-navy-800 active:bg-navy-950 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-md">
                  {regStatus === "loading"
                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Enviando…</>
                    : "Enviar Pre-registro"}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
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
