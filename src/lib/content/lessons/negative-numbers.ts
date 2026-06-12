import type { Lesson } from "../types";

const lesson = {
  id: "negative-numbers",
  title: "Working with Negative Numbers",
  track: "Arithmetic",
  description:
    "Build a number-line intuition for adding, subtracting and multiplying below zero.",
  concepts: ["adding-negatives", "subtracting-negatives", "multiplying-negatives"],
  steps: [
    {
      id: "step-1",
      concept: "adding-negatives",
      prompt: "Compute 5 + (−8).",
      answer: { kind: "numeric", value: -3, tolerance: 0 },
      solution:
        "Adding a negative moves you left on the number line: start at 5 and move 8 to the left, landing at −3. Adding −8 is the same as subtracting 8.",
      misconceptions: [
        {
          id: "adds-magnitudes",
          triggerAnswers: ["13"],
          description:
            "The learner added the magnitudes (5 + 8), ignoring the sign of −8.",
          remediationFocus:
            "Adding a negative number moves you down/left, not up — it acts like a subtraction.",
        },
        {
          id: "drops-the-sign",
          triggerAnswers: ["3"],
          description:
            "The learner computed the right distance (3) but dropped the sign of the result.",
          remediationFocus:
            "When the negative number is larger in magnitude, the result lands below zero.",
        },
      ],
      hints: [
        "Picture a number line. Start at 5. Which direction does adding −8 move you?",
        "Adding −8 is the same as subtracting 8. Where do you land?",
      ],
    },
    {
      id: "step-2",
      concept: "subtracting-negatives",
      prompt: "Compute 4 − (−3).",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution:
        "Subtracting a negative is adding: 4 − (−3) = 4 + 3 = 7. Removing a debt makes you richer — taking away 'minus three' pushes you up the number line.",
      misconceptions: [
        {
          id: "ignores-double-negative",
          triggerAnswers: ["1"],
          description:
            "The learner computed 4 − 3, ignoring that the 3 being subtracted is itself negative.",
          remediationFocus:
            "Two negatives in a row — subtracting a negative — flip into a positive: − (−3) becomes + 3.",
        },
      ],
      hints: [
        "You're not subtracting 3 — you're subtracting NEGATIVE 3. Is that the same thing?",
        "Think of −3 as a debt. What happens to your balance when a debt is removed?",
      ],
    },
    {
      id: "step-3",
      concept: "multiplying-negatives",
      prompt: "Compute (−2) × (−6).",
      answer: { kind: "numeric", value: 12, tolerance: 0 },
      solution:
        "A negative times a negative is positive: (−2) × (−6) = 12. Multiplying by −1 means 'flip to the other side of zero'; flipping twice lands you back on the positive side.",
      misconceptions: [
        {
          id: "keeps-negative-sign",
          triggerAnswers: ["-12"],
          description:
            "The learner multiplied the magnitudes correctly but kept a negative sign.",
          remediationFocus:
            "Each negative factor flips the sign once. Two flips cancel: negative × negative = positive.",
        },
      ],
      hints: [
        "Multiplying by a negative flips you across zero. How many flips happen here?",
        "Two sign flips cancel each other out.",
      ],
    },
    {
      id: "step-4",
      concept: "adding-negatives",
      prompt:
        "The temperature is −5°C and rises by 9 degrees. What is the temperature now?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution:
        "Start at −5 on the number line and move 9 up: −5 + 9 = 4. Five of the nine degrees are spent reaching zero; the remaining four go above it.",
      misconceptions: [
        {
          id: "moves-the-wrong-way",
          triggerAnswers: ["-14"],
          description:
            "The learner moved 9 further DOWN from −5 instead of up.",
          remediationFocus:
            "A rise in temperature is an addition: movement toward (and past) zero, not away from it.",
        },
      ],
      hints: [
        "Start at −5 on a thermometer. Which direction is 'rises'?",
        "How many of the 9 degrees are used just to get back to zero?",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "adding-negatives",
      prompt: "Compute (−7) + 4.",
      answer: { kind: "numeric", value: -3, tolerance: 0 },
      solution:
        "Start at −7 and move 4 to the right: −7 + 4 = −3. Four of the steps move toward zero but don't reach it.",
      misconceptions: [
        {
          id: "adds-magnitudes",
          triggerAnswers: ["11", "-11"],
          description:
            "The learner combined the magnitudes (7 + 4) instead of moving along the number line.",
          remediationFocus:
            "Opposite signs work against each other: the result is the DIFFERENCE of magnitudes, with the sign of the larger.",
        },
      ],
      hints: ["Start at −7 on the number line. Move 4 which way?"],
    },
    {
      id: "practice-2",
      concept: "subtracting-negatives",
      prompt: "Compute 2 − (−5).",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution: "Subtracting a negative is adding: 2 − (−5) = 2 + 5 = 7.",
      misconceptions: [
        {
          id: "ignores-double-negative",
          triggerAnswers: ["-3"],
          description: "The learner computed 2 − 5, dropping the double negative.",
          remediationFocus:
            "The two minus signs flip into a plus: − (−5) becomes + 5.",
        },
      ],
      hints: ["Two minus signs in a row — what do they become?"],
    },
    {
      id: "practice-3",
      concept: "multiplying-negatives",
      prompt: "Compute (−3) × 4 × (−2).",
      answer: { kind: "numeric", value: 24, tolerance: 0 },
      solution:
        "Magnitudes: 3 × 4 × 2 = 24. Signs: two negative factors mean two flips, which cancel — the result is positive 24.",
      misconceptions: [
        {
          id: "keeps-negative-sign",
          triggerAnswers: ["-24"],
          description:
            "The learner computed the right magnitude but miscounted the sign flips.",
          remediationFocus:
            "Count the negative factors: an EVEN count of negatives makes the product positive.",
        },
      ],
      hints: ["How many negative factors are there? Even or odd?"],
    },
  ],
} satisfies Lesson;

export default lesson;
