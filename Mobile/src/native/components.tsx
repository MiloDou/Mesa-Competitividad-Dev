import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space } from "./theme";
export { Card, ConfirmationDialog, EmptyState, ErrorState, LoadingState, PrimaryButton } from "../ui";
import { EmptyState, ErrorState, LoadingState } from "../ui";
import type { DemoListMode, Screen } from "./types";

export function DemoNotice() {
  return <View style={styles.demo}><Text style={styles.demoText}>Vista de demostración · datos de ejemplo</Text></View>;
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
    {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
  </View>;
}

export function Section({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

export function ListContent({ mode, emptyTitle, children, onRetry }: {
  mode: DemoListMode; emptyTitle: string; children: ReactNode; onRetry: () => void;
}) {
  if (mode === "content") return <>{children}</>;
  if (mode === "loading") return <LoadingState />;
  if (mode === "empty") return <EmptyState title={emptyTitle} />;
  return <ErrorState onRetry={onRetry} />;
}

const tabs: { screen: Screen; label: string; symbol: string }[] = [
  { screen: "home", label: "Inicio", symbol: "⌂" },
  { screen: "meetings", label: "Reuniones", symbol: "▦" },
  { screen: "votes", label: "Votar", symbol: "✓" },
  { screen: "notifications", label: "Avisos", symbol: "◉" },
  { screen: "profile", label: "Perfil", symbol: "○" },
];

export function BottomNav({ active, navigate }: { active: Screen; navigate: (screen: Screen) => void }) {
  return <View style={styles.nav}>{tabs.map((tab) => {
    const selected = active === tab.screen || (tab.screen === "votes" && ["vote-detail", "vote-confirm", "vote-preview", "vote-done", "results"].includes(active)) || (tab.screen === "meetings" && active === "meeting-detail") || (tab.screen === "home" && ["documents", "document-detail", "initiatives", "initiative-detail"].includes(active)) || (tab.screen === "notifications" && active === "notice-detail");
    return <Pressable key={tab.screen} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => navigate(tab.screen)} style={styles.tab}>
      <Text style={[styles.tabSymbol, selected && styles.tabSelected]}>{tab.symbol}</Text>
      <Text style={[styles.tabLabel, selected && styles.tabSelected]}>{tab.label}</Text>
    </Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  demo: { backgroundColor: colors.navy100, paddingHorizontal: space.md, paddingVertical: space.xs },
  demoText: { color: colors.navy900, fontSize: 11, fontFamily: fonts.semibold, textAlign: "center" },
  header: { backgroundColor: colors.navy950, paddingHorizontal: space.lg, paddingTop: 38, paddingBottom: 32 },
  headerTitle: { color: colors.white, fontSize: 26, fontFamily: fonts.bold, lineHeight: 33 },
  headerSubtitle: { color: colors.celeste, fontSize: 13, fontFamily: fonts.regular, marginTop: 5 },
  section: { padding: space.lg, gap: space.md },
  nav: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", minHeight: 68 },
  tab: { flex: 1, minHeight: 68, alignItems: "center", justifyContent: "center", gap: 2 },
  tabSymbol: { color: colors.muted, fontSize: 19, fontFamily: fonts.bold },
  tabLabel: { color: colors.muted, fontSize: 10, fontFamily: fonts.regular },
  tabSelected: { color: colors.navy900, fontFamily: fonts.bold },
});
