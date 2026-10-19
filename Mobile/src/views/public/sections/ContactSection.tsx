import React from "react";
import { PinSvg, PhoneSvg, MailSvg, ClockSvg } from "../../../components/icons/PublicIcons";

function Field({ label, error, dark, children }: { label:string; error?:boolean; dark?:boolean; children:React.ReactNode }) {
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-navy-400" : error ? "text-red-600" : "text-slate-500"}`}>{label}</label>
      {children}
    </div>
  );
}

interface ContactSectionProps {
  contactForm: { nombre: string; correo: string; asunto: string; mensaje: string };
  setContactForm: React.Dispatch<React.SetStateAction<{ nombre: string; correo: string; asunto: string; mensaje: string }>>;
  contactStatus: "idle" | "loading" | "success";
  submitContact: (e: React.FormEvent) => void;
}

export default function ContactSection({
  contactForm,
  setContactForm,
  contactStatus,
  submitContact,
}: ContactSectionProps) {
  return (
    <section id="contacto" className="py-24 bg-navy-950">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_2px_1.2fr] gap-14 items-start">

          {/* Contact info */}
          <div>
            <h2 style={{ fontFamily:"var(--font-display)" }} className="text-celeste-400 text-4xl lg:text-5xl font-bold uppercase tracking-wide leading-tight mb-3">Canal de Contacto</h2>
            <p className="text-white text-xl lg:text-2xl font-normal mb-8 leading-tight">Comuníquese con<br/>la Mesa</p>
            <div className="space-y-5">
              {[
                { icon:<PinSvg/>,    l:"Dirección",    v:"7ª Av. 3-33 Zona 1, Quetzaltenango, Guatemala" },
                { icon:<PhoneSvg/>,  l:"Teléfono",     v:"+502 7767-0000" },
                { icon:<MailSvg/>,   l:"Correo",       v:"mesa.competitividad@quetzaltenango.gob.gt" },
                { icon:<ClockSvg/>,  l:"Atención",     v:"Lun – Vie · 8:00 – 17:00 hrs." },
              ].map(c => (
                <div key={c.l} className="flex gap-4">
                  <div className="w-5 h-5 text-celeste-500 flex-shrink-0 mt-0.5">{c.icon}</div>
                  <div>
                    <p className="text-navy-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">{c.l}</p>
                    <p className="text-navy-200 text-sm leading-relaxed">{c.v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block self-stretch bg-navy-800" />

          {/* Contact form — same card pattern as Summit */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gold-500">
            <div className="bg-navy-950 px-6 py-5">
              <h3 style={{ fontFamily:"var(--font-display)" }} className="text-white text-xl font-normal">Enviar mensaje</h3>
              <p className="text-navy-400 text-xs mt-1">Complete el formulario y le responderemos en 2–3 días hábiles.</p>
            </div>
            {contactStatus === "success" ? (
              <div className="p-8 text-center animate-fadeup">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h4 style={{ fontFamily:"var(--font-display)" }} className="text-navy-900 text-2xl font-normal mb-2">¡Mensaje enviado!</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">Le responderemos en 2–3 días hábiles a <strong className="text-navy-800">{contactForm.correo}</strong>.</p>
                <button onClick={() => { setContactForm({ nombre:"", correo:"", asunto:"", mensaje:"" }); }}
                        className="text-sm text-navy-600 hover:text-navy-900 underline underline-offset-2 transition-colors">
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={submitContact} className="p-6 space-y-4" noValidate>
                <Field label="Nombre completo">
                  <input type="text" className="input text-sm" placeholder="Su nombre completo" value={contactForm.nombre} onChange={e => setContactForm({...contactForm, nombre:e.target.value})} />
                </Field>
                <Field label="Correo electrónico">
                  <input type="email" className="input text-sm" placeholder="correo@ejemplo.gt" value={contactForm.correo} onChange={e => setContactForm({...contactForm, correo:e.target.value})} />
                </Field>
                <Field label="Asunto">
                  <input type="text" className="input text-sm" placeholder="Tema de su consulta" value={contactForm.asunto} onChange={e => setContactForm({...contactForm, asunto:e.target.value})} />
                </Field>
                <Field label="Mensaje">
                  <textarea rows={4} className="input resize-none text-sm" placeholder="Describa su consulta o comentario…"
                            value={contactForm.mensaje} onChange={e => setContactForm({...contactForm, mensaje:e.target.value})} />
                </Field>
                <button type="submit" disabled={contactStatus==="loading"}
                        className="w-full bg-navy-900 hover:bg-navy-800 active:bg-navy-950 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-md">
                  {contactStatus==="loading" ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Enviando…</> : "Enviar mensaje"}
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
