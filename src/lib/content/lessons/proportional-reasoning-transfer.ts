import type { Lesson } from "../types";

const lesson = {
  id: "proportional-reasoning-transfer",
  title: "Proportional Reasoning: Proportional or Not?",
  track: "Arithmetic",
  description:
    "Decide whether a fresh real-world relationship — currency, speed, or density — is actually proportional before computing with it, and watch for a hidden fixed fee.",
  concepts: ["decide-proportional", "unit-rate-transfer", "scale-and-verify"],
  steps: [
    {
      id: "step-1",
      concept: "decide-proportional",
      prompt:
        "Context A: a taxi ride costs a flat $4 pickup fee, plus $2.50 per mile. Context B: buying gasoline costs $3.20 per gallon, with no other fees. Which context shows a proportional relationship between the amount (miles or gallons) and the total cost?",
      answer: {
        kind: "multipleChoice",
        options: ["context a", "context b", "both contexts"],
        correctIndex: 1,
      },
      solution:
        "In Context B, cost = 3.20 × gallons: doubling the gallons doubles the cost, and 0 gallons costs $0 — a constant ratio that passes through the origin. In Context A, cost = 4 + 2.50 × miles: even 0 miles costs $4 because of the flat fee, so cost ÷ miles is never constant. Context A is linear, but the fixed fee means it is not proportional.",
      misconceptions: [
        {
          id: "fixed-fee-still-looks-proportional",
          triggerAnswers: ["context a", "both contexts"],
          description:
            "The learner noticed the steady per-mile rate ($2.50 added for each mile) in Context A and concluded it must be proportional, missing that the flat $4 fee breaks the constant-ratio and through-the-origin requirement.",
          remediationFocus:
            "Check what each context would cost at zero (0 miles, 0 gallons). A proportional relationship must cost $0 at 0 units; a flat fee means it cannot.",
        },
      ],
      hints: [
        "What would each context cost for zero miles or zero gallons?",
        "A proportional relationship must pass through (0, 0). Which context fails that check?",
      ],
    },
    {
      id: "step-2",
      concept: "unit-rate-transfer",
      prompt:
        "A currency exchange converts at a constant rate, with no fees: 5 US dollars converts to 4 euros. How many euros do 35 US dollars convert to, at the same rate?",
      answer: { kind: "numeric", value: 28, tolerance: 0 },
      solution:
        "The dollar amount was scaled by 35 ÷ 5 = 7, so the euro amount scales by the same factor: 4 × 7 = 28 euros. This works because the exchange is fee-free and constant — a proportional relationship.",
      misconceptions: [
        {
          id: "adds-instead-of-scales",
          triggerAnswers: ["39"],
          description: "The learner added the two given numbers (35 + 4 = 39) instead of finding and applying a scale factor.",
          remediationFocus: "Find the factor that connects 5 dollars to 35 dollars, and apply that same factor to 4 euros.",
        },
        {
          id: "inverts-the-rate",
          triggerAnswers: ["43.75"],
          description:
            "The learner computed dollars-per-euro (5/4) instead of euros-per-dollar, and multiplied 35 by that inverted rate.",
          remediationFocus: "Confirm the rate answers 'how many euros for ONE dollar,' not the reverse.",
        },
      ],
      hints: [
        "Find the euro-per-dollar unit rate first: 4 euros for how many dollars?",
        "What factor turns 5 dollars into 35 dollars? Apply that same factor to the euros.",
      ],
    },
    {
      id: "step-3",
      concept: "scale-and-verify",
      prompt:
        "A metal sample has constant density: 15 grams for every 2 cubic centimeters. What is the mass, in grams, of 10 cubic centimeters of the same metal?",
      answer: { kind: "numeric", value: 75, tolerance: 0 },
      solution:
        "Density is a proportional relationship between mass and volume for a fixed substance. The volume was scaled by 10 ÷ 2 = 5, so the mass scales the same way: 15 × 5 = 75 grams.",
      misconceptions: [
        {
          id: "inverts-the-rate",
          triggerAnswers: ["4/3"],
          description:
            "The learner computed cubic-centimeters-per-gram (2/15) instead of grams-per-cubic-centimeter, then multiplied by 10, producing a value less than 2.",
          remediationFocus: "Confirm which quantity the density is measuring 'per one' of — grams per ONE cubic centimeter.",
        },
        {
          id: "leaves-value-unscaled",
          triggerAnswers: ["15"],
          description:
            "The learner treated the mass as a fixed property of 'the metal' and reported the original 15 grams instead of scaling it with the volume.",
          remediationFocus: "For a fixed density, mass and volume scale together — multiply both by the same factor.",
        },
      ],
      hints: [
        "What factor turns 2 cubic centimeters into 10 cubic centimeters?",
        "Apply that same factor to the mass (15 grams).",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "decide-proportional",
      prompt:
        "Plan A: a phone plan costs a flat $15 per month plus $2 per gigabyte of extra data. Plan B: a prepaid data card costs $2 per gigabyte, with no monthly fee. Which plan shows a proportional relationship between gigabytes used and total cost?",
      answer: {
        kind: "multipleChoice",
        options: ["plan a", "plan b", "both plans"],
        correctIndex: 1,
      },
      solution:
        "Plan B costs $0 at 0 gigabytes and cost ÷ gigabytes is always $2 — proportional. Plan A costs $15 even at 0 gigabytes because of the flat monthly fee, so it is not proportional, even though it also has a steady per-gigabyte rate.",
      misconceptions: [
        {
          id: "fixed-fee-still-looks-proportional",
          triggerAnswers: ["plan a", "both plans"],
          description:
            "The learner focused on the steady $2-per-gigabyte rate in Plan A and concluded it must be proportional, missing the flat $15 fee that breaks the through-the-origin requirement.",
          remediationFocus: "Check the cost at 0 gigabytes for each plan. A proportional relationship must cost $0 there.",
        },
      ],
      hints: ["What does each plan cost for 0 gigabytes of extra data?"],
    },
    {
      id: "practice-2",
      concept: "unit-rate-transfer",
      prompt: "A train travels at a constant speed, covering 90 miles in 3 hours. At that same speed, how many miles does it cover in 5 hours?",
      answer: { kind: "numeric", value: 150, tolerance: 0 },
      solution: "The speed is 90 ÷ 3 = 30 miles per hour. At that constant rate, 5 hours covers 30 × 5 = 150 miles.",
      misconceptions: [
        {
          id: "adds-instead-of-scales",
          triggerAnswers: ["92"],
          description:
            "The learner added the same amount that the hours increased by (2) directly onto the distance (90 + 2 = 92) instead of applying a constant rate.",
          remediationFocus: "Find the speed in miles per hour first, then multiply that rate by the total number of hours.",
        },
        {
          id: "inverts-the-rate",
          triggerAnswers: ["1/6"],
          description:
            "The learner computed hours-per-mile (3/90) instead of miles-per-hour, then multiplied by 5, producing a value smaller than 1.",
          remediationFocus: "Confirm which quantity is 'per one hour' before multiplying by the number of hours.",
        },
      ],
      hints: ["Find the speed in miles per hour first (90 ÷ 3).", "Multiply that speed by 5 hours."],
    },
    {
      id: "practice-3",
      concept: "scale-and-verify",
      prompt:
        "Near transfer: a cleaning solution keeps a constant, proportional ratio of 3 parts water for every 1 part concentrate. For 21 parts water, how many parts concentrate are needed to keep the same ratio?",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution: "Water is always 3 times the concentrate, so concentrate = water ÷ 3 = 21 ÷ 3 = 7 parts.",
      misconceptions: [
        {
          id: "leaves-value-unscaled",
          triggerAnswers: ["1"],
          description: "The learner kept the concentrate at its original value (1 part) instead of scaling it with the water.",
          remediationFocus: "Find the factor connecting the original water amount to 21, and apply the same reasoning to the concentrate.",
        },
        {
          id: "inverts-the-ratio-direction",
          triggerAnswers: ["63"],
          description:
            "The learner multiplied 21 by 3 instead of dividing, applying the water-to-concentrate ratio in the wrong direction.",
          remediationFocus: "Since water is 3 times the concentrate, divide the water amount by 3 to get the concentrate amount.",
        },
      ],
      hints: ["The ratio is 3 parts water to 1 part concentrate — which quantity is larger?", "Divide the water amount by 3."],
    },
  ],
} satisfies Lesson;

export default lesson;
