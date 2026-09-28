import React, { useState } from "react";
import { CalIcon, VoteIcon, DocIcon, UsersIcon } from "../../../components/icons/AdminIcons";

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

interface NotificationPanelProps {
  onClose: () => void;
  onClearUnread?: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose, onClearUnread }) => {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [notifications, setNotifications] = useState([
    { id: 1, icon: <CalIcon className="w-5 h-5 text-celeste-600" />, title: "Sesión Ordinaria No. 021", body: "Programada para el 18 sep 2026 a las 9:00 AM", time: "Hace 2h", unread: true },
    { id: 2, icon: <VoteIcon className="w-5 h-5 text-purple-600" />, title: "Nueva propuesta para votar", body: "Actualización al Reglamento Interior de la Mesa", time: "Hace 5h", unread: true },
    { id: 3, icon: <DocIcon className="w-5 h-5 text-amber-600" />, title: "Acta No. 020 publicada", body: "Ya está disponible para revisión y firma digital", time: "Ayer", unread: false },
    { id: 4, icon: <ChartIcon className="w-5 h-5 text-blue-600" />, title: "Informe Q3 2026 cargado", body: "Min. de Comunicaciones subió el avance del Corredor", time: "2 días", unread: false },
    { id: 5, icon: <UsersIcon className="w-5 h-5 text-emerald-600" />, title: "Nuevo miembro incorporado", body: "Cámara de Turismo se unió a la Mesa", time: "1 semana", unread: false },
  ]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (onClearUnread) {
      onClearUnread();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-[68px] right-5 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeup">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-navy-900 text-sm">Notificaciones</h3>
            {notifications.some((n) => n.unread) && (
              <span className="bg-celeste-500 text-navy-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {notifications.filter((n) => n.unread).length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)))}
              className={`flex gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${n.unread ? "bg-celeste-50/60" : ""}`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {n.icon}
              </div>
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
          <button
            onClick={handleMarkAllAsRead}
            disabled={!notifications.some((n) => n.unread)}
            className="text-xs font-semibold text-celeste-600 hover:text-celeste-700 disabled:text-slate-400 disabled:cursor-default transition-colors"
          >
            {notifications.some((n) => n.unread) ? "Marcar todas como leídas" : "Todas las notificaciones leídas"}
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
