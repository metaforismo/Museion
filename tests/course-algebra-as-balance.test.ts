import { describe, expect, it } from "vitest";

import equalityAsInvariant from "@/lib/content/lessons/algebra-balance-equality-as-invariant";
import inverseOperationsAndIsolation from "@/lib/content/lessons/algebra-balance-inverse-operations-and-isolation";
import twoStepEquationsAndTransfer from "@/lib/content/lessons/algebra-balance-two-step-equations-and-transfer";
import { toPublicLesson } from "@/lib/content/types";
import { validateLesson } from "@/lib/content/validate";
import { verify } from "@/lib/engine/verifier";

const lessons = [
  equalityAsInvariant,
  inverseOperationsAndIsolation,
  twoStepEquationsAndTransfer,
];

function findStep(lesson: (typeof lessons)[number], id: string) {
  const step = [...lesson.steps, ...lesson.practice].find(
    (candidate) => candidate.id === id,
  );
  if (!step) throw new Error(`Missing authored step: ${id}`);
  return step;
}

describe("Algebra as Balance authoring contract", () => {
  it.each(lessons.map((lesson) => [lesson.id, lesson] as const))(
    "%s passes deterministic lesson validation",
    (_id, lesson) => {
      expect(validateLesson(lesson)).toEqual([]);
      expect(lesson.steps).toHaveLength(5);
      expect(lesson.practice).toHaveLength(6);
      expect(lesson.steps.every((step) => step.hints.length >= 2)).toBe(true);
      expect(lesson.steps.every((step) => step.hints.length <= 3)).toBe(true);
    },
  );

  it("uses globally distinctive lesson and step ids within the course", () => {
    const lessonIds = lessons.map((lesson) => lesson.id);
    const stepIds = lessons.flatMap((lesson) =>
      [...lesson.steps, ...lesson.practice].map((step) => step.id),
    );

    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    expect(new Set(stepIds).size).toBe(stepIds.length);
  });

  it("keeps private evaluator truth out of public DTOs", () => {
    for (const lesson of lessons) {
      const serialized = JSON.stringify(toPublicLesson(lesson));
      expect(serialized).not.toContain('"answer"');
      expect(serialized).not.toContain('"solution"');
      expect(serialized).not.toContain('"hints"');
      expect(serialized).not.toContain('"misconceptions"');
      expect(serialized).not.toContain("subtract 4 from both sides: 3x = 15");
    }
  });
});

describe("Algebra as Balance diagnostic paths", () => {
  it("diagnoses expression-versus-equation confusion", () => {
    const step = findStep(
      equalityAsInvariant,
      "algebra-balance-eqi-step-01",
    );
    expect(verify(step, "3n + 5").misconception?.id).toBe(
      "algebra-balance-eqi-chooses-long-expression",
    );
  });

  it("diagnoses a one-sided equality change", () => {
    const step = findStep(
      equalityAsInvariant,
      "algebra-balance-eqi-step-03",
    );
    expect(
      verify(step, "Add 3 only to the left side").misconception?.id,
    ).toBe("algebra-balance-eqi-one-side-change");
  });

  it("diagnoses coefficient-versus-constant confusion", () => {
    const step = findStep(
      inverseOperationsAndIsolation,
      "algebra-balance-inv-step-05",
    );
    expect(
      verify(step, "coefficient 6; added constant 4").misconception?.id,
    ).toBe("algebra-balance-inv-swaps-coefficient-constant");
  });

  it("diagnoses subtracting a coefficient instead of dividing", () => {
    const step = findStep(
      inverseOperationsAndIsolation,
      "algebra-balance-inv-step-03",
    );
    expect(verify(step, "30").misconception?.id).toBe(
      "algebra-balance-inv-subtracts-coefficient",
    );
  });

  it("diagnoses stopping at the value of the variable term", () => {
    const step = findStep(
      twoStepEquationsAndTransfer,
      "algebra-balance-two-step-02",
    );
    expect(verify(step, "15").misconception?.id).toBe(
      "algebra-balance-two-stops-after-first-move",
    );
  });

  it("diagnoses numeric-equivalent divide-before-constant paths", () => {
    const step = findStep(
      twoStepEquationsAndTransfer,
      "algebra-balance-two-step-05",
    );
    for (const raw of ["6.75", "27/4"]) {
      expect(verify(step, raw).misconception?.id).toBe(
        "algebra-balance-two-divides-total-before-tray",
      );
    }
  });

  it("accepts both authored valid-path reasoning and exact transfer answers", () => {
    const paths = findStep(
      twoStepEquationsAndTransfer,
      "algebra-balance-two-step-04",
    );
    const transfer = findStep(
      twoStepEquationsAndTransfer,
      "algebra-balance-two-practice-06",
    );

    expect(
      verify(paths, "Both paths are valid and give the same solution").correct,
    ).toBe(true);
    expect(verify(transfer, "7").correct).toBe(true);
  });
});
