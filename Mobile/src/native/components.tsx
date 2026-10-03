import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space } from "./theme";
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

export function Card({ eyebrow, title, detail, onPress, children }: {
  eyebrow?: string; title: string; detail?: string; onPress?: () => void; children?: ReactNode;
}) {
  const content = <>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
    <Text style={styles.cardTitle}>{title}</Text>
    {detail ? <Text style={styles.cardDetail}>{detail}</Text> : null}
    {children}
  </>;
  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>{content}</Pressable>
    : <View style={styles.card}>{content}</View>;
}

export function PrimaryButton({ label, onPress, disabled = false, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable
    accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && styles.pressed]}
  ><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}

export function Section({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

export function ListContent({ mode, emptyTitle, children, onRetry }: {
  mode: DemoListMode; emptyTitle: string; children: ReactNode; onRetry: () => void;
}) {
  if (mode === "content") return <>{children}</>;
  if (mode === "loading") return <View style={styles.feedback} accessibilityRole="progressbar">
    <ActivityIndicator size="large" color={colors.navy900} />
    <Text style={styles.feedbackTitle}>Cargando información…</Text>
    <Text style={styles.feedbackDetail}>Vista de ejemplo mientras llegan los datos.</Text>
  </View>;
  if (mode === "empty") return <View style={styles.feedback}>
    <Text style={styles.feedbackTitle}>{emptyTitle}</Text>
    <Text style={styles.feedbackDetail}>Cuando haya información disponible, aparecerá en esta sección.</Text>
  </View>;
  return <View style={styles.feedback} accessibilityRole="alert">
    <Text style={styles.feedbackTitle}>No se pudo cargar la información</Text>
    <Text style={styles.feedbackDetail}>Revisa tu conexión e inténtalo de nuevo.</Text>
    <PrimaryButton label="Reintentar" onPress={onRetry} secondary />
  </View>;
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
  eyebrow: { color: colors.navy900, fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.8, marginBottom: space.xs },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.md, minHeight: 76, gap: 4 },
  cardTitle: { color: colors.navy900, fontSize: 16, fontFamily: fonts.bold, lineHeight: 22 },
  cardDetail: { color: colors.muted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 19, marginTop: 3 },
  button: { backgroundColor: colors.navy900, borderRadius: radius.button, minHeight: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: space.md },
  buttonText: { color: colors.white, fontSize: 15, fontFamily: fonts.bold, textAlign: "center" },
  secondary: { backgroundColor: colors.white, borderColor: colors.navy900, borderWidth: 1 },
  secondaryText: { color: colors.navy900 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  section: { padding: space.lg, gap: space.md },
  feedback: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.lg, minHeight: 180, justifyContent: "center", gap: space.sm },
  feedbackTitle: { color: colors.navy900, fontSize: 17, fontFamily: fonts.bold, lineHeight: 23 },
  feedbackDetail: { color: colors.muted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20 },
  nav: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", minHeight: 68 },
  tab: { flex: 1, minHeight: 68, alignItems: "center", justifyContent: "center", gap: 2 },
  tabSymbol: { color: colors.muted, fontSize: 19, fontFamily: fonts.bold },
  tabLabel: { color: colors.muted, fontSize: 10, fontFamily: fonts.regular },
  tabSelected: { color: colors.navy900, fontFamily: fonts.bold },
});
