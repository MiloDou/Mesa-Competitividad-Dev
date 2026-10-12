import type { ReactNode } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, minTouchTarget, radius, semanticColors, space } from "../theme";

export function Card({ eyebrow, title, detail, onPress, children }: {
  eyebrow?: string; title: string; detail?: string; onPress?: () => void; children?: ReactNode;
}) {
  const content = <>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
    <Text style={styles.cardTitle}>{title}</Text>
    {detail ? <Text style={styles.cardDetail}>{detail}</Text> : null}
    {children}
  </>;
  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>{content}</Pressable>
    : <View style={styles.card}>{content}</View>;
}

export function PrimaryButton({ label, onPress, disabled = false, secondary = false, loading = false, busy = loading, accessibilityLabel, accessibilityHint }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
  loading?: boolean; busy?: boolean; accessibilityLabel?: string; accessibilityHint?: string;
}) {
  const inactive = disabled || loading || busy;
  return <Pressable
    accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityHint={accessibilityHint}
    accessibilityState={{ disabled: inactive, busy }}
    disabled={inactive} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, inactive && styles.disabled, pressed && styles.pressed]}
  >
    {loading ? <ActivityIndicator color={secondary ? colors.navy900 : colors.white} /> : null}
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
  </Pressable>;
}

export function LoadingState({ title = "Cargando información…", detail = "Vista de ejemplo mientras llegan los datos." }: {
  title?: string; detail?: string;
}) {
  return <View style={styles.feedback} accessible accessibilityRole="progressbar" accessibilityLabel={title} accessibilityState={{ busy: true }}>
    <ActivityIndicator size="large" color={semanticColors.loading} />
    <Text style={styles.feedbackTitle}>{title}</Text>
    <Text style={styles.feedbackDetail}>{detail}</Text>
  </View>;
}

export function EmptyState({ title, detail = "Cuando haya información disponible, aparecerá en esta sección." }: {
  title: string; detail?: string;
}) {
  return <View style={styles.feedback}>
    <Text style={styles.feedbackTitle}>{title}</Text>
    <Text style={styles.feedbackDetail}>{detail}</Text>
  </View>;
}

export function ErrorState({ title = "No se pudo cargar la información", detail = "Revisa tu conexión e inténtalo de nuevo.", onRetry, retryLabel = "Reintentar" }: {
  title?: string; detail?: string; onRetry?: () => void; retryLabel?: string;
}) {
  return <View style={styles.feedback}>
    <Text accessible accessibilityRole="alert" style={styles.feedbackTitle}>{title}</Text>
    <Text style={styles.feedbackDetail}>{detail}</Text>
    {onRetry ? <PrimaryButton label={retryLabel} onPress={onRetry} secondary /> : null}
  </View>;
}

export function ConfirmationDialog({ visible, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, onCancel, busy = false }: {
  visible: boolean; title: string; message?: string; confirmLabel?: string; cancelLabel?: string;
  onConfirm: () => void; onCancel: () => void; busy?: boolean;
}) {
  const handleRequestClose = () => {
    if (!busy) onCancel();
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
    <View style={styles.scrim}>
      <View style={styles.dialog} accessibilityViewIsModal>
        <Text accessibilityRole="header" style={styles.feedbackTitle}>{title}</Text>
        {message ? <Text style={styles.feedbackDetail}>{message}</Text> : null}
        <PrimaryButton label={confirmLabel} onPress={onConfirm} loading={busy} />
        <PrimaryButton label={cancelLabel} onPress={onCancel} secondary busy={busy} />
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.navy900, fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.8, marginBottom: space.xs },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.md, minHeight: 76, gap: 4 },
  cardTitle: { color: colors.navy900, fontSize: 16, fontFamily: fonts.bold, lineHeight: 22 },
  cardDetail: { color: colors.muted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 19, marginTop: 3 },
  button: { backgroundColor: colors.navy900, borderRadius: radius.button, minHeight: Math.max(52, minTouchTarget), flexDirection: "row", gap: space.xs, alignItems: "center", justifyContent: "center", paddingHorizontal: space.md },
  buttonText: { color: colors.white, fontSize: 15, fontFamily: fonts.bold, textAlign: "center" },
  secondary: { backgroundColor: colors.white, borderColor: colors.navy900, borderWidth: 1 },
  secondaryText: { color: colors.navy900 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  feedback: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.lg, minHeight: 180, justifyContent: "center", gap: space.sm },
  feedbackTitle: { color: colors.navy900, fontSize: 17, fontFamily: fonts.bold, lineHeight: 23 },
  feedbackDetail: { color: colors.muted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 20 },
  scrim: { flex: 1, backgroundColor: "rgba(8,3,36,0.6)", justifyContent: "center", padding: space.lg },
  dialog: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.lg, gap: space.sm },
});
