import { describe, expect, it } from "vitest";

import { museionFoundations, recommendCurriculumNodes, validateCurriculumGraph } from "@/lib/curriculum";

describe("curriculum graph", () => {
  it("keeps the authored foundation map acyclic and fully linked", () => {
    expect(validateCurriculumGraph(museionFoundations).issues).toEqual([]);
  });

  it("recommends only unlocked nodes", () => {
    const start = recommendCurriculumNodes(museionFoundations, new Set());
    expect(start.map(({ id }) => id)).toEqual(["negative-numbers", "order-of-operations"]);
    const afterFoundations = recommendCurriculumNodes(museionFoundations, new Set(["negative-numbers", "order-of-operations"]));
    expect(afterFoundations.map(({ id }) => id)).toEqual(["fractions-unlike-denominators", "linear-equations-intro", "binary-numbers"]);
  });

  it("fails closed on dangling prerequisites and cycles", () => {
    const dangling = structuredClone(museionFoundations);
    dangling.nodes[0].prerequisiteIds = ["unknown-node"];
    expect(validateCurriculumGraph(dangling).issues.map(({ code }) => code)).toContain("missing-prerequisite");
    const cyclic = structuredClone(museionFoundations);
    cyclic.nodes[0].prerequisiteIds = ["linear-equations-intro"];
    expect(validateCurriculumGraph(cyclic).issues.map(({ code }) => code)).toContain("cycle");
  });
});
