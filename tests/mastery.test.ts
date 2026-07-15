import { describe, expect, it } from "vitest";

import { MasteryModel } from "@/lib/engine/mastery";

describe("MasteryModel", () => {
  it("starts as novice with the full hint ladder", () => {
    const model = new MasteryModel();
    expect(model.mastery("algebra")).toBe(0);
    expect(model.scaffoldingLevel("algebra")).toBe("novice");
    expect(model.maxHintDepth("algebra")).toBe(3);
  });

  it("fades scaffolding as unassisted success accumulates", () => {
    const model = new MasteryModel();
    for (let i = 0; i < 10; i++) {
      model.recordAttempt("algebra", true, true, 0);
    }
    expect(model.mastery("algebra")).toBeGreaterThan(0.8);
    expect(model.scaffoldingLevel("algebra")).toBe("proficient");
    expect(model.maxHintDepth("algebra")).toBe(1);
  });

  it("discounts assisted success versus unassisted", () => {
    const assisted = new MasteryModel();
    const unassisted = new MasteryModel();
    for (let i = 0; i < 5; i++) {
      assisted.recordAttempt("c", true, false, 2);
      unassisted.recordAttempt("c", true, true, 0);
    }
    expect(assisted.mastery("c")).toBeLessThan(unassisted.mastery("c"));
  });

  it("lowers mastery on failure", () => {
    const model = new MasteryModel();
    model.recordAttempt("c", true, true, 0);
    const before = model.mastery("c");
    model.recordAttempt("c", false, true, 0);
    expect(model.mastery("c")).toBeLessThan(before);
  });
});
