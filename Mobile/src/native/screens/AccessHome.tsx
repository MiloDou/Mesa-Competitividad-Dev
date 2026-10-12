import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Header, PrimaryButton, Section } from "../components";
import { meetings, proposals } from "../data";
import { colors, fonts, radius, space } from "../theme";
import type { Screen } from "../types";

export function LoginScreen({ enterDemo, onLogin }: { enterDemo: () => void; onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    try { await onLogin(email.trim(), password); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible iniciar sesión."); }
    finally { setBusy(false); }
  }
  return <View style={styles.login}>
    <View style={styles.loginIntro}>
      <Text style={styles.brand}>MESA DE COMPETITIVIDAD</Text>
      <Text style={styles.loginTitle}>Iniciar sesión</Text>
      <Text style={styles.loginSubtitle}>Interfaz para miembros de la Mesa</Text>
    </View>
    <View style={styles.form}>
      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput accessibilityLabel="Correo electrónico" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="correo@ejemplo.invalid" placeholderTextColor={colors.muted} style={styles.input} />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput accessibilityLabel="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholder="Contraseña" placeholderTextColor={colors.muted} style={styles.input} />
      {error ? <Text accessibilityRole="alert" style={styles.note}>{error}</Text> : null}
      <PrimaryButton label="Iniciar sesión" onPress={submit} loading={busy} />
      <PrimaryButton label="Entrar a la demostración" onPress={enterDemo} secondary busy={busy} />
      <Text style={styles.note}>La sesión real requiere una cuenta habilitada para la API. La demostración conserva datos sintéticos.</Text>
    </View>
  </View>;
}

export function HomeScreen({ navigate, openMeeting, openProposal, meetings: meetingList = meetings, proposals: proposalList = proposals }: {
  navigate: (screen: Screen) => void;
  openMeeting: () => void;
  openProposal: () => void;
  meetings?: typeof meetings;
  proposals?: typeof proposals;
}) {
  const nextMeeting = meetingList[0];
  const pending = proposalList.find((proposal) => proposal.status === "abierta" && !proposal.memberHasVoted);
  return <>
    <Header title="Inicio" subtitle="Tu actividad de la Mesa" />
    <Section>
      {nextMeeting ? <Card eyebrow="Próxima reunión" title={nextMeeting.title} detail={`${nextMeeting.date} · ${nextMeeting.time} · ${nextMeeting.place}`} onPress={openMeeting} /> : null}
      {pending ? <Card eyebrow="Propuesta disponible" title={pending.title} detail="Revisa su contenido antes de elegir una opción." onPress={openProposal} /> : null}
      <PrimaryButton label="Ver votaciones" onPress={() => navigate("votes")} />
      <PrimaryButton label="Consultar iniciativas" onPress={() => navigate("initiatives")} secondary />
      <PrimaryButton label="Consultar documentos" onPress={() => navigate("documents")} secondary />
    </Section>
  </>;
}

const styles = StyleSheet.create({
  login: { flex: 1, backgroundColor: colors.navy950 },
  loginIntro: { paddingHorizontal: space.lg, paddingTop: 100, paddingBottom: 40 },
  brand: { color: colors.gold, fontSize: 12, fontFamily: fonts.bold, letterSpacing: 1.5 },
  loginTitle: { color: colors.white, fontSize: 30, fontFamily: fonts.bold, marginTop: 32 },
  loginSubtitle: { color: colors.celeste, fontSize: 14, fontFamily: fonts.regular, marginTop: space.xs },
  form: { paddingHorizontal: space.lg, gap: space.sm },
  label: { color: colors.white, fontSize: 13, fontFamily: fonts.semibold },
  input: { backgroundColor: colors.white, borderRadius: radius.button, minHeight: 52, paddingHorizontal: space.md, color: colors.text, fontSize: 15, fontFamily: fonts.regular, marginBottom: space.xs },
  note: { color: colors.celeste, fontSize: 12, fontFamily: fonts.regular, lineHeight: 18, marginTop: space.xs },
});
