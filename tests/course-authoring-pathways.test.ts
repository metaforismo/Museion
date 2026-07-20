import { describe, expect, it } from "vitest";

import { toPublicLesson, validateLesson } from "@/lib/content";
import type { Lesson, PublicStep } from "@/lib/content/types";
import probabilitySampleSpaces from "@/lib/content/lessons/probability-as-evidence-sample-spaces";
import probabilityConditionalEvidence from "@/lib/content/lessons/probability-as-evidence-conditional-evidence";
import probabilityBaseRates from "@/lib/content/lessons/probability-as-evidence-base-rates";
import functionsInputOutput from "@/lib/content/lessons/functions-as-change-input-output";
import functionsRateOfChange from "@/lib/content/lessons/functions-as-change-rate-of-change";
import functionsLinearModels from "@/lib/content/lessons/functions-as-change-linear-models";
import { verify } from "@/lib/engine/verifier";

const pathways = {
  "probability-as-evidence": [
    probabilitySampleSpaces,
    probabilityConditionalEvidence,
    probabilityBaseRates,
  ],
  "functions-as-change": [
    functionsInputOutput,
    functionsRateOfChange,
    functionsLinearModels,
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
    case "graph":
      return `a=${step.answer.target.a},h=${step.answer.target.h},k=${step.answer.target.k}`;
  }
}

function isPublicStep(value: PublicStep): boolean {
  return !("answer" in value) && !("solution" in value) && !("hints" in value) && !("misconceptions" in value);
}

describe("course-authoring pathways", () => {
  it.each(Object.entries(pathways))(
    "%s contains an authored three-lesson sequence",
    (_pathway, lessons) => {
      expect(lessons).toHaveLength(3);
      expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(3);
    },
  );

  it.each(Object.entries(pathways).flatMap(([pathway, lessons]) => lessons.map((lesson) => [pathway, lesson] as const)))
    ("%s lesson %s passes deterministic authoring checks and includes practice", (_pathway, lesson) => {
      expect(validateLesson(lesson)).toEqual([]);
      expect(lesson.steps).toHaveLength(3);
      expect(lesson.practice).toHaveLength(3);

      for (const step of [...lesson.steps, ...(lesson.practice ?? [])]) {
        expect(step.hints.length).toBeGreaterThan(0);
        expect(step.solution.trim().length).toBeGreaterThan(40);
        expect(verify(step, expectedAnswer(step)).correct).toBe(true);
        for (const misconception of step.misconceptions) {
          for (const trigger of misconception.triggerAnswers) {
            expect(verify(step, trigger).correct, `${lesson.id}/${step.id}/${misconception.id}`).toBe(false);
          }
        }
      }
    });

  it.each(Object.values(pathways).flat())(
    "keeps %s private answer and tutor material out of the public lesson payload",
    (lesson) => {
      const publicLesson = toPublicLesson(lesson);
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
