import { describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import type { AnswerSpec, Step } from "@/lib/content/types";
import { parseNumber, verify } from "@/lib/engine/verifier";

function makeStep(answer: AnswerSpec): Step {
  return {
    id: "s",
    concept: "c",
    prompt: "p",
    answer,
    solution: "sol",
    misconceptions: [],
    hints: [],
  };
}

describe("parseNumber", () => {
  it("parses integers, decimals and fractions", () => {
    expect(parseNumber("4")).toBe(4);
    expect(parseNumber("4.5")).toBe(4.5);
    expect(parseNumber("-1/2")).toBe(-0.5);
    expect(parseNumber("11/5")).toBe(2.2);
  });

  it("rejects garbage and division by zero", () => {
    expect(parseNumber("banana")).toBeNull();
    expect(parseNumber("1/0")).toBeNull();
  });
});

describe("verify: numeric", () => {
  const step = makeStep({ kind: "numeric", value: 4, tolerance: 0 });

  it("accepts exact and equivalent forms", () => {
    expect(verify(step, "4").correct).toBe(true);
    expect(verify(step, " 4.0 ").correct).toBe(true);
    expect(verify(step, "8/2").correct).toBe(true);
  });

  it("rejects wrong and non-numeric answers without throwing", () => {
    expect(verify(step, "5").correct).toBe(false);
    expect(verify(step, "banana").correct).toBe(false);
  });
});

describe("verify: multiple choice", () => {
  const step = makeStep({
    kind: "multipleChoice",
    options: ["yes", "no"],
    correctIndex: 1,
  });

  it("accepts the option text and the option index", () => {
    expect(verify(step, "no").correct).toBe(true);
    expect(verify(step, " NO ").correct).toBe(true);
    expect(verify(step, "1").correct).toBe(true);
  });

  it("rejects the other option by text or index", () => {
    expect(verify(step, "yes").correct).toBe(false);
    expect(verify(step, "0").correct).toBe(false);
  });
});

describe("verify: expression", () => {
  const step = makeStep({ kind: "expression", acceptedForms: ["5/6"] });

  it("normalizes whitespace and case", () => {
    expect(verify(step, " 5 / 6 ").correct).toBe(true);
    expect(verify(step, "2/5").correct).toBe(false);
  });
});

describe("misconception matching", () => {
  it("matches a known wrong path in a real lesson", () => {
    const step = getLesson("linear-equations-intro")!.steps[0];
    const result = verify(step, "2");
    expect(result.correct).toBe(false);
    expect(result.misconception?.id).toBe("subtract-the-coefficient");
  });

  it("matches numerically equivalent trigger forms", () => {
    const step = getLesson("linear-equations-intro")!.steps[3];
    for (const raw of ["2.2", "11/5"]) {
      expect(verify(step, raw).misconception?.id).toBe(
        "wrong-order-divides-first",
      );
    }
  });
});
