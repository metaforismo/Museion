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

describe("verify: graph", () => {
  const spec: AnswerSpec = {
    kind: "graph",
    family: "quadratic-vertex",
    target: { a: 1, h: 3, k: 2 },
    tolerance: 0.25,
    xRange: [-6, 6],
    yRange: [-2, 8],
  };

  it("accepts the exact parameter triple and values within tolerance", () => {
    const step = makeStep(spec);
    expect(verify(step, "a=1,h=3,k=2").correct).toBe(true);
    expect(verify(step, "A = 1, H = 3, K = 2").correct).toBe(true);
    expect(verify(step, "a=1,h=3.25,k=2").correct).toBe(true);
  });

  it("rejects values outside tolerance and malformed input", () => {
    const step = makeStep(spec);
    expect(verify(step, "a=1,h=3.5,k=2").correct).toBe(false);
    expect(verify(step, "a=1,h=-3,k=2").correct).toBe(false);
    expect(verify(step, "vertex at three two").correct).toBe(false);
    expect(verify(step, "").correct).toBe(false);
  });

  it("matches graph misconception triggers per component with tolerance", () => {
    const step = getLesson("functions-as-change-transformation-lab")!.steps[1];
    expect(verify(step, "a=1,h=-3,k=2").misconception?.id).toBe("h-sign-flipped");
    expect(verify(step, "a=1,h=2,k=3").misconception?.id).toBe("h-k-swapped-on-graph");
    expect(verify(step, "a=2,h=3,k=2").misconception?.id).toBe("scaled-instead-of-shifted");
    expect(verify(step, "a=1,h=1,k=1").misconception).toBe(null);
  });

  it("never verifies a registered misconception trigger as correct", () => {
    const lesson = getLesson("functions-as-change-transformation-lab")!;
    for (const step of [...lesson.steps, ...(lesson.practice ?? [])]) {
      for (const misconception of step.misconceptions) {
        for (const trigger of misconception.triggerAnswers) {
          expect(verify(step, trigger).correct).toBe(false);
        }
      }
    }
  });
});

/**
 * Regression: the UI submits a multiple-choice answer as the option index, and
 * `verify` accepts an index as correct on purpose — but authored
 * triggerAnswers are option text, so passing the raw index to
 * matchMisconception meant no multiple-choice misconception could ever fire.
 * 63 authored MC steps, all carrying misconceptions, silently unable to name
 * one. Correctness must be unchanged; only the naming is restored.
 */
describe("multiple-choice misconception matching by index", () => {
  const step = {
    id: "probe",
    kind: "multipleChoice",
    prompt: "Which is an expression?",
    answer: { kind: "multipleChoice", options: ["3n + 5", "3n = 5"], correctIndex: 0 },
    misconceptions: [
      { id: "reads-equation-as-expression", label: "Reads an equation as an expression", triggerAnswers: ["3n = 5"] },
    ],
  } as unknown as Parameters<typeof verify>[0];

  it("names the misconception when the wrong option arrives as an index", () => {
    const result = verify(step, "1");
    expect(result.correct).toBe(false);
    expect(result.misconception?.id).toBe("reads-equation-as-expression");
  });

  it("still names it when the wrong option arrives as text", () => {
    expect(verify(step, "3n = 5").misconception?.id).toBe("reads-equation-as-expression");
  });

  it("leaves correctness by index and by text untouched", () => {
    expect(verify(step, "0").correct).toBe(true);
    expect(verify(step, "3n + 5").correct).toBe(true);
    expect(verify(step, "1").correct).toBe(false);
  });

  it("does not invent a misconception for an out-of-range index", () => {
    expect(verify(step, "9").misconception).toBeNull();
  });
});
