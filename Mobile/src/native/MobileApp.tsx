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
import { ResultsScreen, VoteChoiceScreen, VoteDetailScreen, VoteDoneScreen, VotePreviewScreen, VotesScreen, type VoteDetailState } from "./screens/Voting";
import { login, logout, restoreSession } from "../api/client";
import type { AuthUser } from "../api/types";
import { castVote, checkVoteRegistration, classifyCastError, classifyReadError, getExpediente, listExpedientes, listPendingExpedientes, newClientRequestId, type Expediente } from "../api/votings";

/** Pantallas que todavía usan datos de ejemplo (sin API conectada). */
const demoScreens: Screen[] = ["meetings", "meeting-detail", "initiatives", "initiative-detail", "notifications", "notice-detail", "documents", "document-detail"];

interface CastAttempt { option: string; clientRequestId: string }

interface ReadRequest {
  epoch: number;
  identity: number;
  requestId: number;
}

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
  const [votesCanRetry, setVotesCanRetry] = useState(true);
  const [pendingState, setPendingState] = useState<RemoteState>("loading");
  const [pendingError, setPendingError] = useState<string>();
  const [pendingCanRetry, setPendingCanRetry] = useState(true);
  const [pendingExpedientes, setPendingExpedientes] = useState<Expediente[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailState, setDetailState] = useState<VoteDetailState>("loading");
  const [detailError, setDetailError] = useState<string>();
  const [detailCanRetry, setDetailCanRetry] = useState(true);
  const [choice, setChoice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [castError, setCastError] = useState<{ message: string; canRetry: boolean } | null>(null);
  // observed=true: el GET solo vio que esta cuenta ya votó; no hay opción, fecha ni intento atribuibles.
  const [done, setDone] = useState<{ titulo: string; observed: boolean } | null>(null);
  // Intento de voto sin confirmación del servidor, por votación: un reintento manual reutiliza el mismo UUID.
  const pendingAttempts = useRef(new Map<number, CastAttempt>());
  const sendingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const sessionEpochRef = useRef(0);
  const activeIdentityRef = useRef<number | null>(null);
  const listRequestIdRef = useRef(0);
  const pendingRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const clearReadState = useCallback(() => {
    setVotesState("loading");
    setVotesError(undefined);
    setVotesCanRetry(true);
    setPendingState("loading");
    setPendingError(undefined);
    setPendingCanRetry(true);
    setPendingExpedientes([]);
    setExpedientes([]);
    setExpediente(null);
    setDetailId(null);
    setDetailState("loading");
    setDetailError(undefined);
    setDetailCanRetry(true);
    setChoice(null);
    setCastError(null);
    setDone(null);
  }, []);

  const invalidateReadScope = useCallback(() => {
    sessionEpochRef.current += 1;
    activeIdentityRef.current = null;
    listRequestIdRef.current += 1;
    pendingRequestIdRef.current += 1;
    detailRequestIdRef.current += 1;
    pendingAttempts.current.clear();
    clearReadState();
  }, [clearReadState]);

  const isCurrentRead = useCallback((request: ReadRequest, latestRequestId: number) => (
    request.epoch === sessionEpochRef.current
      && request.identity === activeIdentityRef.current
      && request.requestId === latestRequestId
  ), []);

  const endSession = useCallback((message: string | null) => {
    invalidateReadScope();
    setUser(null);
    setLoginNotice(message);
    setScreen("login");
  }, [invalidateReadScope]);

  const loadVotes = useCallback(async () => {
    const identity = activeIdentityRef.current;
    if (identity === null) return;
    const request: ReadRequest = {
      epoch: sessionEpochRef.current,
      identity,
      requestId: listRequestIdRef.current + 1,
    };
    listRequestIdRef.current = request.requestId;
    setVotesState("loading");
    setVotesError(undefined);
    try {
      const nextExpedientes = await listExpedientes();
      if (!isCurrentRead(request, listRequestIdRef.current)) return;
      setExpedientes(nextExpedientes);
      setVotesCanRetry(false);
      setVotesState("content");
    } catch (error: unknown) {
      if (!isCurrentRead(request, listRequestIdRef.current)) return;
      const failure = classifyReadError(error);
      if (failure.kind === "session_expired") return endSession(failure.message);
      setVotesError(failure.message);
      setVotesCanRetry(failure.canRetry);
      setVotesState("error");
    }
  }, [endSession, isCurrentRead]);

  const loadPending = useCallback(async () => {
    const identity = activeIdentityRef.current;
    if (identity === null) return;
    const request: ReadRequest = {
      epoch: sessionEpochRef.current,
      identity,
      requestId: pendingRequestIdRef.current + 1,
    };
    pendingRequestIdRef.current = request.requestId;
    setPendingState("loading");
    setPendingError(undefined);
    setPendingCanRetry(true);
    setPendingExpedientes([]);
    try {
      const nextPending = await listPendingExpedientes();
      if (!isCurrentRead(request, pendingRequestIdRef.current)) return;
      setPendingExpedientes(nextPending);
      setPendingCanRetry(false);
      setPendingState("content");
    } catch (error: unknown) {
      if (!isCurrentRead(request, pendingRequestIdRef.current)) return;
      const failure = classifyReadError(error);
      if (failure.kind === "session_expired") return endSession(failure.message);
      setPendingError(failure.message);
      setPendingCanRetry(failure.canRetry);
      setPendingState("error");
    }
  }, [endSession, isCurrentRead]);

  const loadDetail = useCallback((id: number) => {
    const identity = activeIdentityRef.current;
    if (identity === null) return;
    const request: ReadRequest = {
      epoch: sessionEpochRef.current,
      identity,
      requestId: detailRequestIdRef.current + 1,
    };
    detailRequestIdRef.current = request.requestId;
    setDetailId(id);
    setExpediente(null);
    setDetailState("loading");
    setDetailError(undefined);
    setDetailCanRetry(true);
    void getExpediente(id)
      .then((fresh) => {
        if (!isCurrentRead(request, detailRequestIdRef.current)) return;
        setExpediente(fresh);
        setDetailState("content");
        setDetailError(undefined);
        setDetailCanRetry(false);
      })
      .catch((error: unknown) => {
        if (!isCurrentRead(request, detailRequestIdRef.current)) return;
        const failure = classifyReadError(error);
        if (failure.kind === "session_expired") {
          endSession(failure.message);
          return;
        }
        setExpediente(null);
        setDetailError(failure.message);
        setDetailCanRetry(failure.canRetry);
        setDetailState(failure.kind === "not_found" ? "not_found" : "error");
      });
  }, [endSession, isCurrentRead]);

  const retryDetail = useCallback(() => {
    if (detailId !== null) loadDetail(detailId);
  }, [detailId, loadDetail]);

  useEffect(() => {
    restoreSession().then((restored) => {
      if (restored) {
        sessionEpochRef.current += 1;
        activeIdentityRef.current = restored.id;
        setUser(restored);
        setScreen("home");
      }
    }).finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (screen === "home" || screen === "votes") void loadPending();
    if (screen === "votes") void loadVotes();
  }, [user, screen, loadPending, loadVotes]);

  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [screen]);

  async function handleLogin(email: string, password: string) {
    invalidateReadScope();
    const signedIn = await login(email, password);
    sessionEpochRef.current += 1;
    activeIdentityRef.current = signedIn.id;
    setLoginNotice(null);
    setUser(signedIn);
    setScreen("home");
  }

  async function handleLogout() {
    pendingAttempts.current.clear();
    invalidateReadScope();
    await logout();
    setUser(null);
    setLoginNotice(null);
    setScreen("login");
  }

  function openMeeting(selected: Meeting) { setMeeting(selected); setScreen("meeting-detail"); }
  function openInitiative(selected: Initiative) { setInitiative(selected); setScreen("initiative-detail"); }
  function openNotice(selected: Notice) { setNotice(selected); setScreen("notice-detail"); }
  function openDocument(selected: DocumentItem) { setDocument(selected); setScreen("document-detail"); }

  function openExpediente(selected: Expediente) {
    setExpediente(selected);
    setDone(null);
    const pending = pendingAttempts.current.get(selected.id);
    if (pending && !selected.ya_voto) {
      // Hay un envío sin respuesta: solo se permite reintentar ese mismo voto.
      detailRequestIdRef.current += 1;
      setChoice(pending.option);
      setCastError({ message: "Hay un envío anterior sin confirmar. Reintenta para obtener la confirmación del servidor.", canRetry: true });
      setScreen("vote-preview");
      return;
    }
    setChoice(null);
    setCastError(null);
    setScreen("vote-detail");
    loadDetail(selected.id);
  }

  async function sendVote() {
    if (!expediente || !choice || sendingRef.current) return;
    const attempt = pendingAttempts.current.get(expediente.id) ?? { option: choice, clientRequestId: newClientRequestId() };
    pendingAttempts.current.set(expediente.id, attempt);
    // Respuesta de otra sesión/cuenta: se descarta sin tocar pantalla ni intentos.
    const epoch = sessionEpochRef.current;
    const identity = activeIdentityRef.current;
    const stale = () => epoch !== sessionEpochRef.current || identity !== activeIdentityRef.current;
    sendingRef.current = true;
    setSending(true);
    try {
      await castVote(expediente, attempt.option, attempt.clientRequestId);
      if (stale()) return;
      pendingAttempts.current.delete(expediente.id);
      setCastError(null);
      setDone({ titulo: expediente.titulo, observed: false });
      setScreen("vote-done");
    } catch (error) {
      if (stale()) return;
      const failure = classifyCastError(error);
      if (failure.kind === "network" || failure.kind === "manual_retry") {
        // POST ambiguo (red/5xx o 401 con sesión renovada): una sola lectura de verificación, nunca un reenvío automático.
        const check = await checkVoteRegistration(expediente.id);
        if (stale()) return;
        if (check.kind === "recorded") {
          pendingAttempts.current.delete(expediente.id);
          setCastError(null);
          setDone({ titulo: expediente.titulo, observed: true });
          setScreen("vote-done");
          return;
        }
        if (check.failure === "session_expired") {
          endSession("La sesión expiró y no pudimos confirmar si tu voto quedó registrado. Inicia sesión y revisa la votación antes de volver a votar.");
          return;
        }
        setCastError({ message: "No se pudo confirmar el envío. No pudimos confirmar si tu voto quedó registrado. Si reintentas, se reenviará el mismo voto con la misma opción y el servidor no lo duplicará.", canRetry: true });
        return;
      }
      if (!failure.canRetrySameVote) pendingAttempts.current.delete(expediente.id);
      if (failure.kind === "session_expired") {
        endSession("La sesión expiró y no pudimos confirmar si tu voto quedó registrado. Inicia sesión y revisa la votación antes de volver a votar.");
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
      if (screen === "vote-preview") {
        // Durante el envío se bloquea; tras un intento sin confirmar no se vuelve a cambiar opción.
        if (!sending) setScreen(castError ? "votes" : "vote-confirm");
        return true;
      }
      const destination = parent[screen];
      if (!destination) return false;
      setScreen(destination);
      return true;
    });
    return () => subscription.remove();
  }, [screen, sending, castError]);

  if (!fontsLoaded || booting) return <View style={styles.loading}><Text style={styles.loadingText}>Cargando…</Text></View>;
  const pendingVote = pendingExpedientes[0];
  let content: ReactNode;
  switch (screen) {
    case "login": content = <LoginScreen onLogin={handleLogin} notice={loginNotice} />; break;
    case "home": content = <HomeScreen navigate={setScreen} openMeeting={() => openMeeting(meetings[0])} pending={pendingVote} openPending={openExpediente} userName={user?.display_name} />; break;
    case "meetings": content = <MeetingsScreen open={openMeeting} mode={listMode} retry={() => setListMode("content")} />; break;
    case "meeting-detail": content = <MeetingDetailScreen meeting={meeting} back={() => setScreen("meetings")} />; break;
    case "initiatives": content = <InitiativesScreen open={openInitiative} back={() => setScreen("home")} mode={listMode} retry={() => setListMode("content")} />; break;
    case "initiative-detail": content = <InitiativeDetailScreen initiative={initiative} back={() => setScreen("initiatives")} />; break;
    case "votes": content = <VotesScreen
      state={votesState}
      expedientes={expedientes}
      open={openExpediente}
      retry={loadVotes}
      canRetry={votesCanRetry}
      errorMessage={votesError}
      pendingState={pendingState}
      pendingExpedientes={pendingExpedientes}
      retryPending={loadPending}
      pendingCanRetry={pendingCanRetry}
      pendingErrorMessage={pendingError}
    />; break;
    case "vote-detail": content = <VoteDetailScreen
      state={detailState}
      expediente={expediente}
      errorMessage={detailError}
      canRetry={detailCanRetry}
      retry={retryDetail}
      continueToVote={() => setScreen("vote-confirm")}
      showResults={() => setScreen("results")}
      back={() => setScreen("votes")}
    />; break;
    case "vote-confirm": content = expediente ? <VoteChoiceScreen expediente={expediente} choice={choice} setChoice={setChoice} continueToPreview={() => choice && setScreen("vote-preview")} back={() => setScreen("vote-detail")} /> : null; break;
    case "vote-preview": content = expediente && choice
      ? <VotePreviewScreen expediente={expediente} choice={choice} sending={sending} errorMessage={castError?.message ?? null} canRetry={castError?.canRetry ?? true} confirm={sendVote} back={() => setScreen("vote-confirm")} leave={() => setScreen("votes")} />
      : null; break;
    case "vote-done": content = done ? <VoteDoneScreen titulo={done.titulo} observed={done.observed} home={() => setScreen("home")} /> : null; break;
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
