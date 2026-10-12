import { Card, Header, ListContent, PrimaryButton, Section } from "../components";
import type { DemoListMode, Initiative } from "../types";

export function InitiativesScreen({ open, back, mode, retry, initiatives, connected }: { open: (initiative: Initiative) => void; back: () => void; mode: DemoListMode; retry: () => void; initiatives: Initiative[]; connected: boolean }) {
  const displayMode = connected && initiatives.length === 0 && mode === "content" ? "empty" : mode;
  return <>
    <Header title="Iniciativas" subtitle={connected ? "Iniciativas públicas de la Mesa" : "Consulta de ejemplo"} />
    <Section>
      <ListContent mode={displayMode} emptyTitle="No hay iniciativas para mostrar" onRetry={retry}>
        {initiatives.map((initiative) =>
          <Card key={initiative.id} eyebrow={initiative.area} title={initiative.title} detail={initiative.summary} onPress={() => open(initiative)} />
        )}
      </ListContent>
      <PrimaryButton label="Volver al inicio" onPress={back} secondary />
    </Section>
  </>;
}

export function InitiativeDetailScreen({ initiative, back }: { initiative: Initiative; back: () => void }) {
  return <>
    <Header title={initiative.title} subtitle="Detalle de iniciativa" />
    <Section>
      <Card eyebrow={initiative.area} title="Descripción" detail={initiative.description} />
      <Card eyebrow="Estado de la información" title="Ficha de demostración" detail="La información, el avance y los documentos autorizados aparecerán aquí cuando estén disponibles desde el servidor." />
      <PrimaryButton label="Volver a iniciativas" onPress={back} secondary />
    </Section>
  </>;
}
