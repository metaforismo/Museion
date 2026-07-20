import { describe, expect, it } from "vitest";

import { getLesson, toPublicLesson } from "@/lib/content";
import type { Lesson } from "@/lib/content/types";
import { validateLesson } from "@/lib/content/validate";
import { buildSessionState } from "@/lib/api-types";
import { LearnerSession } from "@/lib/engine/session";

function newSession() {
  return new LearnerSession(getLesson("linear-equations-intro")!);
}

/** Wrong answer that is neither correct nor a trigger for any surface. */
const NEUTRAL_WRONG = "1000";

describe("per-step variants", () => {
  it("keeps the base step through the first two attempts", () => {
    const session = newSession();
    expect(session.activeVariantIndex()).toBe(0);
    const first = session.submitAnswer("2");
    expect(first.correct).toBe(false);
    expect(first.activeVariantIndex).toBe(0);
    expect(session.activeStep.prompt).toContain("2x + 6 = 14");
  });

  it("activates variant 1 after two wrong attempts, with its own answer", () => {
    const session = newSession();
    session.submitAnswer("2");
    session.submitAnswer("14");
    expect(session.activeVariantIndex()).toBe(1);
    expect(session.activeStep.prompt).toContain("3x + 4 = 19");
    // The base answer is no longer accepted: the learner must solve the
    // surface actually in front of them.
    const baseAnswer = session.submitAnswer("6");
    expect(baseAnswer.correct).toBe(false);
    expect(baseAnswer.activeVariantIndex).toBe(1);
    const outcome = session.submitAnswer("4");
    expect(outcome.correct).toBe(true);
    expect(session.awaitingAdvance).toBe(true);
    session.advance();
    expect(session.stepIndex).toBe(1);
    expect(session.activeVariantIndex()).toBe(0);
  });

  it("diagnoses misconceptions against the active variant's triggers", () => {
    const session = newSession();
    session.submitAnswer(NEUTRAL_WRONG);
    session.submitAnswer(NEUTRAL_WRONG);
    // Variant 1 is 3x + 4 = 19: subtracting the coefficient means "3".
    const outcome = session.submitAnswer("3");
    expect(outcome.correct).toBe(false);
    expect(outcome.misconceptionId).toBe("subtract-the-coefficient");
  });

  it("serves the variant's hint ladder and snapshot", () => {
    const session = newSession();
    session.submitAnswer(NEUTRAL_WRONG);
    session.submitAnswer(NEUTRAL_WRONG);
    expect(session.requestHint()).toContain("3x + 4");
    expect(session.revealedHints()[0]).toContain("3x + 4");
    const snapshot = session.snapshot();
    expect(snapshot.stepPrompt).toContain("3x + 4 = 19");
    expect(snapshot.verifiedSolution).toContain("3x = 15");
  });

  it("advances to variant 2 and cycles back to the base when exhausted", () => {
    const session = newSession();
    for (let i = 0; i < 4; i += 1) session.submitAnswer(NEUTRAL_WRONG);
    expect(session.activeVariantIndex()).toBe(2);
    expect(session.activeStep.prompt).toContain("5x + 9 = 24");
    for (let i = 0; i < 2; i += 1) session.submitAnswer(NEUTRAL_WRONG);
    expect(session.activeVariantIndex()).toBe(0);
    expect(session.activeStep.prompt).toContain("2x + 6 = 14");
  });

  it("resolves the same variant deterministically for the same history", () => {
    const replay = () => {
      const session = newSession();
      session.submitAnswer("2");
      session.submitAnswer("14");
      return session.activeStep.prompt;
    };
    expect(replay()).toBe(replay());
  });

  it("replays the identical outcome for an idempotent retry", () => {
    const session = newSession();
    session.submitAnswer(NEUTRAL_WRONG);
    const guard = {
      expectedStepId: "step-1",
      expectedVersion: session.version,
      idempotencyKey: crypto.randomUUID(),
    };
    const first = session.submitAnswer(NEUTRAL_WRONG, guard);
    const retried = session.submitAnswer(NEUTRAL_WRONG, guard);
    expect(retried).toEqual(first);
    expect(retried.activeVariantIndex).toBe(1);
  });

  it("reports the active variant in the session state", () => {
    const session = newSession();
    const lesson = toPublicLesson(session.lesson);
    expect(buildSessionState(session, lesson).activeVariantIndex).toBe(0);
    session.submitAnswer(NEUTRAL_WRONG);
    session.submitAnswer(NEUTRAL_WRONG);
    expect(buildSessionState(session, lesson).activeVariantIndex).toBe(1);
  });

  it("exposes variant prompts publicly but never answers or solutions", () => {
    const lesson = getLesson("linear-equations-intro")!;
    const publicStep = toPublicLesson(lesson).steps[0];
    expect(publicStep.variants).toHaveLength(2);
    expect(publicStep.variants![0].prompt).toContain("3x + 4 = 19");
    const serialized = JSON.stringify(publicStep.variants);
    expect(serialized).not.toContain("solution");
    expect(serialized).not.toContain("misconception");
    expect(serialized).not.toContain('"value"');
  });

  it("validates variant triggers against the variant's own answer", () => {
    const lesson = getLesson("linear-equations-intro")!;
    expect(validateLesson(lesson)).toEqual([]);

    const broken: Lesson = {
      id: "broken",
      title: "Broken",
      track: "Algebra",
      description: "x",
      concepts: ["c"],
      steps: [
        {
          id: "s1",
          concept: "c",
          prompt: "p",
          answer: { kind: "numeric", value: 2, tolerance: 0 },
          solution: "two",
          misconceptions: [],
          hints: [],
          variants: [
            {
              prompt: "variant",
              answer: { kind: "numeric", value: 7, tolerance: 0 },
              solution: "seven",
              misconceptions: [
                {
                  id: "bad-trigger",
                  triggerAnswers: ["7"],
                  description: "d",
                  remediationFocus: "r",
                },
              ],
            },
          ],
        },
      ],
    };
    const issues = validateLesson(broken);
    expect(issues.some((issue) => issue.includes("variant-1") && issue.includes("bad-trigger"))).toBe(true);
  });
});
