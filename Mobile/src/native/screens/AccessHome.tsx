import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Header, PrimaryButton, Section } from "../components";
import { meetings, proposals } from "../data";
import { colors, fonts, radius, space } from "../theme";
import type { Screen } from "../types";

export function LoginScreen({ enterDemo }: { enterDemo: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <PrimaryButton label="Entrar a la demostración" onPress={enterDemo} />
      <Text style={styles.note}>Estos campos aún no autentican. No introduzcas credenciales reales.</Text>
    </View>
  </View>;
}

export function HomeScreen({ navigate, openMeeting, openProposal }: {
  navigate: (screen: Screen) => void;
  openMeeting: () => void;
  openProposal: () => void;
}) {
  const pending = proposals.find((proposal) => proposal.status === "abierta");
  return <>
    <Header title="Inicio" subtitle="Tu actividad de la Mesa" />
    <Section>
      <Card eyebrow="Próxima reunión" title={meetings[0].title} detail={`${meetings[0].date} · ${meetings[0].time} · ${meetings[0].place}`} onPress={openMeeting} />
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
