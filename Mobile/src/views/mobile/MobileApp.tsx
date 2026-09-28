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
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-celeste-500/20" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Mobile App Container */}
      <div className="w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col relative overflow-x-hidden">
        {/* Screen Content Area */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto" style={{ paddingBottom: isBottomScreen ? "72px" : "0" }}>
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

        {/* Native Bottom Tab Bar */}
        {isBottomScreen && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex z-30 pb-[env(safe-area-inset-bottom,0px)]">
            {BOTTOM.map((b) => {
              const active = screen === b.id;
              return (
                <button
                  key={b.id as string}
                  onClick={() => goTo(b.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 relative transition-all active:scale-95 ${
                    active ? "text-navy-900" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-celeste-500 rounded-b-full" />}
                  <div className={`w-6 h-6 transition-transform ${active ? "scale-110" : ""}`}>{b.icon}</div>
                  <span className={`text-[10px] font-bold ${active ? "text-navy-900 font-extrabold" : "text-slate-400"}`}>{b.label}</span>
                  {b.badge > 0 && !active && (
                    <span className="absolute top-1.5 right-[20%] w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {b.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
