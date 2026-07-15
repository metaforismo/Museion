/**
 * Practice mode: retrieval practice from a lesson's exercise bank.
 *
 * Practice serves a shuffled sample of extra exercises with no hint
 * ladder — the testing effect: unassisted retrieval is what converts
 * in-session performance into durable learning. Maia stays available,
 * under the same non-revelation guardrail.
 */

import type { Lesson, Step } from "../content/types";

export const DEFAULT_PRACTICE_SIZE = 4;

export function hasPractice(lesson: Lesson): boolean {
  return (lesson.practice?.length ?? 0) > 0;
}

/** Fisher–Yates shuffle on a copy. */
function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build a synthetic lesson from the practice bank: shuffled order,
 * capped size. Throws when the lesson has no practice exercises.
 */
export function buildPracticeLesson(
  lesson: Lesson,
  size: number = DEFAULT_PRACTICE_SIZE,
): Lesson {
  const bank: Step[] = lesson.practice ?? [];
  if (bank.length === 0) {
    throw new Error(`Lesson ${lesson.id} has no practice exercises`);
  }
  return {
    ...lesson,
    id: `${lesson.id}::practice`,
    title: `${lesson.title} — Practice`,
    steps: shuffled(bank).slice(0, Math.max(1, size)),
    practice: [],
  };
}
