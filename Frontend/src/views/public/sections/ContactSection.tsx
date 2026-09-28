import React from "react";
import { PinSvg, PhoneSvg, MailSvg, ClockSvg } from "../../../components/icons/PublicIcons";

function Field({ label, error, dark, children }: { label:string; error?:boolean; dark?:boolean; children:React.ReactNode }) {
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-navy-300" : error ? "text-brand-red font-bold" : "text-slate-600"}`}>{label}</label>
      {children}
    </div>
  );
}

interface ContactSectionProps {
  data?: Record<string, any>;
  contactForm: { nombre: string; correo: string; asunto: string; mensaje: string };
  setContactForm: React.Dispatch<React.SetStateAction<{ nombre: string; correo: string; asunto: string; mensaje: string }>>;
  contactStatus: "idle" | "loading" | "success" | "error";
  submitContact: (e: React.FormEvent) => void;
}

export default function ContactSection({
  data,
  contactForm,
  setContactForm,
  contactStatus,
  submitContact,
}: ContactSectionProps) {
  const isErr = (k: keyof typeof contactForm) => contactStatus === "error" && !contactForm[k]?.trim();
  const inputClass = (k: keyof typeof contactForm) =>
    `input text-sm ${isErr(k) ? "border-brand-red ring-1 ring-brand-red/30 bg-red-50/20" : ""}`;

  const infoList = [
    { icon:<PinSvg/>,    l:"Dirección",    v: data?.address || "7ª Av. 3-33 Zona 1, Quetzaltenango, Guatemala" },
    { icon:<PhoneSvg/>,  l:"Teléfono",     v: data?.phone || "+502 7767-0000" },
    { icon:<MailSvg/>,   l:"Correo",       v: data?.email || "mesa.competitividad@quetzaltenango.gob.gt" },
    { icon:<ClockSvg/>,  l:"Atención",     v: data?.hours || "Lun – Vie · 8:00 – 17:00 hrs." },
  ];

  return (
    <section id="contacto" className="py-24 bg-navy-950">
      <div className="max-w-screen-xl mx-auto px-5 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_2px_1.2fr] gap-14 items-start">

          {/* Contact info */}
          <div className="reveal-left">
            <h2 className="text-white text-4xl lg:text-5xl font-extrabold uppercase tracking-wide leading-tight mb-3">
              {data?.title || "Canal de Contacto"}
            </h2>
            <p className="text-gold-400 text-xl lg:text-2xl font-semibold mb-8 leading-tight">Comuníquese con<br/>la Mesa</p>
            <div className="space-y-5">
              {infoList.map(c => (
                <div key={c.l} className="flex gap-4">
                  <div className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5">{c.icon}</div>
                  <div>
                    <p className="text-navy-400 text-[10px] font-extrabold uppercase tracking-widest mb-0.5">{c.l}</p>
                    <p className="text-navy-200 text-sm leading-relaxed font-medium">{c.v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block self-stretch bg-navy-800" />

          {/* Contact form */}
          <div className="reveal-right bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gold-500">
            <div className="bg-navy-950 px-6 py-5 border-b border-navy-800">
              <h3 className="text-navy-100 text-xl font-bold">Enviar mensaje</h3>
              <p className="text-gold-400 text-xs font-semibold mt-1">Complete el formulario y le responderemos en 2–3 días hábiles.</p>
            </div>
            {contactStatus === "success" ? (
              <div className="p-8 text-center animate-fadeup">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h4 className="text-brand-dark text-2xl font-bold mb-2">¡Mensaje enviado!</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">Le responderemos en 2–3 días hábiles a <strong className="text-navy-950">{contactForm.correo}</strong>.</p>
                <button onClick={() => { setContactForm({ nombre:"", correo:"", asunto:"", mensaje:"" }); }}
                        className="text-sm font-bold text-brand-blue hover:text-navy-900 underline underline-offset-2 transition-colors">
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={submitContact} className="p-6 space-y-4" noValidate>
                {contactStatus === "error" && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-fadeup">
                    <svg className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="text-brand-red text-sm font-semibold">Por favor llene todos los campos obligatorios antes de enviar.</p>
                  </div>
                )}
                <Field label="Nombre completo *" error={isErr("nombre")}>
                  <input type="text" className={inputClass("nombre")} placeholder="Su nombre completo" value={contactForm.nombre} onChange={e => setContactForm({...contactForm, nombre:e.target.value})} />
                </Field>
                <Field label="Correo electrónico *" error={isErr("correo")}>
                  <input type="email" className={inputClass("correo")} placeholder="correo@ejemplo.gt" value={contactForm.correo} onChange={e => setContactForm({...contactForm, correo:e.target.value})} />
                </Field>
                <Field label="Asunto *" error={isErr("asunto")}>
                  <input type="text" className={inputClass("asunto")} placeholder="Tema de su consulta" value={contactForm.asunto} onChange={e => setContactForm({...contactForm, asunto:e.target.value})} />
                </Field>
                <Field label="Mensaje *" error={isErr("mensaje")}>
                  <textarea rows={4} className={`${inputClass("mensaje")} resize-none`} placeholder="Describa su consulta o comentario…"
                            value={contactForm.mensaje} onChange={e => setContactForm({...contactForm, mensaje:e.target.value})} />
                </Field>
                <button type="submit" disabled={contactStatus==="loading"}
                        className="w-full bg-gradient-to-r from-brand-blue to-navy-900 hover:from-navy-900 hover:to-brand-blue disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20">
                  {contactStatus==="loading" ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Enviando…</> : "Enviar mensaje"}
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
