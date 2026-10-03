import React from "react";

interface NotificationPanelProps {
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-[68px] right-5 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeup">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-navy-900 text-sm">Notificaciones</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {[
            { icon: "📅", title: "Sesión Ordinaria No. 021", body: "Programada para el 18 sep 2026 a las 9:00 AM", time: "Hace 2h", unread: true },
            { icon: "🗳️", title: "Nueva propuesta para votar", body: "Actualización al Reglamento Interior de la Mesa", time: "Hace 5h", unread: true },
            { icon: "📄", title: "Acta No. 020 publicada", body: "Ya está disponible para revisión y firma digital", time: "Ayer", unread: false },
            { icon: "📊", title: "Informe Q3 2026 cargado", body: "Min. de Comunicaciones subió el avance del Corredor", time: "2 días", unread: false },
            { icon: "👤", title: "Nuevo miembro incorporado", body: "Cámara de Turismo se unió a la Mesa", time: "1 semana", unread: false },
          ].map((n, i) => (
            <li key={i} className={`flex gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${n.unread ? "bg-celeste-50" : ""}`}>
              <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${n.unread ? "font-semibold text-navy-900" : "font-medium text-navy-700"}`}>{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.body}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                {n.unread && <span className="w-2 h-2 bg-celeste-500 rounded-full" />}
              </div>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2.5 border-t border-slate-100 text-center">
          <button className="text-xs font-semibold text-celeste-600 hover:text-celeste-700 transition-colors">
            Marcar todas como leídas
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
