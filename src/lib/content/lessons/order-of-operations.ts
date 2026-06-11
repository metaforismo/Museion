import type { Lesson } from "../types";

const lesson = {
  id: "order-of-operations",
  title: "Order of Operations",
  track: "Arithmetic",
  description:
    "Why 3 + 4 × 2 is not 14 — learn the precedence rules that make every calculator agree.",
  concepts: ["operation-precedence", "parentheses-first", "exponent-precedence"],
  steps: [
    {
      id: "step-1",
      concept: "operation-precedence",
      prompt: "Compute 3 + 4 × 2.",
      answer: { kind: "numeric", value: 11, tolerance: 0 },
      solution:
        "Multiplication binds tighter than addition, so 4 × 2 happens first: 4 × 2 = 8, then 3 + 8 = 11. Reading left to right (3 + 4 first) is the classic trap.",
      misconceptions: [
        {
          id: "left-to-right",
          triggerAnswers: ["14"],
          description:
            "The learner evaluated strictly left to right: (3 + 4) × 2 = 14.",
          remediationFocus:
            "Operations have precedence: multiplication and division happen before addition and subtraction, regardless of reading order.",
        },
      ],
      hints: [
        "Would a calculator do the + or the × first? There's a rule about that.",
        "Multiplication comes before addition. Which two numbers get multiplied?",
        "Compute 4 × 2 first, then add it to 3.",
      ],
    },
    {
      id: "step-2",
      concept: "parentheses-first",
      prompt: "Now compute (3 + 4) × 2.",
      answer: { kind: "numeric", value: 14, tolerance: 0 },
      solution:
        "Parentheses override every other rule: 3 + 4 = 7 first, then 7 × 2 = 14. The same numbers as the last step, but the parentheses change the meaning.",
      misconceptions: [
        {
          id: "ignored-parentheses",
          triggerAnswers: ["11"],
          description:
            "The learner ignored the parentheses and applied plain precedence as in the previous step.",
          remediationFocus:
            "Parentheses are the strongest grouping: whatever is inside them is computed first, before any other rule applies.",
        },
      ],
      hints: [
        "What changed compared to the previous step?",
        "Parentheses beat every other rule. What's inside them?",
      ],
    },
    {
      id: "step-3",
      concept: "operation-precedence",
      prompt: "Compute 20 − 6 ÷ 2.",
      answer: { kind: "numeric", value: 17, tolerance: 0 },
      solution:
        "Division happens before subtraction: 6 ÷ 2 = 3, then 20 − 3 = 17. Division and multiplication share the same (high) precedence; addition and subtraction share the same (low) precedence.",
      misconceptions: [
        {
          id: "subtracts-first",
          triggerAnswers: ["7"],
          description:
            "The learner subtracted first: (20 − 6) ÷ 2 = 7, treating the expression left to right.",
          remediationFocus:
            "Division belongs to the same high-precedence family as multiplication: it happens before subtraction.",
        },
      ],
      hints: [
        "Division and multiplication are in the same precedence family. Which family goes first?",
        "Compute 6 ÷ 2 before touching the 20.",
      ],
    },
    {
      id: "step-4",
      concept: "exponent-precedence",
      prompt: "Compute 2 × 3².",
      answer: { kind: "numeric", value: 18, tolerance: 0 },
      solution:
        "Exponents bind tighter than multiplication: 3² = 9 first, then 2 × 9 = 18. The exponent applies only to the 3, not to the whole product.",
      misconceptions: [
        {
          id: "squares-the-product",
          triggerAnswers: ["36"],
          description:
            "The learner multiplied first and squared the result: (2 × 3)² = 36.",
          remediationFocus:
            "An exponent applies only to the number (or parenthesized group) directly beneath it — here just the 3.",
        },
      ],
      hints: [
        "Which number is the ² actually attached to?",
        "Evaluate 3² on its own first, then multiply.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
