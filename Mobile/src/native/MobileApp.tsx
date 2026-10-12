import { useEffect, useRef, useState, type ReactNode } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts, Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from "@expo-google-fonts/montserrat";
import { BottomNav, DemoNotice } from "./components";
import { documents, initiatives, meetings, notices, proposals } from "./data";
import { colors } from "./theme";
import type { DemoListMode, DocumentItem, Initiative, Meeting, Notice, Proposal, Screen, VoteChoice } from "./types";
import { castVote, createRequestId, fetchDocuments, fetchInitiatives, fetchMeetings, fetchNotifications, fetchPublicInitiatives, fetchResults, fetchVotings, getMobileSession, login, logout, markNotificationRead, type MobileSession } from "./api/client";
import { HomeScreen, LoginScreen } from "./screens/AccessHome";
import { MeetingDetailScreen, MeetingsScreen } from "./screens/Meetings";
import { DocumentDetailScreen, DocumentsScreen, NoticeDetailScreen, NotificationsScreen, ProfileScreen } from "./screens/Information";
import { InitiativeDetailScreen, InitiativesScreen } from "./screens/Initiatives";
import { ResultsScreen, VoteChoiceScreen, VoteDetailScreen, VoteDoneScreen, VotePreviewScreen, VotesScreen } from "./screens/Voting";

export default function MobileApp() {
  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold });
  const [screen, setScreen] = useState<Screen>("login");
  const [meeting, setMeeting] = useState<Meeting>(meetings[0]);
  const [initiative, setInitiative] = useState<Initiative>(initiatives[0]);
  const [notice, setNotice] = useState<Notice>(notices[0]);
  const [document, setDocument] = useState<DocumentItem>(documents[0]);
  const [proposal, setProposal] = useState<Proposal>(proposals[0]);
  const [choice, setChoice] = useState<VoteChoice | null>(null);
  const [listMode, setListMode] = useState<DemoListMode>("content");
  const [initiativeList, setInitiativeList] = useState(initiatives);
  const [initiativesConnected, setInitiativesConnected] = useState(false);
  const [meetingList, setMeetingList] = useState(meetings);
  const [meetingsConnected, setMeetingsConnected] = useState(false);
  const [voteList, setVoteList] = useState(proposals);
  const [votesConnected, setVotesConnected] = useState(false);
  const [noticeList, setNoticeList] = useState(notices);
  const [notificationsConnected, setNotificationsConnected] = useState(false);
  const [documentList, setDocumentList] = useState(documents);
  const [documentsConnected, setDocumentsConnected] = useState(false);
  const [mobileSession, setMobileSession] = useState<MobileSession | null>(getMobileSession());
  const [voteRequestId, setVoteRequestId] = useState("");
  const [voteError, setVoteError] = useState("");
  const [voteBusy, setVoteBusy] = useState(false);
  const [registeredVote, setRegisteredVote] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function openMeeting(selected: Meeting) { setMeeting(selected); setScreen("meeting-detail"); }
  function openInitiative(selected: Initiative) { setInitiative(selected); setScreen("initiative-detail"); }
  function openNotice(selected: Notice) { setNotice(selected); setScreen("notice-detail"); }
  function openDocument(selected: DocumentItem) { setDocument(selected); setScreen("document-detail"); }
  function openProposal(selected: Proposal) { setProposal(selected); setChoice(null); setVoteError(""); setVoteRequestId(createRequestId()); setRegisteredVote(false); setScreen("vote-detail"); }
  async function showResults(selected: Proposal) {
    if (selected.rawStatus === "closed") {
      try { setProposal({ ...selected, results: await fetchResults(selected.id) }); }
      catch { setProposal(selected); }
    } else setProposal(selected);
    setScreen("results");
  }

  async function loadPrivateData() {
    if (!getMobileSession()) return;
    const [meetingResult, initiativeResult, votingResult, notificationResult, documentResult] = await Promise.allSettled([
      fetchMeetings(), fetchInitiatives(), fetchVotings(), fetchNotifications(), fetchDocuments(),
    ]);
    if (meetingResult.status === "fulfilled") { setMeetingList(meetingResult.value); setMeetingsConnected(true); }
    if (initiativeResult.status === "fulfilled") { setInitiativeList(initiativeResult.value); setInitiativesConnected(true); }
    if (votingResult.status === "fulfilled") { setVoteList(votingResult.value); setVotesConnected(true); }
    if (notificationResult.status === "fulfilled") { setNoticeList(notificationResult.value); setNotificationsConnected(true); }
    if (documentResult.status === "fulfilled") { setDocumentList(documentResult.value); setDocumentsConnected(true); }
    const currentSession = getMobileSession();
    setMobileSession(currentSession);
    if (!currentSession) setScreen("login");
  }

  async function handleLogin(email: string, password: string) {
    const session = await login(email, password);
    setMobileSession(session);
    setInitiativesConnected(false); setMeetingsConnected(false); setVotesConnected(false);
    setNotificationsConnected(false); setDocumentsConnected(false);
    setScreen("home");
  }

  async function handleLogout() {
    await logout().catch(() => undefined);
    setMobileSession(null);
    setMeetingList(meetings); setInitiativeList(initiatives); setVoteList(proposals);
    setNoticeList(notices); setDocumentList(documents);
    setMeetingsConnected(false); setInitiativesConnected(false); setVotesConnected(false);
    setNotificationsConnected(false); setDocumentsConnected(false);
    setScreen("login");
  }

  async function confirmVote() {
    if (!mobileSession || !proposal.rawStatus || !choice) { setRegisteredVote(true); setScreen("vote-done"); return; }
    setVoteBusy(true); setVoteError("");
    try {
      await castVote(proposal.id, choice, voteRequestId);
      setRegisteredVote(true); setScreen("vote-done");
      void loadPrivateData();
    } catch (error) { setVoteError(error instanceof Error ? error.message : "No fue posible registrar el voto."); }
    finally { setVoteBusy(false); }
  }

  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [screen]);

  useEffect(() => {
    if (mobileSession) { void loadPrivateData(); return; }
    let active = true;
    fetchPublicInitiatives().then((items) => {
      if (active) { setInitiativeList(items); setInitiativesConnected(true); }
    }).catch(() => { /* Sin API se conserva el contenido de demostración actual. */ });
    return () => { active = false; };
  }, [mobileSession?.access]);

  useEffect(() => {
    const parent: Partial<Record<Screen, Screen>> = {
      "meeting-detail": "meetings",
      "initiative-detail": "initiatives",
      "notice-detail": "notifications",
      "document-detail": "documents",
      meetings: "home",
      initiatives: "home",
      notifications: "home",
      documents: "home",
      profile: "home",
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      const destination = parent[screen];
      if (!destination) return false;
      setScreen(destination);
      return true;
    });
    return () => subscription.remove();
  }, [screen]);

  const showNavigation = screen !== "login";
  if (!fontsLoaded) return <View style={styles.loading}><Text style={styles.loadingText}>Cargando interfaz…</Text></View>;
  let content: ReactNode;
  switch (screen) {
    case "login": content = <LoginScreen enterDemo={() => { setMobileSession(null); setScreen("home"); }} onLogin={handleLogin} />; break;
    case "home": content = <HomeScreen navigate={setScreen} openMeeting={() => meetingList[0] ? openMeeting(meetingList[0]) : setScreen("meetings")} openProposal={() => { const next = voteList.find((item) => item.status === "abierta" && !item.memberHasVoted); if (next) openProposal(next); else setScreen("votes"); }} meetings={meetingList} proposals={voteList} />; break;
    case "meetings": content = <MeetingsScreen open={openMeeting} mode={listMode} retry={() => mobileSession ? void loadPrivateData() : setListMode("content")} meetings={meetingList} connected={meetingsConnected} />; break;
    case "meeting-detail": content = <MeetingDetailScreen meeting={meeting} back={() => setScreen("meetings")} />; break;
    case "initiatives": content = <InitiativesScreen open={openInitiative} back={() => setScreen("home")} mode={listMode} retry={() => setListMode("content")} initiatives={initiativeList} connected={initiativesConnected} />; break;
    case "initiative-detail": content = <InitiativeDetailScreen initiative={initiative} back={() => setScreen("initiatives")} />; break;
    case "votes": content = <VotesScreen open={openProposal} showResults={showResults} proposals={voteList} connected={votesConnected} />; break;
    case "vote-detail": content = <VoteDetailScreen proposal={proposal} continueToVote={() => setScreen("vote-confirm")} back={() => setScreen("votes")} />; break;
    case "vote-confirm": content = <VoteChoiceScreen proposal={proposal} choice={choice} setChoice={setChoice} continueToPreview={() => choice && setScreen("vote-preview")} back={() => setScreen("vote-detail")} />; break;
    case "vote-preview": content = choice ? <VotePreviewScreen proposal={proposal} choice={choice} confirm={confirmVote} back={() => setScreen("vote-confirm")} live={Boolean(proposal.rawStatus)} error={voteError} busy={voteBusy} /> : <VotesScreen open={openProposal} showResults={showResults} proposals={voteList} connected={votesConnected} />; break;
    case "vote-done": content = <VoteDoneScreen proposal={proposal} home={() => setScreen("home")} live={registeredVote && Boolean(proposal.rawStatus)} />; break;
    case "results": content = <ResultsScreen proposal={proposal} back={() => setScreen("votes")} />; break;
    case "notifications": content = <NotificationsScreen open={(selected) => { openNotice(selected); if (mobileSession && !selected.detail.includes("Leído")) void markNotificationRead(selected.id).then(loadPrivateData).catch(() => undefined); }} mode={listMode} retry={() => mobileSession ? void loadPrivateData() : setListMode("content")} notices={noticeList} connected={notificationsConnected} />; break;
    case "notice-detail": content = <NoticeDetailScreen notice={notice} back={() => setScreen("notifications")} />; break;
    case "documents": content = <DocumentsScreen open={openDocument} back={() => setScreen("home")} mode={listMode} retry={() => mobileSession ? void loadPrivateData() : setListMode("content")} documents={documentList} connected={documentsConnected} />; break;
    case "document-detail": content = <DocumentDetailScreen document={document} back={() => setScreen("documents")} />; break;
    case "profile": content = <ProfileScreen navigate={setScreen} mode={listMode} setMode={setListMode} displayName={mobileSession?.user.display_name} onLogout={mobileSession ? handleLogout : undefined} />; break;
  }

  return <SafeAreaProvider><SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    {showNavigation ? <DemoNotice connected={Boolean(mobileSession) || initiativesConnected} label={mobileSession ? "Sesión real · datos según permisos" : undefined} /> : null}
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
