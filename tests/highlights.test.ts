import { describe, expect, it } from "vitest";

import { getLesson, toPublicLesson } from "@/lib/content";
import type { Lesson } from "@/lib/content/types";
import { validateLesson } from "@/lib/content/validate";
import { LearnerSession } from "@/lib/engine/session";

function brokenLesson(overrides: Partial<Lesson["steps"][number]>): Lesson {
  return {
    id: "broken",
    title: "Broken",
    track: "Algebra",
    description: "x",
    concepts: ["c"],
    steps: [
      {
        id: "s1",
        concept: "c",
        prompt: "Solve 2x + 6 = 14.",
        answer: { kind: "numeric", value: 6, tolerance: 0 },
        solution: "six",
        misconceptions: [],
        hints: [],
        ...overrides,
      },
    ],
  };
}

describe("misconception highlights", () => {
  it("returns the authored highlight with a diagnosed wrong answer", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    const outcome = session.submitAnswer("2");
    expect(outcome.misconceptionId).toBe("subtract-the-coefficient");
    expect(outcome.misconceptionHighlight).toEqual({ kind: "term", text: "+ 6" });
  });

  it("returns no highlight for correct or undiagnosed answers", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    expect(session.submitAnswer("1000").misconceptionHighlight).toBeNull();
    expect(session.submitAnswer("6").misconceptionHighlight).toBeNull();
  });

  it("uses the active variant's highlight once a variant is live", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    session.submitAnswer("1000");
    session.submitAnswer("1000");
    // Variant 1 is 3x + 4 = 19; its subtract-the-coefficient trigger is "3".
    const outcome = session.submitAnswer("3");
    expect(outcome.misconceptionHighlight).toEqual({ kind: "term", text: "+ 4" });
  });

  it("replays the identical highlight for an idempotent retry", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    const guard = {
      expectedStepId: "step-1",
      expectedVersion: session.version,
      idempotencyKey: crypto.randomUUID(),
    };
    const first = session.submitAnswer("2", guard);
    const retried = session.submitAnswer("2", guard);
    expect(retried.misconceptionHighlight).toEqual(first.misconceptionHighlight);
  });

  it("attaches graph-region highlights on the transformation lab", () => {
    const session = new LearnerSession(getLesson("functions-as-change-transformation-lab")!);
    session.submitAnswer("0"); // correct MC predict
    session.advance();
    const outcome = session.submitAnswer("a=1,h=-3,k=2");
    expect(outcome.misconceptionId).toBe("h-sign-flipped");
    expect(outcome.misconceptionHighlight).toEqual({ kind: "graph-region", param: "h" });
  });

  it("keeps highlights out of the public lesson payload", () => {
    const serialized = JSON.stringify(toPublicLesson(getLesson("linear-equations-intro")!));
    expect(serialized).not.toContain("highlight");
  });

  it("rejects a term highlight that does not occur in the prompt", () => {
    const lesson = brokenLesson({
      misconceptions: [
        {
          id: "m",
          triggerAnswers: ["2"],
          description: "d",
          remediationFocus: "r",
          highlight: { kind: "term", text: "not in the prompt" },
        },
      ],
    });
    const issues = validateLesson(lesson);
    expect(issues.some((issue) => issue.includes("does not occur in the prompt"))).toBe(true);
  });

  it("rejects a graph-region highlight on a non-graph step", () => {
    const lesson = brokenLesson({
      misconceptions: [
        {
          id: "m",
          triggerAnswers: ["2"],
          description: "d",
          remediationFocus: "r",
          highlight: { kind: "graph-region", param: "h" },
        },
      ],
    });
    const issues = validateLesson(lesson);
    expect(issues.some((issue) => issue.includes("non-graph step"))).toBe(true);
  });

  it("validates every authored highlight in the shipped lessons", () => {
    for (const id of ["linear-equations-intro", "functions-as-change-transformation-lab"]) {
      expect(validateLesson(getLesson(id)!)).toEqual([]);
    }
  });
});
