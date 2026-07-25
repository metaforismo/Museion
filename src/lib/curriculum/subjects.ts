import { SUBJECT_PALETTE, type SubjectKey } from "@/lib/design/palette";

/**
 * Subject identity. Every subject owns an accent + tint pair so colour can
 * fill a surface rather than only mark a hairline.
 */
export type { SubjectKey };

const SUBJECT_MAP: Record<string, SubjectKey> = {
  algebra: "algebra",
  arithmetic: "arithmetic",
  "computer science": "cs",
  "research methods": "research",
  physics: "physics",
  biology: "biology",
};

export function subjectKey(subject: string): SubjectKey {
  return SUBJECT_MAP[subject.trim().toLowerCase()] ?? "default";
}

/**
 * Accent — fills, bars, rings, glyphs, and text on this subject's own tint,
 * where every accent clears 4.5:1 by construction. Algebra has a stronger
 * option on a sky field in `--color-lapis-dark` (9.5:1); reach for that token
 * directly. There is no separate `subjectTextColor()`: it returned this exact
 * value, and a synonym only invites using it somewhere the guarantee is not
 * about — the accent is safe on the subject's *tint*, not on any surface.
 */
export function subjectColor(subject: string): string {
  return SUBJECT_PALETTE[subjectKey(subject)].accentVar;
}

/** Tint — the surface fill for cards, badges and washes. */
export function subjectTint(subject: string): string {
  return SUBJECT_PALETTE[subjectKey(subject)].tintVar;
}
