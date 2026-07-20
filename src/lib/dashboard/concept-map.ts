import type { Track } from "@/lib/content/types";
import { getProfile, listSessionsForLearner } from "@/lib/store";

/**
 * The competence map: every concept the learner has actually answered,
 * grouped by subject, with the adaptive support estimate and a route
 * back to the lesson that teaches it. Estimates are scaffolding
 * signals, never mastery grades — the page says so next to every ring.
 */
export interface ConceptMapEntry {
  concept: string;
  label: string;
  subject: Track;
  /** Adaptive support estimate in [0, 1] — tunes scaffolding only. */
  estimate: number;
  support: "novice" | "developing" | "proficient";
  lessonId: string;
  lessonTitle: string;
}

export interface ConceptMapGroup {
  subject: Track;
  entries: ConceptMapEntry[];
}

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildConceptMap(learnerId: string): { groups: ConceptMapGroup[]; revisit: ConceptMapEntry[] } {
  const profile = getProfile(learnerId);
  if (!profile) return { groups: [], revisit: [] };

  const entries = new Map<string, ConceptMapEntry>();
  for (const session of listSessionsForLearner(learnerId)) {
    for (const event of session.events) {
      if (event.kind !== "answer_submitted" || typeof event.stepId !== "string") continue;
      const step = [...session.lesson.steps, ...(session.lesson.practice ?? [])].find(({ id }) => id === event.stepId);
      if (!step || entries.has(step.concept)) continue;
      entries.set(step.concept, {
        concept: step.concept,
        label: titleCase(step.concept),
        subject: session.lesson.track,
        estimate: profile.mastery.mastery(step.concept),
        support: profile.mastery.scaffoldingLevel(step.concept),
        lessonId: session.lesson.id,
        lessonTitle: session.lesson.title,
      });
    }
  }

  const bySubject = new Map<Track, ConceptMapEntry[]>();
  for (const entry of entries.values()) {
    const list = bySubject.get(entry.subject) ?? [];
    list.push(entry);
    bySubject.set(entry.subject, list);
  }
  const groups: ConceptMapGroup[] = [...bySubject.entries()]
    .map(([subject, list]) => ({ subject, entries: list.sort((a, b) => a.label.localeCompare(b.label)) }))
    .sort((a, b) => a.subject.localeCompare(b.subject));

  const revisit = [...entries.values()]
    .filter((entry) => entry.estimate < 0.5)
    .sort((a, b) => a.estimate - b.estimate)
    .slice(0, 6);

  return { groups, revisit };
}
