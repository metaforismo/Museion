import type { Lesson } from "../types";

const lesson = {
  id: "proportional-reasoning-scaling",
  title: "Proportional Reasoning: Scaling Quantities",
  track: "Arithmetic",
  description:
    "Scale a recipe, mixture, or map up or down while keeping its ratio intact, and match the right quantities to each other when solving for a missing value.",
  concepts: ["recipe-scaling", "missing-value", "correspondence-check"],
  steps: [
    {
      id: "step-1",
      concept: "recipe-scaling",
      prompt:
        "A trail mix recipe uses 3 cups of nuts for every 5 cups of dried fruit — a proportional relationship. To make a bigger batch, a scout multiplies the nuts by 4, getting 12 cups of nuts. If the mixture keeps the same ratio, what should happen to the dried fruit?",
      answer: {
        kind: "multipleChoice",
        options: [
          "multiply the dried fruit by 4 as well, getting 20 cups",
          "keep the dried fruit at 5 cups, since only the nuts changed",
          "multiply the dried fruit by 3, getting 15 cups",
        ],
        correctIndex: 0,
      },
      solution:
        "Keeping the ratio means BOTH quantities are multiplied by the same factor. The nuts were multiplied by 4 (3 × 4 = 12), so the dried fruit must also be multiplied by 4: 5 × 4 = 20 cups. Check: 12/20 = 3/5, the same ratio as the original.",
      misconceptions: [
        {
          id: "scales-one-quantity-only",
          triggerAnswers: ["keep the dried fruit at 5 cups, since only the nuts changed"],
          description:
            "The learner scaled only the nuts and left the dried fruit unchanged, breaking the ratio between the two quantities.",
          remediationFocus: "Both quantities in a ratio must be scaled by the same factor to keep the mixture proportional.",
        },
        {
          id: "uses-wrong-multiplier",
          triggerAnswers: ["multiply the dried fruit by 3, getting 15 cups"],
          description:
            "The learner multiplied the dried fruit by the original number of cups of nuts (3) instead of by the actual scale factor (4) — confusing a quantity in the ratio with the factor that scales it.",
          remediationFocus:
            "Identify the single scale factor that turned 3 cups of nuts into 12 (×4), then apply that same factor — not one of the original amounts — to the dried fruit.",
        },
      ],
      hints: [
        "What single factor turns 3 cups of nuts into 12 cups?",
        "That factor — not one of the original amounts — is what you apply to the dried fruit.",
        "5 cups of dried fruit, multiplied by that same factor, gives what?",
      ],
    },
    {
      id: "step-2",
      concept: "missing-value",
      prompt:
        "A recipe uses 6 eggs for every 4 people it serves — a proportional relationship. How many eggs are needed to serve 10 people, keeping the same ratio?",
      answer: { kind: "numeric", value: 15, tolerance: 0 },
      solution:
        "Match eggs to eggs and people to people: 6 eggs/4 people = x eggs/10 people. The scale factor from 4 people to 10 people is 10 ÷ 4 = 2.5, so x = 6 × 2.5 = 15 eggs. (Equivalently, cross-multiplying: 4x = 6 × 10, so x = 60/4 = 15.)",
      misconceptions: [
        {
          id: "wrong-correspondence",
          triggerAnswers: ["2.4"],
          description:
            "The learner crossed the correspondence: they matched the original number of eggs with the NEW number of people, and solved against the ORIGINAL number of people (6/10 = x/4), instead of keeping 'original with original' and 'new with new'.",
          remediationFocus:
            "Match the original pair together and the new pair together: original eggs over original people equals new eggs over new people.",
        },
        {
          id: "leaves-value-unscaled",
          triggerAnswers: ["6"],
          description: "The learner treated the number of eggs as fixed and did not scale it when the number of people changed.",
          remediationFocus: "Find the factor connecting 4 people to 10 people, and apply that same factor to the eggs.",
        },
      ],
      hints: [
        "Write eggs over people for the known recipe, and eggs over people again for the new amount.",
        "What factor turns 4 people into 10 people?",
        "Apply that factor to the eggs: 6 × (10 ÷ 4).",
      ],
    },
    {
      id: "step-3",
      concept: "correspondence-check",
      prompt:
        "A concrete mix keeps a fixed ratio of 5 parts gravel to 2 parts cement — a proportional relationship. Using that same ratio, how many parts of cement are needed for exactly 1 part of gravel? Give your answer as a fraction in simplest form.",
      answer: { kind: "expression", acceptedForms: ["2/5", "0.4"] },
      solution:
        "The question asks for cement per ONE part of gravel, so cement goes in the numerator and gravel in the denominator: 2 parts cement ÷ 5 parts gravel = 2/5. This is the unit rate for cement, matched to the correct quantity.",
      misconceptions: [
        {
          id: "inverts-the-correspondence",
          triggerAnswers: ["5/2"],
          description:
            "The learner found gravel-per-cement (5/2) instead of cement-per-gravel (2/5), inverting which quantity belongs 'per one' of the other.",
          remediationFocus:
            "The question asks for cement per ONE part of gravel — cement belongs in the numerator, gravel in the denominator.",
        },
      ],
      hints: [
        "The question asks for cement per gravel, not gravel per cement — which quantity goes on top?",
        "Divide the cement parts by the gravel parts.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "recipe-scaling",
      prompt:
        "A lemonade recipe uses 2 cups of lemon juice for every 7 cups of water — a proportional relationship. Someone scales the lemon juice up to 8 cups. How many cups of water are needed to keep the same ratio?",
      answer: { kind: "numeric", value: 28, tolerance: 0 },
      solution: "The lemon juice was scaled by 8 ÷ 2 = 4, so the water must be scaled by the same factor: 7 × 4 = 28 cups.",
      misconceptions: [
        {
          id: "leaves-value-unscaled",
          triggerAnswers: ["7"],
          description: "The learner kept the water at its original amount instead of scaling it along with the lemon juice.",
          remediationFocus: "Find the factor connecting 2 cups of lemon juice to 8 cups, and apply that same factor to the water.",
        },
        {
          id: "adds-the-same-amount",
          triggerAnswers: ["13"],
          description:
            "The learner noticed the lemon juice increased by 6 cups (2 to 8) and added that same 6 cups to the water (7 + 6 = 13) instead of multiplying by the scale factor.",
          remediationFocus: "Scaling a ratio means multiplying both quantities by the same factor, not adding the same amount to both.",
        },
      ],
      hints: ["What factor turns 2 cups of lemon juice into 8 cups? Apply that same factor to the water."],
    },
    {
      id: "practice-2",
      concept: "missing-value",
      prompt:
        "A paint mixture uses 3 parts blue for every 8 parts white — a proportional relationship. For 24 parts white, how many parts blue are needed?",
      answer: { kind: "numeric", value: 9, tolerance: 0 },
      solution: "The scale factor from 8 parts white to 24 parts white is 24 ÷ 8 = 3, so blue scales the same way: 3 × 3 = 9 parts.",
      misconceptions: [
        {
          id: "wrong-correspondence",
          triggerAnswers: ["1"],
          description:
            "The learner matched the original blue amount with the NEW white amount and solved against the ORIGINAL white amount (3/24 = x/8), crossing the correspondence.",
          remediationFocus: "Match original with original and new with new before dividing.",
        },
        {
          id: "leaves-value-unscaled",
          triggerAnswers: ["3"],
          description: "The learner kept the blue amount fixed instead of scaling it with the white.",
          remediationFocus: "Find the factor connecting 8 parts white to 24, and apply it to the blue as well.",
        },
      ],
      hints: ["What factor turns 8 parts white into 24 parts? Apply that same factor to the blue."],
    },
    {
      id: "practice-3",
      concept: "correspondence-check",
      prompt:
        "A scale drawing uses 3 cm to represent 4 real meters. A different drawing uses 5 cm to represent 4 real meters. To find how many meters 9 cm represents on the FIRST drawing, which proportion correctly matches the correspondence?",
      answer: {
        kind: "multipleChoice",
        options: ["3 cm/4 m = 9 cm/x m", "5 cm/4 m = 9 cm/x m", "4 m/3 cm = 9 cm/x m"],
        correctIndex: 0,
      },
      solution:
        "The 9 cm belongs to the first drawing, so it must be matched with the first drawing's own scale, 3 cm to 4 m, with centimeters over meters on both sides: 3 cm/4 m = 9 cm/x m.",
      misconceptions: [
        {
          id: "uses-wrong-drawings-scale",
          triggerAnswers: ["5 cm/4 m = 9 cm/x m"],
          description:
            "The learner used the second drawing's scale (5 cm to 4 m) instead of the first drawing's own scale (3 cm to 4 m) — mismatching which numbers belong to which drawing.",
          remediationFocus: "Identify which two numbers describe the SAME drawing before setting up the ratio.",
        },
        {
          id: "mismatches-units-within-ratio",
          triggerAnswers: ["4 m/3 cm = 9 cm/x m"],
          description:
            "The learner put meters over centimeters on the left side but centimeters over meters on the right side — an inconsistent correspondence even though the numbers came from the same drawing.",
          remediationFocus: "Keep the same quantity (centimeters or meters) in the same position — numerator or denominator — on both sides.",
        },
      ],
      hints: ["Which two numbers describe the SAME drawing as the 9 cm?", "Keep centimeters in the same position on both sides of the equation."],
    },
  ],
} satisfies Lesson;

export default lesson;
