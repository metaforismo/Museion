import { describe, expect, it } from "vitest";

import { allLessons, validateLesson } from "@/lib/content";
import type { Lesson } from "@/lib/content/types";

describe("lesson catalog", () => {
  it("has unique lesson ids", () => {
    const ids = allLessons().map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(allLessons().map((lesson) => [lesson.id, lesson] as const))(
    "lesson %s passes authoring validation",
    (_id, lesson) => {
      expect(validateLesson(lesson)).toEqual([]);
    },
  );
});

describe("validateLesson", () => {
  it("rejects a misconception trigger that is actually correct", () => {
    const broken: Lesson = {
      id: "broken",
      title: "Broken",
      track: "Arithmetic",
      description: "d",
      concepts: ["c"],
      steps: [
        {
          id: "s1",
          concept: "c",
          prompt: "p",
          answer: { kind: "numeric", value: 4, tolerance: 0 },
          solution: "sol",
          misconceptions: [
            {
              id: "bad",
              triggerAnswers: ["8/2"], // equals 4 — the correct answer!
              description: "d",
              remediationFocus: "r",
            },
          ],
          hints: [],
        },
      ],
    };
    const issues = validateLesson(broken);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("verifies as a CORRECT answer");
  });

  it("rejects undeclared concepts and out-of-range choice indices", () => {
    const broken: Lesson = {
      id: "broken-2",
      title: "Broken 2",
      track: "Arithmetic",
      description: "d",
      concepts: [],
      steps: [
        {
          id: "s1",
          concept: "ghost-concept",
          prompt: "p",
          answer: { kind: "multipleChoice", options: ["a", "b"], correctIndex: 5 },
          solution: "sol",
          misconceptions: [],
          hints: [],
        },
      ],
    };
    const issues = validateLesson(broken);
    expect(issues.some((i) => i.includes("ghost-concept"))).toBe(true);
    expect(issues.some((i) => i.includes("correctIndex out of range"))).toBe(true);
  });
});
