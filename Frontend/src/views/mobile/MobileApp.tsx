import { useState } from "react";
import { Screen, Meeting, Proposal } from "../../types/mobile";
import { PROPOSALS, NOTIFS } from "../../data/mobile";
import { HomeIcon, CalIcon, VoteIcon, DocIcon, BellIcon } from "../../components/icons/MobileIcons";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import MeetingsScreen from "./screens/MeetingsScreen";
import MeetingDetailScreen from "./screens/MeetingDetailScreen";
import VoteListScreen from "./screens/VoteListScreen";
import VoteCastScreen from "./screens/VoteCastScreen";
import VoteDoneScreen from "./screens/VoteDoneScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import DocumentsScreen from "./screens/DocumentsScreen";

export default function MobileApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [choice, setChoice] = useState<"favor" | "contra" | "abstencion" | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  // login state
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loginErr, setLoginErr] = useState(false);
  const [logging, setLogging] = useState(false);

  function goTo(s: Screen) {
    setScreen(s);
  }

  function login() {
    if (!email || !pw) {
      setLoginErr(true);
      return;
    }
    setLogging(true);
    setTimeout(() => goTo("home"), 1700);
  }

  function castVote() {
    if (!proposal || !choice) return;
    setVoted((v) => new Set([...v, proposal.id]));
    goTo("vote-done");
  }

  const pendingVotes = PROPOSALS.filter((p) => !voted.has(p.id)).length;
  const unreadNotifs = NOTIFS.filter((n) => n.unread).length;

  const BOTTOM: { id: Screen; icon: React.ReactNode; label: string; badge: number }[] = [
    { id: "home", icon: <HomeIcon />, label: "Inicio", badge: 0 },
    { id: "meetings", icon: <CalIcon />, label: "Reuniones", badge: 0 },
    { id: "vote-list", icon: <VoteIcon />, label: "Votar", badge: pendingVotes },
    { id: "documents", icon: <DocIcon />, label: "Docs", badge: 0 },
    { id: "notifications", icon: <BellIcon />, label: "Alertas", badge: unreadNotifs },
  ];

  const isBottomScreen = ["home", "meetings", "vote-list", "notifications", "documents"].includes(screen);

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center py-8 px-4" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Phone chassis */}
      <div
        className="relative w-[375px] bg-white rounded-[44px] shadow-[0_32px_80px_rgba(0,0,0,0.35)] overflow-hidden border-4 border-slate-800"
        style={{ minHeight: "780px" }}
      >
        {/* Camera notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
          <div className="w-2.5 h-2.5 bg-slate-600 rounded-full" />
        </div>

        {/* Status bar */}
        <div className="bg-navy-950 pt-7 pb-2 px-6 flex items-center justify-between flex-shrink-0">
          <span style={{ fontFamily: "var(--font-mono)" }} className="text-white text-xs font-semibold">
            9:41
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5">
              {[2, 3, 4, 5].map((h, i) => (
                <div key={i} className="w-1 bg-white rounded-sm" style={{ height: `${h * 2.5}px`, opacity: i < 3 ? 1 : 0.3 }} />
              ))}
            </div>
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.5 8.5L12 2l10.5 6.5v9L12 22 1.5 17.5V8.5z" opacity={0.2} />
              <path d="M12 2L1.5 8.5M12 2l10.5 6.5M1.5 8.5v9L12 22m0-20v20m0 0l10.5-4.5V8.5" stroke="white" strokeWidth={1.5} fill="none" />
            </svg>
            <div className="flex items-center gap-0.5">
              <div className="w-5 h-2.5 border border-white/50 rounded-[3px] flex items-center px-0.5">
                <div className="w-full h-1.5 bg-green-400 rounded-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Screen area */}
        <div className="flex flex-col bg-white" style={{ minHeight: "700px" }}>
          <div className="flex-1 overflow-y-auto" style={{ paddingBottom: isBottomScreen ? "72px" : "0" }}>
            {screen === "login" && (
              <LoginScreen
                email={email}
                setEmail={setEmail}
                pw={pw}
                setPw={setPw}
                loginErr={loginErr}
                logging={logging}
                login={login}
              />
            )}

            {screen === "home" && (
              <HomeScreen
                pendingVotes={pendingVotes}
                goTo={goTo}
                setMeeting={setMeeting}
                setProposal={(p) => {
                  setProposal(p);
                  setChoice(null);
                }}
                setChoice={setChoice}
                voted={voted}
              />
            )}

            {screen === "meetings" && (
              <MeetingsScreen
                goTo={goTo}
                setMeeting={setMeeting}
              />
            )}

            {screen === "meeting-detail" && (
              <MeetingDetailScreen
                meeting={meeting}
                goTo={goTo}
              />
            )}

            {screen === "vote-list" && (
              <VoteListScreen
                goTo={goTo}
                setProposal={(p) => {
                  setProposal(p);
                  setChoice(null);
                }}
                voted={voted}
              />
            )}

            {screen === "vote-cast" && (
              <VoteCastScreen
                proposal={proposal}
                choice={choice}
                setChoice={setChoice}
                goTo={goTo}
                castVote={castVote}
              />
            )}

            {screen === "vote-done" && (
              <VoteDoneScreen
                proposal={proposal}
                choice={choice}
                goTo={goTo}
                setProposal={setProposal}
                setChoice={setChoice}
              />
            )}

            {screen === "notifications" && (
              <NotificationsScreen
                goTo={goTo}
              />
            )}

            {screen === "profile" && (
              <ProfileScreen
                goTo={goTo}
              />
            )}

            {screen === "documents" && (
              <DocumentsScreen
                goTo={goTo}
              />
            )}
          </div>

          {/* Bottom tab bar */}
          {isBottomScreen && (
            <div className="fixed bottom-0 bg-white border-t border-slate-200 flex" style={{ width: "367px" }}>
              {BOTTOM.map((b) => {
                const active = screen === b.id;
                return (
                  <button
                    key={b.id as string}
                    onClick={() => goTo(b.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-all ${
                      active ? "text-navy-900" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-celeste-500 rounded-b-full" />}
                    <div className={`w-6 h-6 transition-transform ${active ? "scale-110" : ""}`}>{b.icon}</div>
                    <span className={`text-[10px] font-bold ${active ? "text-navy-900" : "text-slate-400"}`}>{b.label}</span>
                    {b.badge > 0 && !active && (
                      <span className="absolute top-2 right-[22%] w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {b.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Device label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-400 text-[10px] text-center pointer-events-none" style={{ marginTop: "860px" }}>
        Cambiar vista con los controles de abajo
      </div>
    </div>
  );
}
