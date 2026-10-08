import { colors, minTouchTarget, semanticColors } from "../../native/theme";

function relativeLuminance(hex: string): number {
  const channels = hex.replace(/^#/, "").match(/.{2}/g);
  if (!channels || channels.length !== 3) throw new Error(`Invalid hex color: ${hex}`);
  const [red, green, blue] = channels.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("native semantic color contrast", () => {
  it.each([
    ["header title", colors.white, colors.navy950],
    ["header subtitle", colors.celeste, colors.navy950],
    ["demo notice", colors.navy900, colors.navy100],
    ["button and card title", colors.navy900, colors.white],
    ["detail and inactive tab label", colors.muted, colors.white],
    ["input text", colors.text, colors.white],
    ["AccessHome brand accent", colors.gold, colors.navy950],
    ["Voting result eyebrow", colors.gold, colors.navy900],
  ])("keeps %s at 4.5:1 for normal-sized text", (_use, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("defines semantic aliases using the existing palette", () => {
    expect(semanticColors).toEqual(expect.objectContaining({
      loading: expect.any(String),
      success: expect.any(String),
      error: expect.any(String),
      disabled: expect.any(String),
    }));
    expect(semanticColors.loading).toBe(colors.navy900);
    expect(semanticColors.success).toBe(colors.success);
    expect(semanticColors.error).toBe(colors.error);
    expect(semanticColors.disabled).toBe(colors.muted);
  });

  it.each([
    ["success", colors.success],
    ["error", colors.error],
  ])("keeps semantic %s text at 4.5:1 on white", (_name, foreground) => {
    expect(contrastRatio(foreground, colors.white)).toBeGreaterThanOrEqual(4.5);
  });

  it("exports a touch-target minimum of at least 48 dp", () => {
    expect(minTouchTarget).toBeGreaterThanOrEqual(48);
  });
});
