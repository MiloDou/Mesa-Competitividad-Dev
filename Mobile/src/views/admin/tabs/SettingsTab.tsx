import React, { useState } from "react";

export const SettingsTab: React.FC = () => {
  const [tog, setTog] = useState<Record<string, boolean>>({
    email: true,
    meeting: true,
    autopub: false,
    votenotif: true,
  });

  return (
    <div className="max-w-xl space-y-5 animate-fadeup">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-navy-900 text-sm">Configuración del Sistema</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            ["Nombre del organismo", "Mesa de Competitividad de Quetzaltenango"],
            ["Correo institucional", "mesa.competitividad@quetzaltenango.gob.gt"],
          ].map(([l, v]) => (
            <div key={l as string} className="flex items-center justify-between px-5 py-4">
              <p className="text-sm font-medium text-slate-700">{l as string}</p>
              <p className="text-sm text-slate-400 max-w-[260px] truncate text-right">{v as string}</p>
            </div>
          ))}
          {[
            ["email", "Notificaciones por correo"],
            ["meeting", "Alerta de reunión (24h antes)"],
            ["votenotif", "Alerta de nueva propuesta de voto"],
            ["autopub", "Publicación automática de actas"],
          ].map(([k, l]) => (
            <div key={k as string} className="flex items-center justify-between px-5 py-4">
              <p className="text-sm font-medium text-slate-700">{l as string}</p>
              <button
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
