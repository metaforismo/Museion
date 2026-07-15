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
  practice: [
    {
      id: "practice-1",
      concept: "operation-precedence",
      prompt: "Compute 10 − 2 × 3.",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution: "Multiplication first: 2 × 3 = 6, then 10 − 6 = 4.",
      misconceptions: [
        {
          id: "left-to-right",
          triggerAnswers: ["24"],
          description: "The learner computed (10 − 2) × 3 left to right.",
          remediationFocus:
            "Multiplication happens before subtraction regardless of position.",
        },
      ],
      hints: ["Which operation has higher precedence?"],
    },
    {
      id: "practice-2",
      concept: "parentheses-first",
      prompt: "Compute 5 × (8 − 6)².",
      answer: { kind: "numeric", value: 20, tolerance: 0 },
      solution:
        "Parentheses first: 8 − 6 = 2. Then the exponent: 2² = 4. Then multiply: 5 × 4 = 20.",
      misconceptions: [
        {
          id: "squares-the-product",
          triggerAnswers: ["100"],
          description:
            "The learner multiplied 5 × 2 first and squared the result: (5 × 2)² = 100.",
          remediationFocus:
            "The exponent applies only to the parenthesized group, not to the whole product.",
        },
      ],
      hints: ["Parentheses, then exponents, then multiplication."],
    },
    {
      id: "practice-3",
      concept: "exponent-precedence",
      prompt: "Compute 100 ÷ 5².",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution: "Exponent first: 5² = 25, then 100 ÷ 25 = 4.",
      misconceptions: [
        {
          id: "divides-first",
          triggerAnswers: ["400"],
          description:
            "The learner divided first and squared the result: (100 ÷ 5)² = 400.",
          remediationFocus:
            "Exponents bind tighter than division: evaluate 5² before dividing.",
        },
      ],
      hints: ["Does the ÷ or the ² happen first?"],
    },
  ],
} satisfies Lesson;

export default lesson;
