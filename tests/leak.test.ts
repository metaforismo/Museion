import { describe, expect, it } from "vitest";

import type { AnswerSpec, Step } from "@/lib/content/types";
import { revealsAnswer } from "@/lib/maia/leak";

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

describe("revealsAnswer: numeric", () => {
  const step = makeStep({ kind: "numeric", value: 4, tolerance: 0 });

  it("catches the bare value, decimal and fraction forms", () => {
    expect(revealsAnswer(step, "The answer is 4.")).toBe(true);
    expect(revealsAnswer(step, "you get 4.0 in the end")).toBe(true);
    expect(revealsAnswer(step, "it comes out to 8/2")).toBe(true);
  });

  it("ignores other numbers and number-free coaching", () => {
    expect(revealsAnswer(step, "Look at the 2x on the left side.")).toBe(false);
    expect(
      revealsAnswer(step, "What operation undoes a multiplication?"),
    ).toBe(false);
  });
});

describe("revealsAnswer: multiple choice", () => {
  const step = makeStep({
    kind: "multipleChoice",
    options: ["yes", "no"],
    correctIndex: 1,
  });

  it("catches assertive reveals only", () => {
    expect(revealsAnswer(step, "The answer is no.")).toBe(true);
    expect(revealsAnswer(step, 'The correct option is "no".')).toBe(true);
  });

  it("tolerates ordinary use of the option word", () => {
    expect(
      revealsAnswer(step, "No rush — think about the size of the pieces."),
    ).toBe(false);
    expect(revealsAnswer(step, "There is no shortcut here.")).toBe(false);
  });
});

describe("revealsAnswer: expression", () => {
  const step = makeStep({ kind: "expression", acceptedForms: ["5/6"] });

  it("catches accepted forms even with spacing", () => {
    expect(revealsAnswer(step, "you would write 5 / 6")).toBe(true);
  });

  it("ignores other fractions", () => {
    expect(revealsAnswer(step, "Remember 1/2 becomes 3/6.")).toBe(false);
  });
});
