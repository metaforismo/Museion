import { describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import { buildPracticeLesson, hasPractice } from "@/lib/engine/practice";
import { LearnerSession } from "@/lib/engine/session";

describe("practice mode", () => {
  it("knows which lessons have practice banks", () => {
    expect(hasPractice(getLesson("linear-equations-intro")!)).toBe(true);
    expect(hasPractice(getLesson("fractions-unlike-denominators")!)).toBe(false);
  });

  it("builds a synthetic lesson from the practice bank", () => {
    const lesson = getLesson("linear-equations-intro")!;
    const practice = buildPracticeLesson(lesson);
    expect(practice.id).toBe("linear-equations-intro::practice");
    expect(practice.title).toContain("Practice");
    expect(practice.steps.length).toBeGreaterThan(0);
    expect(practice.steps.length).toBeLessThanOrEqual(lesson.practice!.length);
    const bankIds = new Set(lesson.practice!.map((s) => s.id));
    for (const step of practice.steps) {
      expect(bankIds.has(step.id)).toBe(true);
    }
    // The synthetic lesson must not advertise further practice.
    expect(hasPractice(practice)).toBe(false);
  });

  it("caps the practice set at the requested size", () => {
    const lesson = getLesson("order-of-operations")!;
    expect(buildPracticeLesson(lesson, 2).steps).toHaveLength(2);
  });

  it("throws for lessons without a practice bank", () => {
    expect(() =>
      buildPracticeLesson(getLesson("fractions-unlike-denominators")!),
    ).toThrow(/no practice exercises/);
  });

  it("runs as a normal session with the practice mode flag", () => {
    const practice = buildPracticeLesson(getLesson("binary-numbers")!, 2);
    const session = new LearnerSession(practice, "practice");
    expect(session.mode).toBe("practice");
    expect(session.complete).toBe(false);
    // Steps verify against their own specs regardless of order.
    for (const step of practice.steps) {
      expect(session.currentStep.id).toBe(step.id);
      const solutions: Record<string, string> = {
        "practice-1": "7",
        "practice-2": "10",
        "practice-3": "1001",
      };
      expect(session.submitAnswer(solutions[step.id]).correct).toBe(true);
    }
    expect(session.complete).toBe(true);
  });
});
