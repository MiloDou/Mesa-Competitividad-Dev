import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts, Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from "@expo-google-fonts/montserrat";
import { BottomNav, DemoNotice } from "./components";
import { documents, initiatives, meetings, notices } from "./data";
import { colors } from "./theme";
import type { DemoListMode, DocumentItem, Initiative, Meeting, Notice, RemoteState, Screen } from "./types";
import { HomeScreen, LoginScreen } from "./screens/AccessHome";
import { MeetingDetailScreen, MeetingsScreen } from "./screens/Meetings";
import { DocumentDetailScreen, DocumentsScreen, NoticeDetailScreen, NotificationsScreen, ProfileScreen } from "./screens/Information";
import { InitiativeDetailScreen, InitiativesScreen } from "./screens/Initiatives";
import { ResultsScreen, VoteChoiceScreen, VoteDetailScreen, VoteDoneScreen, VotePreviewScreen, VotesScreen } from "./screens/Voting";
import { ApiError, login, logout, restoreSession, SESSION_EXPIRED_CODE } from "../api/client";
import type { AuthUser } from "../api/types";
import { castVote, classifyCastError, getExpediente, listExpedientes, newClientRequestId, type Comprobante, type Expediente } from "../api/votings";

/** Pantallas que todavía usan datos de ejemplo (sin API conectada). */
const demoScreens: Screen[] = ["meetings", "meeting-detail", "initiatives", "initiative-detail", "notifications", "notice-detail", "documents", "document-detail"];

interface CastAttempt { option: string; clientRequestId: string }

export default function MobileApp() {
  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold });
  const [screen, setScreen] = useState<Screen>("login");
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<Meeting>(meetings[0]);
  const [initiative, setInitiative] = useState<Initiative>(initiatives[0]);
  const [notice, setNotice] = useState<Notice>(notices[0]);
  const [document, setDocument] = useState<DocumentItem>(documents[0]);
  const [listMode, setListMode] = useState<DemoListMode>("content");

  const [votesState, setVotesState] = useState<RemoteState>("loading");
  const [votesError, setVotesError] = useState<string>();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [castError, setCastError] = useState<{ message: string; canRetry: boolean } | null>(null);
  const [comprobante, setComprobante] = useState<Comprobante | null>(null);
  // Intento de voto sin confirmación del servidor, por votación: un reintento manual reutiliza el mismo UUID.
  const pendingAttempts = useRef(new Map<number, CastAttempt>());
  const sendingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const endSession = useCallback((message: string | null) => {
    setUser(null);
    setExpedientes([]);
    setLoginNotice(message);
    setScreen("login");
  }, []);

  const loadVotes = useCallback(async () => {
    setVotesState("loading");
    try {
      setExpedientes(await listExpedientes());
      setVotesState("content");
    } catch (error) {
      if (error instanceof ApiError && error.code === SESSION_EXPIRED_CODE) return endSession(error.message);
      setVotesError(error instanceof Error ? error.message : undefined);
      setVotesState("error");
    }
  }, [endSession]);

  useEffect(() => {
    restoreSession().then((restored) => {
      if (restored) { setUser(restored); setScreen("home"); }
    }).finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (user && (screen === "home" || screen === "votes")) void loadVotes();
  }, [user, screen, loadVotes]);

  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [screen]);

  async function handleLogin(email: string, password: string) {
    const signedIn = await login(email, password);
    setLoginNotice(null);
    setUser(signedIn);
    setScreen("home");
  }

  async function handleLogout() {
    pendingAttempts.current.clear();
    await logout();
    endSession(null);
  }

  function openMeeting(selected: Meeting) { setMeeting(selected); setScreen("meeting-detail"); }
  function openInitiative(selected: Initiative) { setInitiative(selected); setScreen("initiative-detail"); }
  function openNotice(selected: Notice) { setNotice(selected); setScreen("notice-detail"); }
  function openDocument(selected: DocumentItem) { setDocument(selected); setScreen("document-detail"); }

  function openExpediente(selected: Expediente) {
    setExpediente(selected);
    setComprobante(null);
    const pending = pendingAttempts.current.get(selected.id);
    if (pending && !selected.ya_voto) {
      // Hay un envío sin respuesta: solo se permite reintentar ese mismo voto.
      setChoice(pending.option);
      setCastError({ message: "Hay un envío anterior sin confirmar. Reintenta para obtener la confirmación del servidor.", canRetry: true });
      setScreen("vote-preview");
      return;
    }
    setChoice(null);
    setCastError(null);
    setScreen("vote-detail");
    getExpediente(selected.id).then((fresh) => setExpediente((current) => current?.id === fresh.id ? fresh : current)).catch(() => undefined);
  }

  async function sendVote() {
    if (!expediente || !choice || sendingRef.current) return;
    const attempt = pendingAttempts.current.get(expediente.id) ?? { option: choice, clientRequestId: newClientRequestId() };
    pendingAttempts.current.set(expediente.id, attempt);
    sendingRef.current = true;
    setSending(true);
    try {
      const receipt = await castVote(expediente, attempt.option, attempt.clientRequestId);
      pendingAttempts.current.delete(expediente.id);
      setCastError(null);
      setComprobante(receipt);
      setScreen("vote-done");
    } catch (error) {
      const failure = classifyCastError(error);
      if (!failure.canRetrySameVote) pendingAttempts.current.delete(expediente.id);
      if (failure.kind === "session_expired") {
        endSession("La sesión expiró antes de enviar el voto. Inicia sesión y vuelve a abrir la votación para reintentar el mismo voto.");
        return;
      }
      setCastError({ message: failure.message, canRetry: failure.canRetrySameVote });
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  useEffect(() => {
    const parent: Partial<Record<Screen, Screen>> = {
      "meeting-detail": "meetings",
      "initiative-detail": "initiatives",
      "notice-detail": "notifications",
      "document-detail": "documents",
      "vote-detail": "votes",
      "vote-confirm": "vote-detail",
      "vote-done": "home",
      results: "votes",
      meetings: "home",
      initiatives: "home",
      notifications: "home",
      documents: "home",
      profile: "home",
      votes: "home",
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen === "vote-preview") return sending;
      const destination = parent[screen];
      if (!destination) return false;
      setScreen(destination);
      return true;
    });
    return () => subscription.remove();
  }, [screen, sending]);

  if (!fontsLoaded || booting) return <View style={styles.loading}><Text style={styles.loadingText}>Cargando…</Text></View>;
  const pendingVote = expedientes.find((item) => item.estado === "open" && !item.ya_voto);
  let content: ReactNode;
  switch (screen) {
    case "login": content = <LoginScreen onLogin={handleLogin} notice={loginNotice} />; break;
    case "home": content = <HomeScreen navigate={setScreen} openMeeting={() => openMeeting(meetings[0])} pending={pendingVote} openPending={openExpediente} userName={user?.display_name} />; break;
    case "meetings": content = <MeetingsScreen open={openMeeting} mode={listMode} retry={() => setListMode("content")} />; break;
    case "meeting-detail": content = <MeetingDetailScreen meeting={meeting} back={() => setScreen("meetings")} />; break;
    case "initiatives": content = <InitiativesScreen open={openInitiative} back={() => setScreen("home")} mode={listMode} retry={() => setListMode("content")} />; break;
    case "initiative-detail": content = <InitiativeDetailScreen initiative={initiative} back={() => setScreen("initiatives")} />; break;
    case "votes": content = <VotesScreen state={votesState} expedientes={expedientes} open={openExpediente} retry={loadVotes} errorMessage={votesError} />; break;
    case "vote-detail": content = expediente ? <VoteDetailScreen expediente={expediente} continueToVote={() => setScreen("vote-confirm")} showResults={() => setScreen("results")} back={() => setScreen("votes")} /> : null; break;
    case "vote-confirm": content = expediente ? <VoteChoiceScreen expediente={expediente} choice={choice} setChoice={setChoice} continueToPreview={() => choice && setScreen("vote-preview")} back={() => setScreen("vote-detail")} /> : null; break;
    case "vote-preview": content = expediente && choice
      ? <VotePreviewScreen expediente={expediente} choice={choice} sending={sending} errorMessage={castError?.message ?? null} canRetry={castError?.canRetry ?? true} confirm={sendVote} back={() => setScreen("vote-confirm")} leave={() => setScreen("votes")} />
      : null; break;
    case "vote-done": content = comprobante ? <VoteDoneScreen comprobante={comprobante} home={() => setScreen("home")} /> : null; break;
    case "results": content = expediente ? <ResultsScreen expediente={expediente} back={() => setScreen("votes")} /> : null; break;
    case "notifications": content = <NotificationsScreen open={openNotice} mode={listMode} retry={() => setListMode("content")} />; break;
    case "notice-detail": content = <NoticeDetailScreen notice={notice} back={() => setScreen("notifications")} />; break;
    case "documents": content = <DocumentsScreen open={openDocument} back={() => setScreen("home")} mode={listMode} retry={() => setListMode("content")} />; break;
    case "document-detail": content = <DocumentDetailScreen document={document} back={() => setScreen("documents")} />; break;
    case "profile": content = <ProfileScreen navigate={setScreen} mode={listMode} setMode={setListMode} userName={user?.display_name ?? ""} userEmail={user?.email ?? ""} onLogout={handleLogout} />; break;
  }

  const showNavigation = screen !== "login" && !(screen === "vote-preview" && sending);
  return <SafeAreaProvider><SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    {demoScreens.includes(screen) ? <DemoNotice /> : null}
    <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>{content}</View>
    </ScrollView>
    {showNavigation ? <BottomNav active={screen} navigate={setScreen} /> : null}
  </SafeAreaView></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy950 },
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.navy950, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.white, fontSize: 15 },
});
