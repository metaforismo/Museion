/**
 * The subject palette. Every subject owns an accent + tint pair so coloured
 * surfaces are possible at all; before this, a subject had an accent and no
 * fill, which is why the app could not use colour without one-off color-mix.
 *
 * accent — fills, bars, rings, icon glyphs, and text on the subject's own
 *          tint: every accent clears 4.5:1 there by construction, and
 *          `tests/design-palette.test.ts` pins it.
 * tint   — the surface fill for cards, washes and badges
 * deep   — the hard bottom edge of a pressable element: the accent darkened
 *          to ~72% once, stored as a literal so nothing computes colour at
 *          runtime. Deep shades are decorative edges — no text ever sits on
 *          one, so they carry a darker-than-accent guarantee (pinned by
 *          `tests/design-palette.test.ts`) rather than a contrast ratio.
 *
 * There is deliberately no second per-subject text colour. Algebra is the one
 * subject where a stronger option exists — `--color-lapis-dark` #20379b
 * reaches 9.5:1 on sky against the accent's 5.1:1 — and callers reach for that
 * token directly, which is why it is a token rather than a palette field. A
 * parallel `accentText` lived here for a while: identical to `accent` for five
 * of six subjects, carried by no CSS variable and read by nothing. Two names
 * for one value only invite picking the one whose name sounds safer, on a
 * surface where its guarantee does not hold.
 *
 * Biology and arithmetic deepened from their previous values because the
 * originals scored 3.91 and 4.37 against their tints. Hue identity is kept.
 */

export type SubjectKey = "algebra" | "arithmetic" | "cs" | "research" | "physics" | "biology" | "default";

export type SubjectPalette = {
  accent: string;
  tint: string;
  deep: string;
  accentVar: string;
  tintVar: string;
  deepVar: string;
};

export const TINTS = {
  sky: "#f3f9ff",
  peach: "#fff0e7",
  mint: "#dff8ea",
  violet: "#f7f1ff",
  yellow: "#fff2ad",
  coral: "#ffeee6",
} as const;

function entry(key: SubjectKey, accent: string, tint: string, deep: string): SubjectPalette {
  return {
    accent,
    tint,
    deep,
    accentVar: `var(--color-subject-${key})`,
    tintVar: `var(--color-subject-${key}-tint)`,
    deepVar: `var(--color-subject-${key}-deep)`,
  };
}

export const SUBJECT_PALETTE: Record<SubjectKey, SubjectPalette> = {
  algebra: entry("algebra", "#2b5ee7", TINTS.sky, "#1f44a6"),
  physics: entry("physics", "#b3341f", TINTS.peach, "#812516"),
  biology: entry("biology", "#17703d", TINTS.mint, "#11512c"),
  cs: entry("cs", "#6d28d9", TINTS.violet, "#4e1d9c"),
  arithmetic: entry("arithmetic", "#0b656d", TINTS.yellow, "#08494e"),
  research: entry("research", "#9a470c", TINTS.coral, "#6f3309"),
  default: entry("default", "#2b5ee7", TINTS.sky, "#1f44a6"),
};

/**
 * The non-subject accents that can also be pressed: information (lapis),
 * attention (gold) and the verified green. Same construction, same guarantee.
 */
export const STATE_DEEPS = {
  lapis: "#1f44a6",
  gold: "#8f680e",
  correct: "#0e5528",
} as const;
