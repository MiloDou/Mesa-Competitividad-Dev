import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Header, ListContent, PrimaryButton, Section } from "../components";
import { documents as demoDocuments, notices as demoNotices } from "../data";
import { colors, fonts, radius, space } from "../theme";
import type { DemoListMode, DocumentItem, Notice, Screen } from "../types";

export function NotificationsScreen({ open, mode, retry, notices = demoNotices, connected = false }: { open: (notice: Notice) => void; mode: DemoListMode; retry: () => void; notices?: Notice[]; connected?: boolean }) {
  const displayMode = connected && notices.length === 0 && mode === "content" ? "empty" : mode;
  return <>
    <Header title="Avisos" subtitle={connected ? "Bandeja de tu cuenta" : "Demostración local · avisos de ejemplo"} />
    <Section><ListContent mode={displayMode} emptyTitle="No hay avisos nuevos" onRetry={retry}>
      {notices.map((notice) =>
        <Card key={notice.id} eyebrow={notice.kind} title={notice.title} detail={notice.detail} onPress={() => open(notice)} />
      )}
    </ListContent></Section>
  </>;
}

export function NoticeDetailScreen({ notice, back }: { notice: Notice; back: () => void }) {
  return <>
    <Header title="Aviso" subtitle={notice.kind} />
    <Section>
      <Card eyebrow={notice.id.startsWith("AV-DEMO") ? "Datos de ejemplo" : "Aviso del sistema"} title={notice.title} detail={notice.body} />
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

export function DocumentDetailScreen({ document, back }: { document: DocumentItem; back: () => void }) {
  return <>
    <Header title="Documento" subtitle={document.kind} />
    <Section>
      <Card eyebrow={document.id.startsWith("DOC-DEMO") ? "Ficha de demostración" : "Documento autorizado"} title={document.title} detail={document.preview} />
      <View style={styles.preview}>
        <Text style={styles.previewMark}>PDF</Text>
        <Text style={styles.previewTitle}>Vista previa del archivo</Text>
        <Text style={styles.previewText}>{document.id.startsWith("DOC-DEMO") ? "El archivo aún no está disponible. Su visualización y descarga dependerán de los documentos y permisos que entregue el servidor." : "El servidor confirmó el acceso a los metadatos. La descarga autenticada se habilitará en una siguiente integración."}</Text>
      </View>
      <PrimaryButton label="Volver a documentos" onPress={back} secondary />
    </Section>
  </>;
}

const modes: { value: DemoListMode; label: string }[] = [
  { value: "content", label: "Con datos" },
  { value: "loading", label: "Cargando" },
  { value: "empty", label: "Sin datos" },
  { value: "error", label: "Error" },
];

export function ProfileScreen({ navigate, mode, setMode, displayName, onLogout }: { navigate: (screen: Screen) => void; mode: DemoListMode; setMode: (mode: DemoListMode) => void; displayName?: string; onLogout?: () => void }) {
  return <>
    <Header title="Perfil" subtitle="Tu cuenta" />
    <Section>
      <Card eyebrow={displayName ? "Sesión autenticada" : "Datos de ejemplo"} title={displayName || "Miembro de la Mesa"} detail={displayName ? "Cuenta conectada a la API de la Mesa." : "Inicia sesión para consultar la información asociada a tu cuenta."} />
      {!displayName ? <View style={styles.demoControls}>
        <Text style={styles.demoTitle}>Revisar estados de la interfaz</Text>
        <Text style={styles.demoHint}>Cambia cómo se ven las listas de reuniones, iniciativas, avisos y documentos. Solo afecta esta demostración.</Text>
        <View style={styles.modeRow}>{modes.map((item) => <Pressable
          key={item.value} accessibilityRole="radio" accessibilityState={{ checked: mode === item.value }}
          onPress={() => setMode(item.value)} style={[styles.modeButton, mode === item.value && styles.modeSelected]}
        ><Text style={[styles.modeLabel, mode === item.value && styles.modeLabelSelected]}>{item.label}</Text></Pressable>)}</View>
      </View> : null}
      <PrimaryButton label="Consultar documentos" onPress={() => navigate("documents")} secondary />
      <PrimaryButton label={onLogout ? "Cerrar sesión" : "Salir de la demostración"} onPress={onLogout || (() => navigate("login"))} />
    </Section>
  </>;
}

const styles = StyleSheet.create({
  preview: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.lg, alignItems: "center", gap: space.sm, borderWidth: 1, borderColor: colors.border },
  previewMark: { color: colors.navy900, fontSize: 15, fontFamily: fonts.bold, borderWidth: 2, borderColor: colors.navy900, borderRadius: 8, padding: space.sm },
  previewTitle: { color: colors.navy900, fontSize: 16, fontFamily: fonts.bold, textAlign: "center" },
  previewText: { color: colors.muted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20, textAlign: "center" },
  demoControls: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.md, gap: space.sm },
  demoTitle: { color: colors.navy900, fontSize: 16, fontFamily: fonts.bold },
  demoHint: { color: colors.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  modeButton: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.sm, paddingVertical: space.xs },
  modeSelected: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  modeLabel: { color: colors.navy900, fontSize: 12, fontFamily: fonts.semibold },
  modeLabelSelected: { color: colors.white },
});
