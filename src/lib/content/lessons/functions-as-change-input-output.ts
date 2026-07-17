import type { Lesson } from "../types";

const lesson = {
  id: "functions-as-change-input-output",
  title: "Functions as Change: One Input, One Output",
  track: "Algebra",
  description:
    "Read a function as a dependable rule that maps an allowed input to one output.",
  concepts: ["function-rule", "input-output", "function-notation"],
  steps: [
    {
      id: "step-1",
      concept: "function-notation",
      prompt: "A rule is f(x) = 3x + 1. What is f(2)?",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution:
        "Substitute 2 for x: f(2) = 3(2) + 1 = 7. The notation f(2) names the output produced when 2 is the input; it is not 2 multiplied by f.",
      misconceptions: [
        {
          id: "omits-added-constant",
          triggerAnswers: ["6"],
          description: "The learner multiplied by 3 but did not apply the +1 part of the rule.",
          remediationFocus: "Evaluate every operation in the stated rule after replacing x with the input.",
        },
        {
          id: "adds-before-multiplying",
          triggerAnswers: ["9"],
          description: "The learner added 1 to 2 before multiplying by 3.",
          remediationFocus: "Use the rule’s operation order: multiplication happens before the final addition.",
        },
      ],
      hints: [
        "Replace x with 2 everywhere in 3x + 1.",
        "Compute 3 times 2 before adding 1.",
        "The result is the output associated with input 2.",
      ],
    },
    {
      id: "step-2",
      concept: "input-output",
      prompt:
        "A table pairs input 1 with 4, input 2 with 7, and input 3 with 10. Does this relation define a function?",
      answer: {
        kind: "multipleChoice",
        options: ["yes", "no"],
        correctIndex: 0,
      },
      solution:
        "Yes. Each input in the table is paired with exactly one output. Outputs may repeat in a function; the rule is broken only when one input is assigned more than one output.",
      misconceptions: [
        {
          id: "requires-outputs-to-be-unique",
          triggerAnswers: ["no"],
          description: "The learner believes a function must give different outputs for different inputs.",
          remediationFocus: "Check the input side: each individual input must have one output. Different inputs are allowed to share an output.",
        },
      ],
      hints: [
        "Check one input at a time. Does any listed input point to two different outputs?",
        "The requirement is one output per input, not one input per output.",
      ],
    },
    {
      id: "step-3",
      concept: "function-notation",
      prompt: "A second rule is g(n) = 2n − 3. What is g(6)?",
      answer: { kind: "numeric", value: 9, tolerance: 0 },
      solution:
        "Substitute 6: g(6) = 2(6) − 3 = 12 − 3 = 9. A named function can use any input variable; the input is the value inside the parentheses.",
      misconceptions: [
        {
          id: "subtracts-before-multiplying",
          triggerAnswers: ["6"],
          description: "The learner subtracted 3 from 6 before multiplying by 2.",
          remediationFocus: "Follow the operation order inside the rule after substitution.",
        },
        {
          id: "adds-instead-of-subtracts",
          triggerAnswers: ["15"],
          description: "The learner changed the minus sign into a plus sign.",
          remediationFocus: "Preserve the operation signs when copying the rule with the input substituted.",
        },
      ],
      hints: ["Write 2(6) − 3, then evaluate multiplication before subtraction."],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "function-notation",
      prompt: "If m(t) = 5t, what is m(3)?",
      answer: { kind: "numeric", value: 15, tolerance: 0 },
      solution:
        "Replace t with 3: m(3) = 5(3) = 15. The function rule maps the input 3 to one determined output, 15.",
      misconceptions: [
        {
          id: "adds-coefficient-and-input",
          triggerAnswers: ["8"],
          description: "The learner added 5 and 3 instead of following the multiplication rule.",
          remediationFocus: "Read adjacency in 5t as multiplication.",
        },
      ],
      hints: ["In 5t, the 5 multiplies the input."],
    },
    {
      id: "practice-2",
      concept: "input-output",
      prompt:
        "A relation pairs input 1 with output 4 and also pairs input 1 with output 5. Does this relation define a function?",
      answer: {
        kind: "multipleChoice",
        options: ["yes", "no"],
        correctIndex: 1,
      },
      solution:
        "No. The same input, 1, has two different outputs. That violates the one-output-per-input rule.",
      misconceptions: [
        {
          id: "checks-outputs-not-inputs",
          triggerAnswers: ["yes"],
          description: "The learner did not notice that one input was assigned two outcomes.",
          remediationFocus: "Inspect repeated inputs first; a repeated input with conflicting outputs breaks a function.",
        },
      ],
      hints: ["Follow the input 1. How many outputs has it been assigned?"],
    },
    {
      id: "practice-3",
      concept: "input-output",
      prompt:
        "Near transfer: A print shop charges C(h) = 12 + 3h dollars for h posters. What is C(4)?",
      answer: { kind: "numeric", value: 24, tolerance: 0 },
      solution:
        "The rule maps a number of posters to one charge. Substitute h = 4: C(4) = 12 + 3(4) = 24. The result applies to this stated model and input.",
      misconceptions: [
        {
          id: "omits-starting-charge",
          triggerAnswers: ["12"],
          description: "The learner calculated only the per-poster part and omitted the fixed charge.",
          remediationFocus: "A rule can include a starting amount as well as a change per input.",
        },
      ],
      hints: ["Substitute 4 for h, then include both the fixed 12 and the 3-per-poster term."],
    },
  ],
} satisfies Lesson;

export default lesson;
