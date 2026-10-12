import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Header, PrimaryButton, Section } from "../components";
import { proposals as demoProposals } from "../data";
import { colors, fonts, radius, space } from "../theme";
import type { Proposal, VoteChoice } from "../types";

const choices: { value: VoteChoice; label: string; detail: string }[] = [
  { value: "favor", label: "A favor", detail: "Apruebo la propuesta" },
  { value: "contra", label: "En contra", detail: "No apruebo la propuesta" },
  { value: "abstencion", label: "Abstención", detail: "No emito una postura" },
];

export function VotesScreen({ open, showResults, proposals = demoProposals, connected = false }: { open: (proposal: Proposal) => void; showResults: (proposal: Proposal) => void; proposals?: Proposal[]; connected?: boolean }) {
  return <>
    <Header title="Votaciones" subtitle={connected ? "Procesos visibles para tu cuenta" : "Demostración local · propuestas de ejemplo"} />
    <Section>{proposals.length === 0 ? <Card eyebrow={connected ? "Datos del servidor" : "Demostración local"} title="No hay votaciones disponibles" detail="Cuando tu cuenta tenga procesos visibles, aparecerán aquí." /> : proposals.map((proposal) =>
      <Card key={proposal.id} eyebrow={proposal.memberHasVoted ? "Voto registrado" : proposal.status === "abierta" ? "Abierta" : "Cerrada"} title={proposal.title} detail={`${proposal.summary} · Cierre: ${proposal.deadline}`} onPress={() => proposal.status === "abierta" && !proposal.memberHasVoted ? open(proposal) : showResults(proposal)} />
    )}</Section>
  </>;
}

export function VoteDetailScreen({ proposal, continueToVote, back }: { proposal: Proposal; continueToVote: () => void; back: () => void }) {
  return <>
    <Header title="Propuesta" subtitle={proposal.title} />
    <Section>
      <Card eyebrow="Contenido" title={proposal.title} detail={proposal.summary} />
      <Card eyebrow="Cierre" title={proposal.deadline} detail="Revisa la propuesta antes de elegir una opción." />
      <PrimaryButton label="Elegir mi voto" onPress={continueToVote} />
      <PrimaryButton label="Volver a propuestas" onPress={back} secondary />
    </Section>
  </>;
}

export function VoteChoiceScreen({ proposal, choice, setChoice, continueToPreview, back }: {
  proposal: Proposal; choice: VoteChoice | null; setChoice: (choice: VoteChoice) => void;
  continueToPreview: () => void; back: () => void;
}) {
  const options = proposal.options?.length ? proposal.options.map((value) => ({ value, label: value, detail: "Opción registrada para esta votación" })) : choices;
  return <>
    <Header title="Emitir voto" subtitle={proposal.title} />
    <Section>
      <Text style={styles.prompt}>Selecciona una opción</Text>
      {options.map((option) => <Pressable
        key={option.value} accessibilityRole="radio" accessibilityState={{ checked: choice === option.value }}
        onPress={() => setChoice(option.value)} style={[styles.option, choice === option.value && styles.selected]}
      ><Text style={styles.optionTitle}>{option.label}</Text><Text style={styles.optionDetail}>{option.detail}</Text></Pressable>)}
      <PrimaryButton label="Revisar elección" onPress={continueToPreview} disabled={!choice} />
      <PrimaryButton label="Volver a propuesta" onPress={back} secondary />
    </Section>
  </>;
}

export function VotePreviewScreen({ proposal, choice, confirm, back, live = false, error = "", busy = false }: { proposal: Proposal; choice: VoteChoice; confirm: () => void; back: () => void; live?: boolean; error?: string; busy?: boolean }) {
  const label = proposal.options?.includes(choice) ? choice : choices.find((option) => option.value === choice)?.label ?? choice;
  return <>
    <Header title="Confirmar elección" subtitle="Revisa antes de continuar" />
    <Section>
      <Card eyebrow="Propuesta" title={proposal.title} detail={`Opción seleccionada: ${label}`} />
      {live ? <Text style={styles.warning}>Se enviará la elección a la API. El servidor validará que la votación siga abierta y que tu cuenta pueda participar.</Text> : <Text style={styles.warning}>Demostración: confirmar aquí no enviará ni registrará un voto real.</Text>}
      {error ? <Text accessibilityRole="alert" style={styles.warning}>{error}</Text> : null}
      <PrimaryButton label={busy ? "Enviando voto…" : live ? "Enviar voto" : "Confirmar demostración"} onPress={confirm} busy={busy} />
      <PrimaryButton label="Cambiar opción" onPress={back} secondary busy={busy} />
    </Section>
  </>;
}

export function VoteDoneScreen({ proposal, home, live = false }: { proposal: Proposal; home: () => void; live?: boolean }) {
  return <>
    <Header title="Recorrido completado" subtitle="Vista de confirmación" />
    <Section>
      <Card eyebrow={live ? "Voto registrado" : "Demostración"} title={live ? "Tu voto quedó registrado" : "Así se verá la confirmación"} detail={live ? `El servidor confirmó tu participación en: ${proposal.title}.` : `Propuesta: ${proposal.title}. Ningún voto se guardó en un servidor.`} />
      <PrimaryButton label="Volver al inicio" onPress={home} />
    </Section>
  </>;
}

export function ResultsScreen({ proposal, back }: { proposal: Proposal; back: () => void }) {
  return <>
    <Header title="Resultados" subtitle={proposal.title} />
    <Section>
      <Card eyebrow={proposal.results ? "Resultados del servidor" : "Propuesta de ejemplo"} title={proposal.title} detail={`Cierre indicado: ${proposal.deadline}`} />
      <View style={styles.resultPanel}>
        <Text style={styles.resultEyebrow}>ESTADO DE LA VOTACIÓN</Text>
        <Text style={styles.resultTitle}>Votación cerrada</Text>
        <Text style={styles.resultDetail}>{proposal.results ? `${proposal.results.total_votes} votos emitidos` : "Publicación de resultados pendiente"}</Text>
      </View>
      {proposal.results ? Object.entries(proposal.results.results).map(([option, count]) => <Card key={option} eyebrow={`${proposal.results?.percentages[option] ?? 0}%`} title={option} detail={`${count} votos`} />) : <Card eyebrow="Sin cifras disponibles" title="Resumen pendiente" detail="Esta demostración no contiene recuentos ni porcentajes. La Mesa debe definir qué resultados pueden mostrarse; después el servidor proporcionará la información autorizada." />}
      <PrimaryButton label="Volver a votaciones" onPress={back} secondary />
    </Section>
  </>;
}

const styles = StyleSheet.create({
  prompt: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  option: { backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 2, borderColor: colors.border, padding: space.md, minHeight: 75 },
  selected: { borderColor: colors.navy900, backgroundColor: colors.navy100 },
  optionTitle: { color: colors.navy900, fontSize: 16, fontFamily: fonts.bold },
  optionDetail: { color: colors.muted, fontSize: 13, fontFamily: fonts.regular, marginTop: 4 },
  warning: { color: colors.navy900, backgroundColor: colors.navy100, padding: space.md, borderRadius: radius.card, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20 },
  resultPanel: { backgroundColor: colors.navy900, borderRadius: radius.card, padding: space.lg, gap: space.xs },
  resultEyebrow: { color: colors.gold, fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.8 },
  resultTitle: { color: colors.white, fontSize: 19, fontFamily: fonts.bold, lineHeight: 26 },
  resultDetail: { color: colors.celeste, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20 },
});
