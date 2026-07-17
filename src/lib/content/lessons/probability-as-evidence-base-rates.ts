import type { Lesson } from "../types";

const lesson = {
  id: "probability-as-evidence-base-rates",
  title: "Probability as Evidence: Keep the Base Rate Visible",
  track: "Arithmetic",
  description:
    "Use a full count table to distinguish a starting rate, a test result, and the evidence-conditioned conclusion.",
  concepts: ["base-rate", "evidence-update", "true-and-false-flags"],
  steps: [
    {
      id: "step-1",
      concept: "base-rate",
      prompt:
        "A workshop checks 100 devices. Twenty are faulty before any screen is run. What is the base-rate probability that a randomly selected device is faulty?",
      answer: {
        kind: "multipleChoice",
        options: ["1/5", "4/5", "2/3"],
        correctIndex: 0,
      },
      solution:
        "Before looking at a screen result, 20 of 100 devices are faulty. The starting or base-rate probability is 20/100 = 1/5. It is a starting comparison, not a conclusion about a flagged device.",
      misconceptions: [
        {
          id: "uses-working-rate",
          triggerAnswers: ["1"],
          description: "The learner selected the rate for working devices rather than faulty devices.",
          remediationFocus: "Name the event precisely, then count its cases over the full starting group.",
        },
        {
          id: "jumps-to-screen-result",
          triggerAnswers: ["2"],
          description: "The learner used a later evidence-conditioned value before considering the base rate.",
          remediationFocus: "Keep the starting rate separate from what becomes true after a screen result is known.",
        },
      ],
      hints: [
        "This question is before any test result. Use the full group of 100 devices.",
        "Put the number faulty over the total number checked, then simplify.",
      ],
    },
    {
      id: "step-2",
      concept: "true-and-false-flags",
      prompt:
        "The screen flags 16 of the faulty devices and also flags 8 working devices. How many devices are flagged in total?",
      answer: { kind: "numeric", value: 24, tolerance: 0 },
      solution:
        "A flag can occur for a faulty or a working device in this record. Add both flagged groups: 16 + 8 = 24. The total flagged group is the evidence group for the next question.",
      misconceptions: [
        {
          id: "counts-only-confirmed-faults",
          triggerAnswers: ["16"],
          description: "The learner treated every flag as a confirmed fault.",
          remediationFocus: "Include every device with the observed evidence, including false flags.",
        },
        {
          id: "uses-unflagged-working-devices",
          triggerAnswers: ["80"],
          description: "The learner used the whole working group rather than the eight working devices that were flagged.",
          remediationFocus: "Track the intersection: working AND flagged, not every working device.",
        },
      ],
      hints: ["Make two flagged piles: faulty-and-flagged, and working-and-flagged."],
    },
    {
      id: "step-3",
      concept: "evidence-update",
      prompt:
        "Given that a device is flagged, what is the probability it is faulty in this workshop record?",
      answer: {
        kind: "multipleChoice",
        options: ["1/5", "4/5", "2/3"],
        correctIndex: 2,
      },
      solution:
        "Among the 24 flagged devices, 16 are faulty. So P(faulty | flagged) = 16/24 = 2/3. The flag changes the reference group from all devices to flagged devices; it does not make a fault certain.",
      misconceptions: [
        {
          id: "keeps-base-rate",
          triggerAnswers: ["0"],
          description: "The learner repeated the starting fault rate after being told the device is flagged.",
          remediationFocus: "Evidence changes the comparison group; use the flagged total as the denominator.",
        },
        {
          id: "uses-screen-sensitivity",
          triggerAnswers: ["1"],
          description: "The learner used the fraction of faulty devices that were flagged rather than faults among flagged devices.",
          remediationFocus: "Ask which group is given. ‘Given flagged’ means start with all flagged devices.",
        },
      ],
      hints: [
        "The condition is flagged. How many devices are in that group?",
        "Of those flagged devices, how many are faulty? Form and simplify that fraction.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "true-and-false-flags",
      prompt:
        "A batch has 50 products: 10 are flawed. A check flags 8 flawed products and 4 working products. How many products are flagged?",
      answer: { kind: "numeric", value: 12, tolerance: 0 },
      solution: "The flagged group includes both 8 flagged flawed products and 4 flagged working products: 12 total.",
      misconceptions: [
        {
          id: "counts-only-flawed-flags",
          triggerAnswers: ["8"],
          description: "The learner left out working products that were also flagged.",
          remediationFocus: "A flag is the evidence group, so count every flagged item first.",
        },
      ],
      hints: ["Add every category that has the word flagged in it."],
    },
    {
      id: "practice-2",
      concept: "evidence-update",
      prompt: "For that batch, what is P(flawed | flagged)? Write a fraction.",
      answer: { kind: "expression", acceptedForms: ["2/3", "8/12"] },
      solution:
        "Eight of the 12 flagged products are flawed, so P(flawed | flagged) = 8/12 = 2/3.",
      misconceptions: [
        {
          id: "uses-whole-batch",
          triggerAnswers: ["4/25"],
          description: "The learner divided eight flawed-and-flagged products by all 50 products.",
          remediationFocus: "Once the condition says flagged, only flagged products belong in the denominator.",
        },
      ],
      hints: ["Use the flagged total from the previous step as the denominator."],
    },
    {
      id: "practice-3",
      concept: "base-rate",
      prompt:
        "Near transfer: Which claim is justified by the 50-product record after a product is flagged?",
      answer: {
        kind: "multipleChoice",
        options: [
          "About 2 out of 3 flagged products were flawed in this record.",
          "Every flagged product is flawed.",
          "About 2 out of 3 products in the whole batch were flawed.",
        ],
        correctIndex: 0,
      },
      solution:
        "The record supports a conditional statement about flagged products: 8 of 12 were flawed. It does not make flags certain, and it does not replace the whole-batch base rate of 10 out of 50.",
      misconceptions: [
        {
          id: "turns-probability-into-certainty",
          triggerAnswers: ["1"],
          description: "The learner treated a high conditional probability as a guarantee.",
          remediationFocus: "A probability describes a proportion in the stated record; it does not erase the remaining cases.",
        },
        {
          id: "confuses-conditional-with-base-rate",
          triggerAnswers: ["2"],
          description: "The learner applied the flagged-group proportion to the whole batch.",
          remediationFocus: "Always state the group named by the condition when interpreting a probability.",
        },
      ],
      hints: ["Check the denominator behind each claim: flagged products or all products?"],
    },
  ],
} satisfies Lesson;

export default lesson;
