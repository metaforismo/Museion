/**
 * WCAG 2.1 relative luminance and contrast ratio. Used to prove that every
 * subject accent stays readable on its own tint — the rule that lets coloured
 * surfaces carry text instead of degrading into decoration.
 */

function channels(hex: string): [number, number, number] {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected a #rrggbb colour, received "${hex}"`);
  }
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function linearize(channel: number): number {
  const ratio = channel / 255;
  return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = channels(hex);
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
