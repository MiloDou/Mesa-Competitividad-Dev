import { StyleSheet, Text } from "react-native";
import { Card, Header, ListContent, PrimaryButton, Section } from "../components";
import { documents, meetings } from "../data";
import type { DemoListMode, DocumentItem, Meeting } from "../types";
import { colors, fonts } from "../theme";

export function MeetingsScreen({ open, mode, retry, meetings = demoMeetings, connected = false }: { open: (meeting: Meeting) => void; mode: DemoListMode; retry: () => void; meetings?: Meeting[]; connected?: boolean }) {
  const displayMode = connected && meetings.length === 0 && mode === "content" ? "empty" : mode;
  return <>
    <Header title="Reuniones" subtitle="Sesiones de la Mesa" />
    <Section><ListContent mode={mode} emptyTitle="No hay reuniones programadas" onRetry={retry}>
      {meetings.map((meeting) =>
        <Card key={meeting.id} eyebrow={meeting.date} title={meeting.title} detail={`${meeting.status} · ${meeting.time} · ${meeting.mode}`} onPress={() => open(meeting)} />
      )}
    </ListContent></Section>
  </>;
}

export function MeetingDetailScreen({ meeting, back, openDocument }: { meeting: Meeting; back: () => void; openDocument: (document: DocumentItem) => void }) {
  return <>
    <Header title={meeting.title} subtitle="Detalle de reunión" />
    <Section>
      <Card eyebrow={meeting.status} title={`${meeting.date} · ${meeting.time}`} detail={`${meeting.mode} · ${meeting.place}\nConvoca: ${meeting.convener}${meeting.note ? `\n${meeting.note}` : ""}`} />
      <Card eyebrow="Agenda" title="Temas de la sesión">
        {meeting.agenda.map((item, index) => <Text key={item} style={styles.agenda}>{index + 1}. {item}</Text>)}
      </Card>
      {documents.filter((d) => meeting.documents.includes(d.id)).map((d) =>
        <Card key={d.id} eyebrow={`Documento · ${d.kind}`} title={d.title} detail={d.detail} onPress={() => openDocument(d)} />
      )}
      <PrimaryButton label="Volver a reuniones" onPress={back} secondary />
    </Section>
  </>;
}

const styles = StyleSheet.create({
  agenda: { color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
});
