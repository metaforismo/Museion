/**
 * Subject accent colors. Small dots and hairlines only — the palette
 * stays calm; color signals which discipline a course belongs to without
 * turning cards into big colored boxes.
 */
export type SubjectKey = "algebra" | "arithmetic" | "cs" | "research" | "physics" | "biology" | "default";

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

/** CSS color value for a subject (var-backed). */
export function subjectColor(subject: string): string {
  const key = subjectKey(subject);
  return key === "default" ? "var(--color-lapis)" : `var(--color-subject-${key})`;
}
