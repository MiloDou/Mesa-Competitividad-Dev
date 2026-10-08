export const colors = {
  navy950: "#080324",
  navy900: "#12025B",
  navy100: "#EAE6FD",
  celeste: "#4DC1F5",
  gold: "#C59B27",
  background: "#F5F3FE",
  white: "#FFFFFF",
  text: "#111111",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#15803D",
  error: "#B91C1C",
} as const;

export const semanticColors = {
  loading: colors.navy900,
  success: colors.success,
  error: colors.error,
  disabled: colors.muted,
} as const;

export const minTouchTarget = 48;
export const space = { xs: 8, sm: 12, md: 16, lg: 24 } as const;
export const radius = { card: 16, button: 14 } as const;
export const fonts = {
  regular: "Montserrat_400Regular",
  semibold: "Montserrat_600SemiBold",
  bold: "Montserrat_700Bold",
} as const;
