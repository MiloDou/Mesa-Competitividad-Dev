import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Header, PrimaryButton, Section } from "../components";
import { meetings } from "../data";
import { colors, fonts, radius, space } from "../theme";
import type { Screen } from "../types";
import type { Expediente } from "../../api/votings";

export function LoginScreen({ onLogin, notice }: { onLogin: (email: string, password: string) => Promise<void>; notice?: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice ?? null);

  // El estado tarda un render en deshabilitar el botón; el ref evita enviar varios logins por toques rápidos.
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesión.");
      setBusy(false);
      submitting.current = false;
    }
  }
  return <View style={styles.login}>
    <View style={styles.loginIntro}>
      <Text style={styles.brand}>MESA DE COMPETITIVIDAD</Text>
      <Text style={styles.loginTitle}>Iniciar sesión</Text>
      <Text style={styles.loginSubtitle}>Interfaz para miembros de la Mesa</Text>
    </View>
    <View style={styles.form}>
      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput accessibilityLabel="Correo electrónico" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="correo@ejemplo.invalid" placeholderTextColor={colors.muted} style={styles.input} />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput accessibilityLabel="Contraseña" secureTextEntry autoCapitalize="none" autoCorrect={false} value={password} onChangeText={setPassword} placeholder="Contraseña" placeholderTextColor={colors.muted} style={styles.input} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Iniciar sesión" onPress={submit} loading={busy} disabled={!email.trim() || !password} />
      <Text style={styles.note}>Usa la cuenta de miembro que te asignó la Mesa.</Text>
    </View>
  </View>;
}

export function HomeScreen({ navigate, openMeeting, pending, openPending, userName }: {
  navigate: (screen: Screen) => void;
  openMeeting: () => void;
  pending?: Expediente;
  openPending: (expediente: Expediente) => void;
  userName?: string;
}) {
  return <>
    <Header title="Inicio" subtitle={userName ? `Hola, ${userName}` : "Tu actividad de la Mesa"} />
    <Section>
      <Card eyebrow="Próxima reunión · ejemplo" title={meetings[0].title} detail={`${meetings[0].date} · ${meetings[0].time} · ${meetings[0].place}`} onPress={openMeeting} />
      {pending ? <Card eyebrow="Votación pendiente" title={pending.titulo} detail="Revisa su contenido antes de elegir una opción." onPress={() => openPending(pending)} /> : null}
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
  error: { color: colors.navy950, backgroundColor: colors.white, borderRadius: radius.button, padding: space.sm, fontSize: 13, fontFamily: fonts.semibold, lineHeight: 19 },
  note: { color: colors.celeste, fontSize: 12, fontFamily: fonts.regular, lineHeight: 18, marginTop: space.xs },
});
