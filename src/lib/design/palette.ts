/**
 * The subject palette. Every subject owns an accent + tint pair so coloured
 * surfaces are possible at all; before this, a subject had an accent and no
 * fill, which is why the app could not use colour without one-off color-mix.
 *
 * accent      — fills, bars, rings, icon glyphs
 * accentText  — text and small marks on the subject's own tint (>= 4.5:1)
 * tint        — the surface fill for cards, washes and badges
 *
 * Biology and arithmetic deepened from their previous values because the
 * originals scored 3.91 and 4.37 against their tints. Hue identity is kept.
 */

export type SubjectKey = "algebra" | "arithmetic" | "cs" | "research" | "physics" | "biology" | "default";

export type SubjectPalette = {
  accent: string;
  accentText: string;
  tint: string;
  accentVar: string;
  tintVar: string;
};

export const TINTS = {
  sky: "#f3f9ff",
  peach: "#fff0e7",
  mint: "#dff8ea",
  violet: "#f7f1ff",
  yellow: "#fff2ad",
  coral: "#ffeee6",
} as const;

function entry(key: SubjectKey, accent: string, accentText: string, tint: string): SubjectPalette {
  return {
    accent,
    accentText,
    tint,
    accentVar: `var(--color-subject-${key})`,
    tintVar: `var(--color-subject-${key}-tint)`,
  };
}

export const SUBJECT_PALETTE: Record<SubjectKey, SubjectPalette> = {
  algebra: entry("algebra", "#2b5ee7", "#20379b", TINTS.sky),
  physics: entry("physics", "#b3341f", "#b3341f", TINTS.peach),
  biology: entry("biology", "#17703d", "#17703d", TINTS.mint),
  cs: entry("cs", "#6d28d9", "#6d28d9", TINTS.violet),
  arithmetic: entry("arithmetic", "#0b656d", "#0b656d", TINTS.yellow),
  research: entry("research", "#9a470c", "#9a470c", TINTS.coral),
  default: entry("default", "#2b5ee7", "#20379b", TINTS.sky),
};
