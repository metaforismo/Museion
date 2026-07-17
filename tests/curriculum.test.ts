import { describe, expect, it } from "vitest";

import { allLessons } from "@/lib/content";
import { coursePaths, getCourseLessonContext, museionFoundations, recommendCurriculumNodes, validateCurriculumGraph } from "@/lib/curriculum";

describe("curriculum graph", () => {
  it("keeps the authored foundation map acyclic and fully linked", () => {
    expect(validateCurriculumGraph(museionFoundations).issues).toEqual([]);
  });

  it("recommends only unlocked nodes", () => {
    const start = recommendCurriculumNodes(museionFoundations, new Set());
    expect(start.map(({ id }) => id)).toEqual(["negative-numbers", "order-of-operations", "sorted-search-space"]);
    const afterFoundations = recommendCurriculumNodes(museionFoundations, new Set(["negative-numbers", "order-of-operations"]));
    expect(afterFoundations.map(({ id }) => id)).toEqual(["fractions-unlike-denominators", "linear-equations-intro", "binary-numbers", "algebra-balance-equality-as-invariant", "sorted-search-space", "functions-as-change-input-output"]);
  });

  it("fails closed on dangling prerequisites and cycles", () => {
    const dangling = structuredClone(museionFoundations);
    dangling.nodes[0].prerequisiteIds = ["unknown-node"];
    expect(validateCurriculumGraph(dangling).issues.map(({ code }) => code)).toContain("missing-prerequisite");
    const cyclic = structuredClone(museionFoundations);
    cyclic.nodes[0].prerequisiteIds = ["linear-equations-intro"];
    expect(validateCurriculumGraph(cyclic).issues.map(({ code }) => code)).toContain("cycle");
  });

  it("connects every authored course path to distinct, registered lessons in sequence", () => {
    const lessons = new Set(allLessons().map((lesson) => lesson.id));
    const nodes = new Map(museionFoundations.nodes.map((node) => [node.id, node]));

    expect(coursePaths.map(({ id }) => id)).toEqual([
      "algebra-as-balance",
      "search-by-halving",
      "probability-as-evidence",
      "functions-as-change",
    ]);
    for (const course of coursePaths) {
      expect(new Set(course.lessonIds).size).toBe(course.lessonIds.length);
      for (const [index, lessonId] of course.lessonIds.entries()) {
        expect(lessons.has(lessonId)).toBe(true);
        expect(nodes.get(lessonId)?.lessonId).toBe(lessonId);
        if (index > 0) expect(nodes.get(lessonId)?.prerequisiteIds).toContain(course.lessonIds[index - 1]);
      }
    }
  });

  it("derives bounded previous and next navigation only for lessons in a course", () => {
    expect(getCourseLessonContext("algebra-as-balance", "algebra-balance-equality-as-invariant")).toMatchObject({
      courseTitle: "Algebra as Balance",
      lessonIndex: 0,
      totalLessons: 3,
      previousLessonId: null,
      nextLessonId: "algebra-balance-inverse-operations-and-isolation",
    });
    expect(getCourseLessonContext("algebra-as-balance", "algebra-balance-two-step-equations-and-transfer")).toMatchObject({
      lessonIndex: 2,
      previousLessonId: "algebra-balance-inverse-operations-and-isolation",
      nextLessonId: null,
    });
    expect(getCourseLessonContext("algebra-as-balance", "binary-numbers")).toBeUndefined();
    expect(getCourseLessonContext("missing-course", "binary-numbers")).toBeUndefined();
  });
});
