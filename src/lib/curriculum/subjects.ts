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

/** Accent — fills, bars, rings, glyphs. */
export function subjectColor(subject: string): string {
  return SUBJECT_PALETTE[subjectKey(subject)].accentVar;
}

/** Tint — the surface fill for cards, badges and washes. */
export function subjectTint(subject: string): string {
  return SUBJECT_PALETTE[subjectKey(subject)].tintVar;
}

/** Text colour guaranteed to clear 4.5:1 on this subject's own tint. */
export function subjectTextColor(subject: string): string {
  return SUBJECT_PALETTE[subjectKey(subject)].accentVar;
}
