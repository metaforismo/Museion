import { describe, expect, it } from "vitest";

import binarySearchInvariant from "@/lib/content/lessons/search-by-halving-binary-search-invariant";
import logarithmicReasoningAndTransfer from "@/lib/content/lessons/search-by-halving-logarithmic-reasoning-and-transfer";
import sortedSearchSpace from "@/lib/content/lessons/search-by-halving-sorted-search-space";
import { toPublicLesson, type Lesson, type Step } from "@/lib/content/types";
import { validateLesson } from "@/lib/content/validate";
import { verify } from "@/lib/engine/verifier";

const lessons = [
  sortedSearchSpace,
  binarySearchInvariant,
  logarithmicReasoningAndTransfer,
] satisfies Lesson[];

function item(lesson: Lesson, id: string): Step {
  const found = [...lesson.steps, ...(lesson.practice ?? [])].find((step) => step.id === id);
  if (!found) throw new Error(`Missing authored item ${lesson.id}/${id}`);
  return found;
}

describe("Search by Halving authoring contract", () => {
  it.each(lessons.map((lesson) => [lesson.id, lesson] as const))(
    "%s passes deterministic lesson validation",
    (_id, lesson) => {
      expect(validateLesson(lesson)).toEqual([]);
    },
  );

  it.each(lessons.map((lesson) => [lesson.id, lesson] as const))(
    "%s has the required depth, practice, hints, and exact private truth",
    (_id, lesson) => {
      expect(lesson.steps.length).toBeGreaterThanOrEqual(4);
      expect(lesson.steps.length).toBeLessThanOrEqual(6);
      expect(lesson.practice?.length).toBeGreaterThanOrEqual(5);
      expect(lesson.practice?.length).toBeLessThanOrEqual(8);

      for (const step of [...lesson.steps, ...(lesson.practice ?? [])]) {
        expect(step.solution.trim().length).toBeGreaterThan(0);
        expect(step.hints.length).toBeGreaterThanOrEqual(2);
        expect(step.hints.length).toBeLessThanOrEqual(3);
        if (step.answer.kind === "numeric") expect(step.answer.tolerance).toBe(0);
      }
    },
  );

  it("uses globally distinctive lesson and item ids within the workstream", () => {
    const lessonIds = lessons.map(({ id }) => id);
    const itemIds = lessons.flatMap((lesson) =>
      [...lesson.steps, ...(lesson.practice ?? [])].map(({ id }) => id),
    );
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    expect(new Set(itemIds).size).toBe(itemIds.length);
    expect(itemIds.every((id) => id.startsWith("sh-"))).toBe(true);
  });

  it("keeps every registered misconception wrong and diagnostically reachable", () => {
    for (const lesson of lessons) {
      for (const step of [...lesson.steps, ...(lesson.practice ?? [])]) {
        for (const misconception of step.misconceptions) {
          expect(misconception.triggerAnswers.length).toBeGreaterThan(0);
          for (const trigger of misconception.triggerAnswers) {
            const result = verify(step, trigger);
            expect(result.correct, `${lesson.id}/${step.id}: ${trigger}`).toBe(false);
            expect(result.misconception?.id, `${lesson.id}/${step.id}: ${trigger}`).toBe(
              misconception.id,
            );
          }
        }
      }
    }
  });

  it("publishes prompts and choices without private evaluator truth", () => {
    for (const lesson of lessons) {
      const serialized = JSON.stringify(toPublicLesson(lesson));
      for (const restricted of [
        "answer",
        "acceptedForms",
        "correctIndex",
        "solution",
        "hints",
        "misconceptions",
        "triggerAnswers",
        "remediationFocus",
      ]) {
        expect(serialized).not.toContain(`\"${restricted}\"`);
      }
    }
  });
});

describe("Search by Halving edge cases and invariant checks", () => {
  it("represents empty and singleton arrays with inclusive bounds", () => {
    expect(verify(item(sortedSearchSpace, "sh-space-practice-empty"), "0").correct).toBe(true);
    expect(verify(item(sortedSearchSpace, "sh-space-practice-singleton"), "[0, 0]").correct).toBe(true);
    expect(verify(item(binarySearchInvariant, "sh-invariant-practice-empty-init"), "0,-1").correct).toBe(true);
  });

  it("keeps a boundary target and removes a disproved midpoint", () => {
    const boundary = item(binarySearchInvariant, "sh-invariant-practice-first-boundary");
    expect(verify(boundary, "0,0").correct).toBe(true);
    expect(verify(boundary, "0,1").misconception?.id).toBe(
      "sh-invariant-keeps-large-boundary-mid",
    );
    expect(verify(boundary, "1,0").misconception?.id).toBe(
      "sh-invariant-discards-low-boundary",
    );
  });

  it("terminates an absent-target trace only after bounds cross", () => {
    const first = item(binarySearchInvariant, "sh-invariant-practice-absent-first");
    const finish = item(binarySearchInvariant, "sh-invariant-practice-absent-finish");
    expect(verify(first, "3,4").correct).toBe(true);
    expect(verify(first, "absent").misconception?.id).toBe(
      "sh-invariant-absent-guessed-before-empty",
    );
    expect(verify(finish, "3,2").correct).toBe(true);
  });

  it("keeps duplicate behavior within the stated any-occurrence contract", () => {
    const duplicates = item(sortedSearchSpace, "sh-space-step-duplicates");
    expect(verify(duplicates, "Any of indices 1, 2, or 3").correct).toBe(true);
    expect(verify(duplicates, "Only index 1").misconception?.id).toBe(
      "sh-space-assumes-leftmost-contract",
    );
  });

  it("rejects unsorted-input reasoning even after a lucky midpoint hit", () => {
    const invalid = item(sortedSearchSpace, "sh-space-step-invalid-use");
    expect(
      verify(invalid, "The discard rules are not justified because the array is not sorted").correct,
    ).toBe(true);
    expect(
      verify(invalid, "The discard rules are justified because 4 was found").misconception?.id,
    ).toBe("sh-space-lucky-hit-validates-method");
  });

  it("bounds repeated halving without making a timing claim", () => {
    expect(
      verify(item(logarithmicReasoningAndTransfer, "sh-log-step-three-halvings"), "8").correct,
    ).toBe(true);
    expect(
      verify(item(logarithmicReasoningAndTransfer, "sh-log-practice-fifty-to-one"), "6").correct,
    ).toBe(true);
    expect(
      verify(
        item(logarithmicReasoningAndTransfer, "sh-log-practice-no-timing-claim"),
        "Binary search will save exactly 2 seconds",
      ).misconception?.id,
    ).toBe("sh-log-practice-exact-seconds");
  });

  it("transfers the strict-update invariant to a sorted catalog trace", () => {
    const transfer = item(logarithmicReasoningAndTransfer, "sh-log-practice-transfer-trace");
    expect(verify(transfer, "4,6").correct).toBe(true);
    expect(verify(transfer, "3,6").misconception?.id).toBe("sh-log-transfer-keeps-mid");
    expect(verify(transfer, "0,2").misconception?.id).toBe("sh-log-transfer-wrong-side");
  });
});
