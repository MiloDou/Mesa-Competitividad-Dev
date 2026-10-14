import React, { useEffect, useState } from "react";
import { getAdminLandingContent, saveLandingContent } from "../../../api/landingContent";

export const SettingsTab: React.FC = () => {
  const [tog, setTog] = useState<Record<string, boolean>>({
    email: true,
    meeting: true,
    autopub: false,
    votenotif: true,
  });

  // Load contact info from site_sections or defaults
  const [contactData, setContactData] = useState(() => {
    const saved = localStorage.getItem("site_sections");
    if (saved) {
      const parsed = JSON.parse(saved);
      const contactSec = parsed.find((s: any) => s.type === "contact");
      if (contactSec && contactSec.data) {
        return {
          address: contactSec.data.address || "7ª Av. 3-33 Zona 1, Quetzaltenango, Guatemala",
          phone: (!contactSec.data.phone || contactSec.data.phone.includes("7767-0000")) ? "+502 7765-5710 / +502 7968-7633" : contactSec.data.phone,
          email: (!contactSec.data.email || contactSec.data.email.includes("quetzaltenango.gob.gt")) ? "mesadequetzaltenango@gmail.com" : contactSec.data.email,
          hours: contactSec.data.hours || "Lun – Vie · 8:00 – 17:00 hrs.",
        };
      }
    }
    return {
      address: "7ª Av. 3-33 Zona 1, Quetzaltenango, Guatemala",
      phone: "+502 7765-5710 / +502 7968-7633",
      email: "mesadequetzaltenango@gmail.com",
      hours: "Lun – Vie · 8:00 – 17:00 hrs.",
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    getAdminLandingContent().then(({ content }) => {
      if (!active || !Array.isArray(content.site_sections)) return;
      try { localStorage.setItem("site_sections", JSON.stringify(content.site_sections)); } catch { /* API data remains authoritative */ }
      const contact = content.site_sections.find((section) => section.type === "contact")?.data;
      if (contact) {
        setContactData((current) => ({
          address: contact.address || current.address,
          phone: contact.phone || current.phone,
          email: contact.email || current.email,
          hours: contact.hours || current.hours,
        }));
      }
    }).catch(() => { /* retain local/default contact details if the API is offline */ });
    return () => { active = false; };
  }, []);

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const saved = localStorage.getItem("site_sections");
    let sections: any[] = [];
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed)) sections = parsed;
    } catch { /* start from an empty section list if the local cache is damaged */ }
    const index = sections.findIndex((s: any) => s.type === "contact");

    if (index !== -1) {
      sections[index].data = {
        ...sections[index].data,
        ...contactData,
      };
    } else {
      sections.push({
        id: "s8",
        type: "contact",
        visible: true,
        data: contactData,
      });
    }

    localStorage.setItem("site_sections", JSON.stringify(sections));
    window.dispatchEvent(new Event("site_sections_updated"));
    try {
      await saveLandingContent({ site_sections: sections });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar en la nube.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fadeup">
      {/* Contact information editor */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-navy-950 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm">Información Institucional de Contacto</h3>
            <p className="text-xs text-navy-200 mt-0.5">Se refleja automáticamente en el sitio público</p>
          </div>
          {savedSuccess && (
            <span className="text-xs font-bold text-green-400 bg-green-950/60 border border-green-800 px-3 py-1 rounded-full animate-fadeup">
              ¡Guardado y publicado!
            </span>
          )}
          {saving && <span className="text-xs text-navy-100">Guardando…</span>}
        </div>
        {saveError && <p role="alert" className="px-6 pt-3 text-xs text-red-700">No se guardó en la nube: {saveError}</p>}
        <form onSubmit={handleSaveContact} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección Oficial</label>
            <input
              type="text"
              className="input text-sm"
              value={contactData.address}
              onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Institucional</label>
              <input
                type="text"
                className="input text-sm"
                value={contactData.phone}
                onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico Oficial</label>
              <input
                type="email"
                className="input text-sm"
                value={contactData.email}
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Horario de Atención</label>
            <input
              type="text"
              className="input text-sm"
              value={contactData.hours}
              onChange={(e) => setContactData({ ...contactData, hours: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md shadow-navy-900/20"
          >
            {saving ? "Guardando…" : "Guardar y Publicar Datos de Contacto"}
          </button>
        </form>
      </div>

      {/* System options toggles */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-navy-900 text-sm">Preferencia de Notificaciones del Sistema</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            ["email", "Notificaciones por correo"],
            ["meeting", "Alerta de reunión (24h antes)"],
            ["votenotif", "Alerta de nueva propuesta de voto"],
            ["autopub", "Publicación automática de actas"],
          ].map(([k, l]) => (
            <div key={k as string} className="flex items-center justify-between px-6 py-4">
              <p className="text-sm font-medium text-slate-700">{l as string}</p>
              <button
                type="button"
                onClick={() => setTog({ ...tog, [k as string]: !tog[k as string] })}
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                  tog[k as string] ? "bg-navy-700" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                    tog[k as string] ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
