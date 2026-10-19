import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { apiBase, currentAccessToken } from "../../api/client";
import { useState } from "react";
import { Card, ConfirmationDialog, Header, ListContent, PrimaryButton, Section } from "../components";
import { documents, notices } from "../data";
import { colors, fonts, radius, space } from "../theme";
import type { DemoListMode, DocumentItem, Notice, Screen } from "../types";

export function NotificationsScreen({ open, mode, retry, notices = demoNotices, connected = false }: { open: (notice: Notice) => void; mode: DemoListMode; retry: () => void; notices?: Notice[]; connected?: boolean }) {
  const displayMode = connected && notices.length === 0 && mode === "content" ? "empty" : mode;
  return <>
    <Header title="Avisos" subtitle={connected ? "Bandeja de tu cuenta" : "Demostración local · avisos de ejemplo"} />
    <Section><ListContent mode={displayMode} emptyTitle="No hay avisos nuevos" onRetry={retry}>
      {notices.map((notice) =>
        <Card key={notice.id} eyebrow={`${notice.kind} · ${notice.date}`} title={notice.title} detail={notice.detail} onPress={() => open(notice)} />
      )}
    </ListContent></Section>
  </>;
}

export function NoticeDetailScreen({ notice, back, follow }: { notice: Notice; back: () => void; follow: (notice: Notice) => void }) {
  return <>
    <Header title="Aviso" subtitle={notice.kind} />
    <Section>
      <Card eyebrow={notice.date} title={notice.title} detail={notice.body} />
      <PrimaryButton label={notice.target.kind === "meeting" ? "Ver reunión" : notice.target.kind === "document" ? "Ver documento" : "Ir a votaciones"} onPress={() => follow(notice)} />
      <PrimaryButton label="Volver a avisos" onPress={back} secondary />
    </Section>
  </>;
}

export function DocumentsScreen({ open, back, mode, retry, documents: items = demoDocuments, connected = false }: { open: (document: DocumentItem) => void; back: () => void; mode: DemoListMode; retry: () => void; documents?: DocumentItem[]; connected?: boolean }) {
  const displayMode = connected && items.length === 0 && mode === "content" ? "empty" : mode;
  return <>
    <Header title="Documentos" subtitle={connected ? "Documentos autorizados para tu cuenta" : "Demostración local · referencias de ejemplo"} />
    <Section>
      <ListContent mode={displayMode} emptyTitle="No hay documentos disponibles" onRetry={retry}>
        {items.map((document) => <Card key={document.id} eyebrow={document.kind} title={document.title} detail={document.detail} onPress={() => open(document)} />)}
      </ListContent>
      <PrimaryButton label="Volver al inicio" onPress={back} secondary />
    </Section>
  </>;
}

export function DocumentDetailScreen({ document, back, backLabel = "Volver a documentos" }: { document: DocumentItem; back: () => void; backLabel?: string }) {
  return <>
    <Header title="Documento" subtitle={document.kind} />
    <Section>
      <Card eyebrow={`${document.id} · ${document.date}`} title={document.title} detail={`${document.pages} páginas · Acceso: ${document.access}\n${document.preview}`} />
      <View style={styles.preview} accessibilityLabel={`Contenido de ${document.title}`}>
        {document.sections.map((s) => <View key={s.heading} style={styles.docSection}>
          <Text style={styles.previewTitle}>{s.heading}</Text>
          <Text style={styles.previewText}>{s.body}</Text>
        </View>)}
      </View>
      <Text style={styles.downloadHint}>El PDF se abre en otra pestaña; desde ahí puedes guardarlo o compartirlo.</Text>
      <PrimaryButton label="Abrir PDF" accessibilityHint="Abre el archivo PDF del documento en otra pestaña" onPress={() => void Linking.openURL(`${apiBase}/documents/${document.id}/download/?t=${encodeURIComponent(currentAccessToken() ?? "")}`)} />
      <PrimaryButton label={backLabel} onPress={back} secondary />
    </Section>
  </>;
}

const modes: { value: DemoListMode; label: string }[] = [
  { value: "content", label: "Con datos" },
  { value: "loading", label: "Cargando" },
  { value: "empty", label: "Sin datos" },
  { value: "error", label: "Error" },
];

export function ProfileScreen({ navigate, mode, setMode, userName, userEmail, userRole, onLogout, presentation = false }: {
  navigate: (screen: Screen) => void; mode: DemoListMode; setMode: (mode: DemoListMode) => void;
  userName: string; userEmail: string; userRole?: string; onLogout: () => void; presentation?: boolean;
}) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  return <>
    <Header title="Perfil" subtitle="Tu cuenta" />
    <Section>
      <Card eyebrow={userRole ?? "Sesión iniciada"} title={userName} detail={`Usuario: ${userEmail}`} />
      {presentation ? null : <View style={styles.demoControls}>
        <Text style={styles.demoTitle}>Revisar estados de la interfaz</Text>
        <Text style={styles.demoHint}>Cambia cómo se ven las listas de reuniones, iniciativas, avisos y documentos. Solo afecta esta demostración.</Text>
        <View style={styles.modeRow}>{modes.map((item) => <Pressable
          key={item.value} accessibilityRole="radio" accessibilityState={{ checked: mode === item.value }}
          onPress={() => setMode(item.value)} style={[styles.modeButton, mode === item.value && styles.modeSelected]}
        ><Text style={[styles.modeLabel, mode === item.value && styles.modeLabelSelected]}>{item.label}</Text></Pressable>)}</View>
      </View>}
      <PrimaryButton label="Consultar documentos" onPress={() => navigate("documents")} secondary />
      <PrimaryButton label="Cerrar sesión" onPress={() => setConfirmLogout(true)} />
      <ConfirmationDialog visible={confirmLogout} title="¿Cerrar sesión?" message="Tus votos ya emitidos se conservan. Para volver a entrar necesitarás el usuario y la contraseña." confirmLabel="Cerrar sesión" cancelLabel="Cancelar" onConfirm={() => { setConfirmLogout(false); onLogout(); }} onCancel={() => setConfirmLogout(false)} />
    </Section>
  </>;
}

const styles = StyleSheet.create({
  preview: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: colors.border },
  docSection: { gap: space.xs },
  previewMark: { color: colors.navy900, fontSize: 15, fontFamily: fonts.bold, borderWidth: 2, borderColor: colors.navy900, borderRadius: 8, padding: space.sm },
  previewTitle: { color: colors.navy900, fontSize: 17, fontFamily: fonts.bold },
  previewText: { color: colors.text, fontSize: 16, fontFamily: fonts.regular, lineHeight: 24 },
  downloadHint: { color: colors.muted, fontSize: 14, fontFamily: fonts.regular, lineHeight: 20, textAlign: "center" },
  demoControls: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.md, gap: space.sm },
  demoTitle: { color: colors.navy900, fontSize: 16, fontFamily: fonts.bold },
  demoHint: { color: colors.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  modeButton: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.sm, paddingVertical: space.xs },
  modeSelected: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  modeLabel: { color: colors.navy900, fontSize: 12, fontFamily: fonts.semibold },
  modeLabelSelected: { color: colors.white },
});
