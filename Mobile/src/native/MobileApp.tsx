import { useEffect, useRef, useState, type ReactNode } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts, Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from "@expo-google-fonts/montserrat";
import { BottomNav, DemoNotice } from "./components";
import { documents, initiatives, meetings, notices, proposals } from "./data";
import { colors } from "./theme";
import type { DemoListMode, DocumentItem, Initiative, Meeting, Notice, Proposal, Screen, VoteChoice } from "./types";
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
  const scrollRef = useRef<ScrollView>(null);

  function openMeeting(selected: Meeting) { setMeeting(selected); setScreen("meeting-detail"); }
  function openInitiative(selected: Initiative) { setInitiative(selected); setScreen("initiative-detail"); }
  function openNotice(selected: Notice) { setNotice(selected); setScreen("notice-detail"); }
  function openDocument(selected: DocumentItem) { setDocument(selected); setScreen("document-detail"); }
  function openProposal(selected: Proposal) { setProposal(selected); setChoice(null); setScreen("vote-detail"); }
  function showResults(selected: Proposal) { setProposal(selected); setScreen("results"); }

  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [screen]);

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
    case "login": content = <LoginScreen enterDemo={() => setScreen("home")} />; break;
    case "home": content = <HomeScreen navigate={setScreen} openMeeting={() => openMeeting(meetings[0])} openProposal={() => openProposal(proposals[0])} />; break;
    case "meetings": content = <MeetingsScreen open={openMeeting} mode={listMode} retry={() => setListMode("content")} />; break;
    case "meeting-detail": content = <MeetingDetailScreen meeting={meeting} back={() => setScreen("meetings")} />; break;
    case "initiatives": content = <InitiativesScreen open={openInitiative} back={() => setScreen("home")} mode={listMode} retry={() => setListMode("content")} />; break;
    case "initiative-detail": content = <InitiativeDetailScreen initiative={initiative} back={() => setScreen("initiatives")} />; break;
    case "votes": content = <VotesScreen open={openProposal} showResults={showResults} />; break;
    case "vote-detail": content = <VoteDetailScreen proposal={proposal} continueToVote={() => setScreen("vote-confirm")} back={() => setScreen("votes")} />; break;
    case "vote-confirm": content = <VoteChoiceScreen proposal={proposal} choice={choice} setChoice={setChoice} continueToPreview={() => choice && setScreen("vote-preview")} back={() => setScreen("vote-detail")} />; break;
    case "vote-preview": content = choice ? <VotePreviewScreen proposal={proposal} choice={choice} confirm={() => setScreen("vote-done")} back={() => setScreen("vote-confirm")} /> : <VotesScreen open={openProposal} showResults={showResults} />; break;
    case "vote-done": content = <VoteDoneScreen proposal={proposal} home={() => setScreen("home")} />; break;
    case "results": content = <ResultsScreen proposal={proposal} back={() => setScreen("votes")} />; break;
    case "notifications": content = <NotificationsScreen open={openNotice} mode={listMode} retry={() => setListMode("content")} />; break;
    case "notice-detail": content = <NoticeDetailScreen notice={notice} back={() => setScreen("notifications")} />; break;
    case "documents": content = <DocumentsScreen open={openDocument} back={() => setScreen("home")} mode={listMode} retry={() => setListMode("content")} />; break;
    case "document-detail": content = <DocumentDetailScreen document={document} back={() => setScreen("documents")} />; break;
    case "profile": content = <ProfileScreen navigate={setScreen} mode={listMode} setMode={setListMode} />; break;
  }

  return <SafeAreaProvider><SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    {showNavigation ? <DemoNotice /> : null}
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
