import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, EmptyState, ErrorState, Header, ListContent, LoadingState, PrimaryButton, Section } from "../components";
import { colors, fonts, radius, space } from "../theme";
import { getResults, type Comprobante, type Expediente } from "../../api/votings";
import type { VotingResults } from "../../api/types";
import type { RemoteState } from "../types";

export type VoteDetailState = "loading" | "content" | "not_found" | "error";

function formatDateTime(value: string | null) {
  if (!value) return "Sin fecha de cierre";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" });
}

function VotingCard({ expediente, open, pending = false }: { expediente: Expediente; open: (expediente: Expediente) => void; pending?: boolean }) {
  return <Card
    eyebrow={pending ? `Pendiente · ${expediente.estado_etiqueta}` : expediente.ya_voto ? `${expediente.estado_etiqueta} · Ya votaste` : expediente.estado_etiqueta}
    title={expediente.titulo}
    detail={`${expediente.resumen ? `${expediente.resumen} · ` : ""}Cierre: ${formatDateTime(expediente.cierre)}`}
    onPress={() => open(expediente)}
  />;
}

export function VotesScreen({
  state, expedientes, open, retry, canRetry, errorMessage,
  pendingState, pendingExpedientes, retryPending, pendingCanRetry, pendingErrorMessage,
}: {
  state: RemoteState; expedientes: Expediente[]; open: (expediente: Expediente) => void; retry: () => void; canRetry: boolean; errorMessage?: string;
  pendingState: RemoteState; pendingExpedientes: Expediente[]; retryPending: () => void; pendingCanRetry: boolean; pendingErrorMessage?: string;
}) {
  const pendingIds = pendingState === "content" ? new Set(pendingExpedientes.map((expediente) => expediente.id)) : null;
  const otherExpedientes = pendingIds ? expedientes.filter((expediente) => !pendingIds.has(expediente.id)) : expedientes;
  const mode = state === "content" && otherExpedientes.length === 0 ? "empty" : state;
  return <>
    <Header title="Votaciones" subtitle="Procesos de tu comisión" />
    <Section>
      <Text style={styles.sectionLabel}>Pendientes</Text>
      {pendingState === "loading" ? <LoadingState title="Cargando pendientes…" detail="Consultando el servidor." /> : null}
      {pendingState === "error" ? <ErrorState
        title="No se pudo cargar la bandeja pendiente"
        detail={pendingErrorMessage}
        onRetry={pendingCanRetry ? retryPending : undefined}
      /> : null}
      {pendingState === "content" && pendingExpedientes.length === 0 ? <EmptyState
        title="No hay votaciones pendientes"
        detail="Cuando tengas una votación abierta sin voto registrado, aparecerá aquí."
      /> : null}
      {pendingState === "content" ? pendingExpedientes.map((expediente) => <VotingCard key={expediente.id} expediente={expediente} open={open} pending />) : null}

      <Text style={styles.sectionLabel}>Todas las votaciones</Text>
      {state === "error" ? <ErrorState detail={errorMessage} onRetry={canRetry ? retry : undefined} /> : <ListContent mode={mode} emptyTitle="No hay otras votaciones disponibles" onRetry={retry}>
        {otherExpedientes.map((expediente) => <VotingCard key={expediente.id} expediente={expediente} open={open} />)}
      </ListContent>}
    </Section>
  </>;
}

export function VoteDetailScreen({ state, expediente, errorMessage, canRetry, retry, continueToVote, showResults, back }: {
  state: VoteDetailState; expediente: Expediente | null; errorMessage?: string; canRetry: boolean; retry: () => void;
  continueToVote: () => void; showResults: () => void; back: () => void;
}) {
  const canVote = state === "content" && expediente?.estado === "open" && !expediente.ya_voto;
  return <>
    <Header title="Propuesta" subtitle={state === "content" && expediente ? expediente.titulo : undefined} />
    <Section>
      {state === "loading" ? <LoadingState title="Cargando votación…" detail="Consultando el servidor." /> : null}
      {state === "not_found" ? <ErrorState
        title="Votación no disponible"
        detail="La votación ya no está disponible o no tienes acceso."
        onRetry={canRetry ? retry : undefined}
      /> : null}
      {state === "error" ? <ErrorState
        title="No se pudo cargar la votación"
        detail={errorMessage ?? "Revisa tu conexión e inténtalo de nuevo."}
        onRetry={canRetry ? retry : undefined}
      /> : null}
      {state === "content" && expediente ? <>
        <Card eyebrow="Contenido" title={expediente.titulo} detail={expediente.resumen || "Sin resumen disponible."} />
        {expediente.antecedentes && expediente.antecedentes !== expediente.resumen ? <Card eyebrow="Antecedentes" title="Detalle del tema" detail={expediente.antecedentes} /> : null}
        <Card eyebrow={`Estado · ${expediente.estado_etiqueta}`} title={formatDateTime(expediente.cierre)} detail="Fecha de cierre indicada por el servidor." />
        {expediente.ya_voto ? <Text style={styles.notice}>Tu voto en esta votación ya está registrado. El voto es único y no se puede cambiar.</Text> : null}
        {expediente.estado === "scheduled" ? <Text style={styles.notice}>Esta votación todavía no abre.</Text> : null}
        {canVote ? <PrimaryButton label="Elegir mi voto" onPress={continueToVote} /> : null}
        {expediente.estado === "closed" ? <PrimaryButton label="Ver resultados" onPress={showResults} /> : null}
      </> : null}
      <PrimaryButton label="Volver a votaciones" onPress={back} secondary />
    </Section>
  </>;
}

export function VoteChoiceScreen({ expediente, choice, setChoice, continueToPreview, back }: {
  expediente: Expediente; choice: string | null; setChoice: (choice: string) => void;
  continueToPreview: () => void; back: () => void;
}) {
  return <>
    <Header title="Emitir voto" subtitle={expediente.titulo} />
    <Section>
      <Text style={styles.prompt}>Selecciona una opción</Text>
      {expediente.opciones_voto.map((option) => <Pressable
        key={option} accessibilityRole="radio" accessibilityState={{ checked: choice === option }}
        onPress={() => setChoice(option)} style={[styles.option, choice === option && styles.selected]}
      ><Text style={styles.optionTitle}>{option}</Text></Pressable>)}
      <PrimaryButton label="Revisar elección" onPress={continueToPreview} disabled={!choice} />
      <PrimaryButton label="Volver a propuesta" onPress={back} secondary />
    </Section>
  </>;
}

export function VotePreviewScreen({ expediente, choice, sending, errorMessage, canRetry, confirm, back, leave }: {
  expediente: Expediente; choice: string; sending: boolean; errorMessage: string | null; canRetry: boolean;
  confirm: () => void; back: () => void; leave: () => void;
}) {
  const attempted = errorMessage !== null;
  return <>
    <Header title="Confirmar voto" subtitle="Revisa antes de enviar" />
    <Section>
      <Card eyebrow="Propuesta" title={expediente.titulo} detail={`Opción seleccionada: ${choice}`} />
      <Text style={styles.notice}>Al enviar, tu voto queda registrado de forma definitiva. No podrás cambiarlo ni retirarlo.</Text>
      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
      {!attempted || canRetry
        ? <PrimaryButton label={attempted ? "Reintentar envío" : "Enviar voto"} onPress={confirm} loading={sending} />
        : null}
      {/* Tras un intento fallido no se cambia la opción: el reintento debe ser del mismo voto. */}
      {!attempted ? <PrimaryButton label="Cambiar opción" onPress={back} secondary busy={sending} /> : null}
      {attempted && !canRetry ? <PrimaryButton label="Volver a votaciones" onPress={leave} secondary /> : null}
    </Section>
  </>;
}

export function VoteDoneScreen({ comprobante, home }: { comprobante: Comprobante; home: () => void }) {
  return <>
    <Header title="Voto registrado" subtitle="Confirmación del servidor" />
    <Section>
      <View style={styles.resultPanel} accessible accessibilityLabel={`Voto registrado el ${formatDateTime(comprobante.emitido_en)}`}>
        <Text style={styles.resultEyebrow}>COMPROBANTE OFICIAL</Text>
        <Text style={styles.resultTitle}>{comprobante.titulo}</Text>
        <Text style={styles.resultDetail}>Registrado: {formatDateTime(comprobante.emitido_en)}</Text>
        <Text style={styles.resultDetail}>Votación n.º {comprobante.votacion_id} · Estado: registrado</Text>
      </View>
      <Card eyebrow="Importante" title="Tu voto es definitivo" detail="Esta confirmación proviene de la respuesta del servidor. Los resultados se publican solo cuando la votación cierra." />
      <PrimaryButton label="Volver al inicio" onPress={home} />
    </Section>
  </>;
}

export function ResultsScreen({ expediente, back }: { expediente: Expediente; back: () => void }) {
  const [state, setState] = useState<RemoteState>("loading");
  const [results, setResults] = useState<VotingResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState("loading");
    getResults(expediente.id)
      .then((data) => { if (active) { setResults(data); setState("content"); } })
      .catch((error: Error) => { if (active) { setErrorMessage(error.message); setState("error"); } });
    return () => { active = false; };
  }, [expediente.id, attempt]);

  return <>
    <Header title="Resultados" subtitle={expediente.titulo} />
    <Section>
      {state === "loading" ? <LoadingState title="Cargando resultados…" detail="Consultando el servidor." /> : null}
      {state === "error" ? <ErrorState title="Resultados no disponibles" detail={errorMessage} onRetry={() => setAttempt((value) => value + 1)} /> : null}
      {state === "content" && results ? <>
        <View style={styles.resultPanel}>
          <Text style={styles.resultEyebrow}>VOTACIÓN CERRADA</Text>
          <Text style={styles.resultTitle}>{results.total_votes} {results.total_votes === 1 ? "voto emitido" : "votos emitidos"}</Text>
          <Text style={styles.resultDetail}>Conteo por opción. La Mesa define quórum y aprobación.</Text>
        </View>
        {Object.entries(results.results).map(([option, total]) => <Card key={option} eyebrow={option} title={`${total} ${total === 1 ? "voto" : "votos"}`} detail={`${results.percentages[option] ?? 0} %`} />)}
      </> : null}
      <PrimaryButton label="Volver a votaciones" onPress={back} secondary />
    </Section>
  </>;
}

const styles = StyleSheet.create({
  sectionLabel: { color: colors.navy900, fontSize: 15, fontFamily: fonts.bold },
  prompt: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  option: { backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 2, borderColor: colors.border, padding: space.md, minHeight: 60, justifyContent: "center" },
  selected: { borderColor: colors.navy900, backgroundColor: colors.navy100 },
  optionTitle: { color: colors.navy900, fontSize: 16, fontFamily: fonts.bold },
  notice: { color: colors.navy900, backgroundColor: colors.navy100, padding: space.md, borderRadius: radius.card, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20 },
  error: { color: colors.white, backgroundColor: colors.navy900, padding: space.md, borderRadius: radius.card, fontSize: 13, fontFamily: fonts.semibold, lineHeight: 20 },
  resultPanel: { backgroundColor: colors.navy900, borderRadius: radius.card, padding: space.lg, gap: space.xs },
  resultEyebrow: { color: colors.gold, fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.8 },
  resultTitle: { color: colors.white, fontSize: 19, fontFamily: fonts.bold, lineHeight: 26 },
  resultDetail: { color: colors.celeste, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20 },
});
