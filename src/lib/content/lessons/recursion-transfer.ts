import type { Lesson } from "../types";

const lesson = {
  id: "recursion-transfer",
  title: "Near Transfer: A New Recursive Definition",
  track: "Computer Science",
  description:
    "For learners ages 14+ who can trace base case, progress, and unwind order: apply that same reasoning to a brand-new recursive definition, power(b, e), and to a fresh doubling context.",
  concepts: [
    "recursion-base-case-identification",
    "recursion-predicted-value",
    "recursion-termination-diagnosis",
    "recursion-near-transfer",
  ],
  steps: [
    {
      id: "rec-transfer-step-identify-base-case",
      concept: "recursion-base-case-identification",
      prompt:
        "A function power(b, e) should compute b raised to the whole-number power e (e >= 0), using the recursive case: for e > 0, power(b, e) = b * power(b, e - 1). Which base case correctly completes the definition?",
      answer: {
        kind: "multipleChoice",
        options: [
          "if e == 0: return 1",
          "if e == 0: return 0",
          "if e == 1: return b",
          "if b == 0: return 1",
        ],
        correctIndex: 0,
      },
      solution:
        "Any number raised to the power 0 equals 1, so the base case must return that identity value: if e == 0: return 1. This also makes the recursive case work correctly at its final step — power(b, 1) = b * power(b, 0) = b * 1 = b, as expected.",
      misconceptions: [
        {
          id: "rec-transfer-wrong-identity-value",
          triggerAnswers: ["if e == 0: return 0", "1"],
          description:
            "The learner assumed the base case should return 0, treating it like an 'empty' or default numeric value rather than the multiplicative identity.",
          remediationFocus:
            "Any number to the power 0 is 1, not 0 — the base case must return the value that leaves later multiplications unchanged, which is 1.",
        },
        {
          id: "rec-transfer-base-case-off-by-one",
          triggerAnswers: ["if e == 1: return b", "2"],
          description:
            "The learner set the base case one step later than needed, at e == 1 instead of e == 0.",
          remediationFocus:
            "Check what happens for power(b, 0) with this base case: e == 1 is never tested at e == 0, so the recursion has no way to stop there. The base case must match the smallest value e actually reaches.",
        },
        {
          id: "rec-transfer-wrong-variable",
          triggerAnswers: ["if b == 0: return 1", "3"],
          description:
            "The learner wrote a base case that checks b, the value that never changes across recursive calls, instead of e, the value that decreases.",
          remediationFocus:
            "The recursive calls change e, not b — the base case must test the variable that actually moves toward a stopping value.",
        },
      ],
      hints: [
        "Which variable changes with each recursive call: b, or e?",
        "What does mathematics say any number raised to the power 0 equals?",
      ],
    },
    {
      id: "rec-transfer-step-predict-value",
      concept: "recursion-predicted-value",
      prompt:
        "Using power(b, e) = 1 if e == 0 else b * power(b, e - 1), predict power(3, 4).",
      answer: { kind: "numeric", value: 81, tolerance: 0 },
      solution:
        "power(3, 4) = 3 * power(3, 3) = 3 * 3 * power(3, 2) = 3 * 3 * 3 * power(3, 1) = 3 * 3 * 3 * 3 * power(3, 0) = 3 * 3 * 3 * 3 * 1 = 81.",
      misconceptions: [
        {
          id: "rec-transfer-multiplies-base-by-exponent",
          triggerAnswers: ["12"],
          description:
            "The learner computed b * e (3 * 4 = 12), treating repeated multiplication as if it were a single multiplication.",
          remediationFocus:
            "Trace the actual recursive multiplications: power(3, 4) unwinds to 3 * 3 * 3 * 3, four factors of 3, not 3 * 4.",
        },
        {
          id: "rec-transfer-swaps-base-and-exponent",
          triggerAnswers: ["64"],
          description:
            "The learner computed e raised to the power b (4 * 4 * 4 = 64) instead of b raised to the power e.",
          remediationFocus:
            "Keep b as the fixed repeated factor and e as the count of multiplications and the value that decreases toward the base case.",
        },
      ],
      hints: [
        "Unwind the recursive calls one at a time: power(3,4), power(3,3), power(3,2), power(3,1), power(3,0).",
        "Multiply the four 3s together — one for each level from e = 4 down to e = 1.",
      ],
    },
    {
      id: "rec-transfer-step-diagnose-non-termination",
      concept: "recursion-termination-diagnosis",
      prompt:
        "A learner writes: power_buggy(b, e) = 1 if e == 0 else b * power_buggy(b, e). Why does power_buggy(3, 4) never terminate?",
      answer: {
        kind: "multipleChoice",
        options: [
          "the base case never returns a value",
          "the recursive call passes e unchanged, so e never decreases to reach the base case e == 0",
          "multiplication cannot be used inside a recursive case",
          "the base case checks the wrong variable",
        ],
        correctIndex: 1,
      },
      solution:
        "A base case is present and correct — it checks e == 0 and returns 1. The defect is in the recursive call: it calls power_buggy(b, e) instead of power_buggy(b, e - 1), so e is never smaller on the next call. Since e starts at 4 and never changes, the condition e == 0 is never reached.",
      misconceptions: [
        {
          id: "rec-transfer-blames-missing-base-case",
          triggerAnswers: ["the base case never returns a value", "0"],
          description:
            "The learner claimed no base case exists, without noticing that 'if e == 0: return 1' is present and correctly written.",
          remediationFocus:
            "Confirm the base case first: it is present and checks e == 0 correctly. The actual defect is that e is never passed as e - 1 in the recursive call.",
        },
        {
          id: "rec-transfer-blames-multiplication",
          triggerAnswers: ["multiplication cannot be used inside a recursive case", "2"],
          description:
            "The learner attributed the non-termination to the use of multiplication rather than to the unchanged argument.",
          remediationFocus:
            "Multiplication inside a recursive case is fine — power(b, e) = b * power(b, e - 1) uses it correctly elsewhere. The required fix is passing e - 1, not removing multiplication.",
        },
        {
          id: "rec-transfer-blames-wrong-base-case-variable",
          triggerAnswers: ["the base case checks the wrong variable", "3"],
          description:
            "The learner claimed the base case tests the wrong variable, when e is in fact the correct variable to test — it just never reaches 0 here.",
          remediationFocus:
            "The base case correctly tests e; the problem is upstream, in the recursive call that fails to decrease e.",
        },
      ],
      hints: [
        "Check the base case first: is e == 0 the right thing to test? Is it written correctly?",
        "Compare the recursive call here with power(b, e - 1) — what's different about the argument?",
      ],
    },
    {
      id: "rec-transfer-step-doubling-transfer",
      concept: "recursion-near-transfer",
      prompt:
        "A cell culture doubles every generation. Model it as cells(n) = 1 if n == 0 else 2 * cells(n - 1), where n counts generations starting from one cell. Predict cells(5).",
      answer: { kind: "numeric", value: 32, tolerance: 0 },
      solution:
        "cells(5) = 2 * cells(4) = 2 * 2 * cells(3) = 2 * 2 * 2 * cells(2) = 2 * 2 * 2 * 2 * cells(1) = 2 * 2 * 2 * 2 * 2 * cells(0) = 2 * 2 * 2 * 2 * 2 * 1 = 32. This is the same base-case-plus-progress pattern as power(b, e), with a fixed factor of 2 instead of b.",
      misconceptions: [
        {
          id: "rec-transfer-doubling-adds-instead",
          triggerAnswers: ["10"],
          description:
            "The learner grew the population linearly (such as 2 * 5) instead of multiplying repeatedly.",
          remediationFocus:
            "Each generation multiplies the previous count by 2; trace cells(0) through cells(5), multiplying by 2 at every step, not adding.",
        },
        {
          id: "rec-transfer-doubling-off-by-one-generation",
          triggerAnswers: ["16"],
          description:
            "The learner stopped one generation early, effectively reporting cells(4) instead of the requested cells(5).",
          remediationFocus:
            "Count generations from the base case n = 0 up through n = 5, the requested value; recheck the trace has exactly five doublings, not four.",
        },
      ],
      hints: [
        "This has the same shape as power(b, e) — what plays the role of b here?",
        "Trace cells(0), cells(1), cells(2), ... up to cells(5), doubling at each step.",
      ],
    },
  ],
  practice: [
    {
      id: "rec-transfer-practice-predict-value",
      concept: "recursion-predicted-value",
      prompt:
        "Using power(b, e) = 1 if e == 0 else b * power(b, e - 1), predict power(5, 3).",
      answer: { kind: "numeric", value: 125, tolerance: 0 },
      solution:
        "power(5, 3) = 5 * power(5, 2) = 5 * 5 * power(5, 1) = 5 * 5 * 5 * power(5, 0) = 5 * 5 * 5 * 1 = 125.",
      misconceptions: [
        {
          id: "rec-transfer-practice-adds-instead",
          triggerAnswers: ["15"],
          description:
            "The learner computed b * e (5 * 3 = 15) instead of tracing the repeated multiplication.",
          remediationFocus:
            "Unwind the recursive calls: power(5, 3) is 5 * 5 * 5, three factors of 5, not 5 * 3.",
        },
        {
          id: "rec-transfer-practice-swaps-again",
          triggerAnswers: ["243"],
          description:
            "The learner computed e raised to the power b (3 * 3 * 3 * 3 * 3 = 243) instead of b raised to the power e.",
          remediationFocus:
            "Keep b fixed as the repeated factor; e counts how many times to multiply it and is the value that decreases toward the base case.",
        },
      ],
      hints: [
        "Unwind power(5,3), power(5,2), power(5,1), power(5,0) one level at a time.",
        "Multiply three 5s together.",
      ],
    },
    {
      id: "rec-transfer-practice-multiplication-count",
      concept: "recursion-near-transfer",
      prompt:
        "Using power(b, e) = 1 if e == 0 else b * power(b, e - 1), how many multiplication operations (b * ...) are performed while evaluating power(2, 5)? The base case itself does not perform a multiplication.",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution:
        "The calls with e > 0 are e = 5, 4, 3, 2, 1, and each performs exactly one multiplication once its own recursive call returns. The base case, e = 0, returns 1 directly without multiplying. That is five multiplications in total.",
      misconceptions: [
        {
          id: "rec-transfer-practice-counts-base-case-mult",
          triggerAnswers: ["6"],
          description:
            "The learner counted the base-case call as if it also performed a multiplication.",
          remediationFocus:
            "The base case returns 1 directly without multiplying; count only the calls with e > 0, which is one per level from e = 5 down to e = 1.",
        },
        {
          id: "rec-transfer-practice-reports-final-value",
          triggerAnswers: ["32"],
          description:
            "The learner reported the computed value of power(2, 5) instead of the number of multiplication operations performed to compute it.",
          remediationFocus:
            "Separate the result from the process: count how many multiplications occur while unwinding, not what they multiply out to.",
        },
      ],
      hints: [
        "List the calls with e > 0: e = 5, 4, 3, 2, 1.",
        "Each of those levels performs exactly one multiplication; the base case does not.",
      ],
    },
    {
      id: "rec-transfer-practice-diagnose-moves-away",
      concept: "recursion-termination-diagnosis",
      prompt:
        "Another buggy version: power_buggy2(b, e) = 1 if e == 0 else b * power_buggy2(b, e + 1). For power_buggy2(3, 2), why does it never terminate?",
      answer: {
        kind: "multipleChoice",
        options: [
          "e increases every call, moving away from the base case e == 0, instead of decreasing toward it",
          "the base case should return 0, not 1",
          "b changes with each call when it should stay fixed",
        ],
        correctIndex: 0,
      },
      solution:
        "The base case (e == 0: return 1) is fine, and b correctly stays fixed across calls. The defect is that the recursive call uses e + 1: instead of moving e toward 0, it moves e away from 0 with every call, so e == 0 is never reached starting from e = 2.",
      misconceptions: [
        {
          id: "rec-transfer-practice-wrong-identity-again",
          triggerAnswers: ["the base case should return 0, not 1", "1"],
          description:
            "The learner misdiagnosed the bug as an incorrect base-case value instead of noticing the direction the argument moves.",
          remediationFocus:
            "The base case's return value (1) is correct here; the problem is that e moves in the wrong direction with each call, never reaching 0.",
        },
        {
          id: "rec-transfer-practice-blames-fixed-variable",
          triggerAnswers: ["b changes with each call when it should stay fixed", "2"],
          description:
            "The learner attributed the bug to b, which never actually changes across calls.",
          remediationFocus:
            "b is unchanged here, exactly as it should be; the variable to examine is e, which is what the recursive call modifies.",
        },
      ],
      hints: [
        "Check which variable the recursive call actually changes.",
        "Does e move toward 0 or away from it with each call?",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
