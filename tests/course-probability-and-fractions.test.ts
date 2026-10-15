import { describe, expect, it } from "vitest";

import { allLessons, validateLesson } from "@/lib/content";
import fractions from "@/lib/content/lessons/fractions-unlike-denominators";
import sampleSpaces from "@/lib/content/lessons/probability-as-evidence-sample-spaces";
import conditional from "@/lib/content/lessons/probability-as-evidence-conditional-evidence";
import baseRates from "@/lib/content/lessons/probability-as-evidence-base-rates";
import { LearnerSession } from "@/lib/engine/session";
import { verify } from "@/lib/engine/verifier";

const probability = [sampleSpaces, conditional, baseRates];

describe("probability teaching and diagnosis", () => {
  it.each(probability.map((lesson) => [lesson.id, lesson] as const))("%s diagnoses real UI option-index submissions", (_id, lesson) => {
    for (const step of [...lesson.steps, ...lesson.practice]) {
      if (step.answer.kind !== "multipleChoice") continue;
      for (const misconception of step.misconceptions) {
        for (const trigger of misconception.triggerAnswers) {
          const index = step.answer.options.indexOf(trigger);
          expect(index, `${lesson.id}/${step.id}/${misconception.id} must name a real option`).toBeGreaterThanOrEqual(0);
          expect(verify(step, String(index)).misconception?.id).toBe(misconception.id);
        }
      }
    }
  });

  it("distinguishes an event from its complement rather than using a symmetric half", () => {
    const step = sampleSpaces.steps[2];
    expect(verify(step, "1/3")).toMatchObject({ correct: false, misconception: { id: "keeps-event-instead-of-complement" } });
    expect(verify(step, "2/3").correct).toBe(true);
  });

  it("gives every shuffled count-table exercise its own complete scenario", () => {
    expect(conditional.practice[1].prompt).toMatch(/30 project folders/);
    expect(conditional.practice[1].prompt).toMatch(/Twelve/);
    for (const step of baseRates.practice.slice(1)) {
      expect(step.prompt).toMatch(/50 products/);
      expect(step.prompt).toMatch(/8 flawed products and 4 working products/);
    }
    for (const lesson of probability) {
      for (const step of lesson.practice) expect(step.prompt).not.toMatch(/for (?:those|that)|from the previous/i);
    }
  });
});

describe("fraction equivalence and contextual transfer", () => {
  it("accepts equivalent correct fractions with the existing numeric checker", () => {
    const addition = fractions.steps[2];
    for (const answer of ["5/6", "10/12", "20/24", "50/60"]) expect(verify(addition, answer).correct).toBe(true);
    expect(verify(addition, "2/5")).toMatchObject({ correct: false, misconception: { id: "adds-across" } });
  });

  it("checks the reference whole before adding part-to-whole fractions", () => {
    const step = fractions.steps.find((candidate) => candidate.concept === "same-whole")!;
    expect(verify(step, "no").correct).toBe(true);
    expect(verify(step, "yes").misconception?.id).toBe("ignores-reference-whole");
  });

  it("accepts equivalent contextual lengths and rejects a sum smaller than one part", () => {
    const step = fractions.steps.find((candidate) => candidate.id === "step-5")!;
    expect(verify(step, "14/16").correct).toBe(true);
    expect(verify(step, "1/3").misconception?.id).toBe("adds-across");
  });

  it("completes a genuine guided sequence while preserving the private answer boundary", () => {
    const session = new LearnerSession(fractions);
    for (const answer of ["no", "6", "10/12", "no", "14/16"]) {
      expect(session.submitAnswer(answer).correct).toBe(true);
      session.advance();
    }
    expect(session.complete).toBe(true);
    expect(session.stats().steps).toBe(5);
  });

  it("diagnoses every catalog misconception through the actual multiple-choice UI index", () => {
    for (const lesson of allLessons()) for (const step of [...lesson.steps, ...(lesson.practice ?? [])]) {
      if (step.answer.kind !== "multipleChoice") continue;
      for (const misconception of step.misconceptions) for (const trigger of misconception.triggerAnswers) {
        const index = step.answer.options.indexOf(trigger);
        expect(index, `${lesson.id}/${step.id}/${misconception.id} must name an option`).toBeGreaterThanOrEqual(0);
        expect(verify(step, String(index)).misconception?.id, `${lesson.id}/${step.id}/${misconception.id}`).toBe(misconception.id);
      }
    }
  });

  it("keeps all authored lessons structurally valid after the revisions", () => {
    for (const lesson of allLessons()) expect(validateLesson(lesson), lesson.id).toEqual([]);
  });
});
