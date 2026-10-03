import { StyleSheet, Text } from "react-native";
import { Card, Header, ListContent, PrimaryButton, Section } from "../components";
import { meetings } from "../data";
import type { DemoListMode, Meeting } from "../types";
import { colors, fonts } from "../theme";

export function MeetingsScreen({ open, mode, retry }: { open: (meeting: Meeting) => void; mode: DemoListMode; retry: () => void }) {
  return <>
    <Header title="Reuniones" subtitle="Próximas sesiones" />
    <Section><ListContent mode={mode} emptyTitle="No hay reuniones programadas" onRetry={retry}>
      {meetings.map((meeting) =>
        <Card key={meeting.id} eyebrow={meeting.date} title={meeting.title} detail={`${meeting.time} · ${meeting.mode} · ${meeting.place}`} onPress={() => open(meeting)} />
      )}
    </ListContent></Section>
  </>;
}

export function MeetingDetailScreen({ meeting, back }: { meeting: Meeting; back: () => void }) {
  return <>
    <Header title={meeting.title} subtitle="Detalle de reunión" />
    <Section>
      <Card eyebrow="Fecha y lugar" title={`${meeting.date} · ${meeting.time}`} detail={`${meeting.mode} · ${meeting.place}`} />
      <Card eyebrow="Agenda" title="Temas de la sesión">
        {meeting.agenda.map((item, index) => <Text key={item} style={styles.agenda}>{index + 1}. {item}</Text>)}
      </Card>
      <PrimaryButton label="Volver a reuniones" onPress={back} secondary />
    </Section>
  </>;
}

const styles = StyleSheet.create({
  agenda: { color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
});
