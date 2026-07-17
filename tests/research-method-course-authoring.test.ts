import { describe, expect, it } from "vitest";

import { toPublicLesson, validateLesson } from "@/lib/content";
import type { Lesson, PublicStep } from "@/lib/content/types";
import claimsOperationalize from "@/lib/content/lessons/claims-to-evidence-operationalize";
import claimsObservationInference from "@/lib/content/lessons/claims-to-evidence-observation-inference";
import claimsFalsifiableComparison from "@/lib/content/lessons/claims-to-evidence-falsifiable-comparison";
import samplesSamplingFrame from "@/lib/content/lessons/samples-to-conclusions-sampling-frame";
import samplesVariability from "@/lib/content/lessons/samples-to-conclusions-variability";
import samplesBoundedEstimates from "@/lib/content/lessons/samples-to-conclusions-bounded-estimates";
import { verify } from "@/lib/engine/verifier";

const pathways = {
  "claims-to-evidence": [
    claimsOperationalize,
    claimsObservationInference,
    claimsFalsifiableComparison,
  ],
  "samples-to-conclusions": [
    samplesSamplingFrame,
    samplesVariability,
    samplesBoundedEstimates,
  ],
} as const;

function expectedAnswer(step: Lesson["steps"][number]): string {
  switch (step.answer.kind) {
    case "numeric":
      return String(step.answer.value);
    case "multipleChoice":
      return String(step.answer.correctIndex);
    case "expression":
      return step.answer.acceptedForms[0];
  }
}

function isPublicStep(step: PublicStep): boolean {
  return !(
    "answer" in step ||
    "solution" in step ||
    "hints" in step ||
    "misconceptions" in step
  );
}

describe("research-method course authoring", () => {
  it.each(Object.entries(pathways))(
    "%s contains one complete three-lesson sequence",
    (_pathway, lessons) => {
      expect(lessons).toHaveLength(3);
      expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(3);
    },
  );

  it.each(
    Object.entries(pathways).flatMap(([pathway, lessons]) =>
      lessons.map((lesson) => [pathway, lesson] as const),
    ),
  )(
    "%s/%s has deterministic answers, misconception guards, and full scaffolding",
    (_pathway, lesson) => {
      expect(validateLesson(lesson)).toEqual([]);
      expect(lesson.steps).toHaveLength(3);
      expect(lesson.practice).toHaveLength(3);

      for (const step of [...lesson.steps, ...(lesson.practice ?? [])]) {
        expect(step.hints).toHaveLength(3);
        expect(step.solution.trim().length).toBeGreaterThan(80);
        expect(verify(step, expectedAnswer(step)).correct).toBe(true);

        for (const misconception of step.misconceptions) {
          expect(misconception.triggerAnswers.length).toBeGreaterThan(0);
          for (const trigger of misconception.triggerAnswers) {
            expect(
              verify(step, trigger).correct,
              `${lesson.id}/${step.id}/${misconception.id}`,
            ).toBe(false);
          }
        }
      }
    },
  );

  it.each(Object.values(pathways).flat())(
    "does not project private truth from %s to the browser",
    (lesson) => {
      const publicLesson = toPublicLesson(lesson);
      expect(publicLesson.steps).toHaveLength(3);
      expect(publicLesson.steps.every(isPublicStep)).toBe(true);

      const payload = JSON.stringify(publicLesson);
      expect(payload).not.toContain("acceptedForms");
      expect(payload).not.toContain("correctIndex");
      expect(payload).not.toContain("misconceptions");
      expect(payload).not.toContain("solution");
      expect(payload).not.toContain("hints");
    },
  );
});
