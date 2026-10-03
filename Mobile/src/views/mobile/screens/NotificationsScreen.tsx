import React from "react";
import { Screen } from "../../../types/mobile";
import { NOTIFS } from "../../../data/mobile";
import { CalIcon, VoteIcon, DocIcon } from "../../../components/icons/MobileIcons";

interface NotificationsScreenProps {
  goTo: (s: Screen) => void;
}

const ScreenHeader: React.FC<{ title: string; sub: string; onBack: () => void }> = ({ title, sub, onBack }) => (
  <div className="bg-navy-950 px-5 pt-5 pb-6">
    <button onClick={onBack} className="flex items-center gap-2 text-celeste-400 hover:text-white text-sm mb-3 transition-colors font-semibold">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Inicio
    </button>
    <h2 style={{ fontFamily: "var(--font-display)" }} className="text-white text-3xl font-normal">
      {title}
    </h2>
    <p className="text-celeste-400 text-sm mt-0.5 font-medium">{sub}</p>
  </div>
);

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ goTo }) => {
  const unreadNotifs = NOTIFS.filter((n) => n.unread).length;

  return (
    <div>
      <ScreenHeader title="Notificaciones" sub={`${unreadNotifs} nueva(s)`} onBack={() => goTo("home")} />
      <div className="divide-y divide-slate-100">
        {NOTIFS.map((n) => (
          <div key={n.id} className={`flex gap-4 px-5 py-4 ${n.unread ? "bg-navy-50/60" : "bg-white"}`}>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                n.type === "meeting" ? "bg-navy-100" : n.type === "vote" ? "bg-celeste-100" : "bg-slate-100"
              }`}
            >
              {n.type === "meeting" ? (
                <CalIcon className="w-5 h-5 text-navy-700" />
              ) : n.type === "vote" ? (
                <VoteIcon className="w-5 h-5 text-celeste-700" />
              ) : (
                <DocIcon className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-bold ${n.unread ? "text-navy-900" : "text-slate-700"}`}>{n.title}</p>
                {n.unread && <div className="w-2.5 h-2.5 bg-navy-700 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.body}</p>
              <p style={{ fontFamily: "var(--font-mono)" }} className="text-[10px] text-slate-400 mt-1">
                {n.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsScreen;
