import type { Lesson } from "../types";

const lesson = {
  id: "proportional-reasoning-unit-rate",
  title: "Proportional Reasoning: Unit Rate as the Invariant",
  track: "Arithmetic",
  description:
    "Find the unit rate that stays fixed inside a relationship, and use it to tell a proportional relationship from one that only looks like it.",
  concepts: ["recognizing-proportionality", "unit-rate", "additive-vs-multiplicative"],
  steps: [
    {
      id: "step-1",
      concept: "recognizing-proportionality",
      prompt:
        "Two tables are shown.\n\nTable A — miles driven and gallons used: 3 miles/1 gallon, 6 miles/2 gallons, 9 miles/3 gallons.\nTable B — a tree's age and height: 1 year/4 ft, 2 years/7 ft, 3 years/10 ft.\n\nWhich table shows a proportional relationship between the two quantities?",
      answer: {
        kind: "multipleChoice",
        options: ["table a", "table b", "both tables"],
        correctIndex: 0,
      },
      solution:
        "In Table A, miles ÷ gallons is 3 every time (3/1 = 6/2 = 9/3 = 3): a constant ratio, and 0 gallons would give 0 miles — the relationship passes through (0, 0). In Table B, height grows by a constant 3 ft each year, but height ÷ age is NOT constant (4/1 = 4, 7/2 = 3.5, 10/3 ≈ 3.33), and at age 0 the tree would already be 4 ft tall. Table B is linear, but the fixed starting height means it is not proportional.",
      misconceptions: [
        {
          id: "additive-pattern-as-proportional",
          triggerAnswers: ["table b"],
          description:
            "The learner noticed the height in Table B always goes up by the same amount (3 ft added each year) and concluded that steady growth must mean proportional — additive thinking standing in for multiplicative reasoning.",
          remediationFocus:
            "A constant AMOUNT added each step is additive growth. A proportional relationship needs a constant RATIO (multiplication), and it must start at (0, 0).",
        },
        {
          id: "both-look-steady",
          triggerAnswers: ["both tables"],
          description:
            "The learner treated any table with a regular, predictable pattern as proportional, without actually dividing each pair of values.",
          remediationFocus:
            "Check each row: does the quotient (bigger quantity ÷ smaller quantity) stay exactly the same? Only then is the relationship proportional.",
        },
      ],
      hints: [
        "For each table, divide the second quantity by the first quantity in every row.",
        "Does that quotient stay exactly the same across every row in Table B?",
        "A proportional relationship must also work at zero: what would Table B predict for a tree at age 0?",
      ],
    },
    {
      id: "step-2",
      concept: "unit-rate",
      prompt:
        "Back to Table A: a car travels 3 miles on 1 gallon, 6 miles on 2 gallons, and 9 miles on 3 gallons. What is the unit rate, in miles per ONE gallon?",
      answer: { kind: "numeric", value: 3, tolerance: 0 },
      solution:
        "A unit rate compares the quantity to exactly one unit of the other. Dividing any row's miles by its gallons gives the same value: 3 ÷ 1 = 6 ÷ 2 = 9 ÷ 3 = 3 miles per gallon. That invariant number is what makes the relationship proportional.",
      misconceptions: [
        {
          id: "inverts-the-rate",
          triggerAnswers: ["1/3"],
          description:
            "The learner divided gallons by miles instead of miles by gallons, computing gallons per mile rather than miles per gallon.",
          remediationFocus:
            "Check which quantity the question puts 'per one' of. Here it's miles per ONE gallon, so gallons belongs in the denominator, not the numerator.",
        },
        {
          id: "reports-a-total-not-a-rate",
          triggerAnswers: ["9"],
          description:
            "The learner reported a total distance for multiple gallons instead of dividing down to the amount for a single gallon.",
          remediationFocus:
            "A unit rate is a division: total of one quantity divided by total of the other, reduced to 'for one unit'.",
        },
      ],
      hints: [
        "Which quantity is 'per one' here — miles per gallon, or gallons per mile?",
        "Pick any row and divide the miles by the gallons.",
        "3 ÷ 1, or 9 ÷ 3 — both should give the same unit rate.",
      ],
    },
    {
      id: "step-3",
      concept: "additive-vs-multiplicative",
      prompt:
        "A fruit punch recipe uses 2 cups of water for every 3 cups of juice concentrate — a proportional relationship. A cook scales the water up to 6 cups (multiplying it by 3) to keep the same taste. How many cups of concentrate are needed in total?",
      answer: { kind: "numeric", value: 9, tolerance: 0 },
      solution:
        "The water was scaled by a factor of 3 (2 × 3 = 6), so to preserve the same ratio, the concentrate must be scaled by that SAME factor: 3 × 3 = 9 cups. Checking: 6 cups water ÷ 9 cups concentrate = 2/3, the same ratio as 2/3.",
      misconceptions: [
        {
          id: "adds-the-same-amount",
          triggerAnswers: ["7"],
          description:
            "The learner noticed the water increased by 4 cups (2 to 6) and added that same 4 cups to the concentrate (3 + 4 = 7) — additive thinking: 'added 4 to both, so it scales'.",
          remediationFocus:
            "Proportional scaling multiplies both quantities by the same factor. It does not add the same fixed amount to both — adding breaks the ratio.",
        },
        {
          id: "flips-the-ratio-multiplier",
          triggerAnswers: ["4"],
          description:
            "The learner multiplied the new water amount by the water-to-concentrate ratio (6 × 2/3 = 4) instead of by the scale factor, applying the ratio in the wrong direction.",
          remediationFocus:
            "Find the single factor that turned 2 cups of water into 6 (×3), then apply that exact factor — not a piece of the original ratio — to the concentrate.",
        },
      ],
      hints: [
        "What factor turned 2 cups of water into 6 cups?",
        "Apply that same factor to the concentrate.",
        "Check your answer: does 6 cups water to your answer in concentrate simplify back to 2 : 3?",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "recognizing-proportionality",
      prompt:
        "A vending machine sells bags of chips: 2 bags cost $3, 4 bags cost $6, 6 bags cost $9. Is the cost proportional to the number of bags?",
      answer: {
        kind: "multipleChoice",
        options: [
          "yes, cost is always 1.5 times the number of bags",
          "yes, but only for even numbers of bags",
          "no, the ratio changes from row to row",
        ],
        correctIndex: 0,
      },
      solution:
        "Cost ÷ bags is 1.5 every time (3/2 = 6/4 = 9/6 = 1.5), and 0 bags would cost $0. The relationship is proportional for any number of bags, not just the three shown.",
      misconceptions: [
        {
          id: "doubts-general-validity",
          triggerAnswers: ["yes, but only for even numbers of bags"],
          description:
            "The learner treated the proportional relationship as tied to the specific rows shown (all even counts) rather than as a general rule that holds for any number of bags.",
          remediationFocus:
            "The constant ratio (the unit price) applies to any number of bags, not only the ones listed in the table.",
        },
        {
          id: "misjudges-constant-ratio",
          triggerAnswers: ["no, the ratio changes from row to row"],
          description: "The learner assumed variability without actually dividing cost by bags in each row.",
          remediationFocus: "Divide cost by number of bags for every row before deciding whether the ratio is constant.",
        },
      ],
      hints: ["Divide cost by number of bags in each row, and compare the results."],
    },
    {
      id: "practice-2",
      concept: "unit-rate",
      prompt: "A hose fills a 40-liter tub in 5 minutes at a constant flow rate. What is the flow rate in liters per minute?",
      answer: { kind: "numeric", value: 8, tolerance: 0 },
      solution: "Liters per minute is the total liters divided by the total minutes: 40 ÷ 5 = 8 liters per minute.",
      misconceptions: [
        {
          id: "inverts-the-rate",
          triggerAnswers: ["5/40"],
          description: "The learner computed minutes per liter instead of liters per minute.",
          remediationFocus: "Liters is the quantity 'per one minute' here, so minutes belongs in the denominator.",
        },
      ],
      hints: ["Divide the total liters by the total minutes."],
    },
    {
      id: "practice-3",
      concept: "additive-vs-multiplicative",
      prompt:
        "Near transfer: a print shop charges in proportion to the number of copies — 5 copies cost $2. A customer scales the order up by a factor of 6, to 30 copies. How much will 30 copies cost?",
      answer: { kind: "numeric", value: 12, tolerance: 0 },
      solution: "Both quantities scale by the same factor: 5 × 6 = 30 copies, so cost scales the same way: $2 × 6 = $12.",
      misconceptions: [
        {
          id: "adds-the-scale-factor",
          triggerAnswers: ["8"],
          description:
            "The learner added the scale factor to the original cost instead of multiplying by it (2 + 6 = 8 rather than 2 × 6).",
          remediationFocus: "A scale factor multiplies both quantities in the ratio; it is never added to one of the original values.",
        },
      ],
      hints: ["What factor turns 5 copies into 30 copies? Apply that same factor to the cost."],
    },
  ],
} satisfies Lesson;

export default lesson;
