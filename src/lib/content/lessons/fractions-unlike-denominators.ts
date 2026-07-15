import type { Lesson } from "../types";

const lesson = {
  id: "fractions-unlike-denominators",
  title: "Adding Fractions with Unlike Denominators",
  track: "Arithmetic",
  description:
    "Discover why fractions need a common denominator before they can be added, and how to find one.",
  concepts: ["common-denominator", "equivalent-fractions"],
  steps: [
    {
      id: "step-1",
      concept: "common-denominator",
      prompt:
        "We want to compute 1/2 + 1/3. Can we add the numerators directly (1 + 1) while the denominators are different?",
      answer: { kind: "multipleChoice", options: ["yes", "no"], correctIndex: 1 },
      solution:
        "No. 1/2 and 1/3 are measured in different units — halves and thirds. Adding numerators only makes sense when both fractions count pieces of the same size, i.e. share a denominator.",
      misconceptions: [
        {
          id: "adds-across",
          triggerAnswers: ["yes"],
          description:
            "The learner believes numerators and denominators can be added independently (1/2 + 1/3 = 2/5).",
          remediationFocus:
            "Fractions are counts of equally-sized pieces; pieces of different sizes can't be counted together until they are re-cut to the same size.",
        },
      ],
      hints: [
        "Imagine half a pizza and a third of a pizza. Are the slices the same size?",
        "What would 1/2 + 1/2 be? Why does that addition feel safe while 1/2 + 1/3 doesn't?",
      ],
    },
    {
      id: "step-2",
      concept: "common-denominator",
      prompt: "What is the smallest common denominator for 1/2 and 1/3?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution:
        "The least common multiple of 2 and 3 is 6. Both halves and thirds can be re-cut into sixths: 1/2 = 3/6 and 1/3 = 2/6.",
      misconceptions: [
        {
          id: "adds-denominators",
          triggerAnswers: ["5"],
          description:
            "The learner added the denominators (2 + 3) instead of finding a common multiple.",
          remediationFocus:
            "A common denominator must be a number both denominators divide into evenly — a common multiple, not a sum.",
        },
      ],
      hints: [
        "List the multiples of 2, then the multiples of 3. Where do the lists first meet?",
        "You need a number that both 2 and 3 divide into with no remainder.",
      ],
    },
    {
      id: "step-3",
      concept: "equivalent-fractions",
      prompt:
        "Rewrite both fractions in sixths and add them. Give the result as a fraction in the form a/b.",
      answer: { kind: "expression", acceptedForms: ["5/6"] },
      solution:
        "1/2 = 3/6 (multiply top and bottom by 3) and 1/3 = 2/6 (multiply top and bottom by 2). Now the pieces match: 3/6 + 2/6 = 5/6.",
      misconceptions: [
        {
          id: "adds-across",
          triggerAnswers: ["2/5"],
          description:
            "The learner fell back to adding numerators and denominators separately.",
          remediationFocus:
            "Once both fractions are in sixths, only the counts (numerators) are added; the piece size (denominator) stays the same.",
        },
      ],
      hints: [
        "How many sixths make a half? How many make a third?",
        "After converting, both fractions count pieces of the same size. Add the counts.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "common-denominator",
      prompt: "What is the smallest common denominator for 1/6 and 1/4?",
      answer: { kind: "numeric", value: 12, tolerance: 0 },
      solution:
        "Multiples of 6: 6, 12, 18… Multiples of 4: 4, 8, 12… The lists first meet at 12, the least common multiple.",
      misconceptions: [
        {
          id: "adds-denominators",
          triggerAnswers: ["10"],
          description:
            "The learner added the denominators (6 + 4) instead of finding a common multiple.",
          remediationFocus:
            "A common denominator must be divisible by BOTH denominators — a common multiple, not a sum.",
        },
        {
          id: "multiplies-denominators",
          triggerAnswers: ["24"],
          description:
            "The learner multiplied the denominators. 24 works, but it is not the smallest.",
          remediationFocus:
            "The product is always a common multiple, but the LEAST common multiple can be smaller — check earlier meeting points.",
        },
      ],
      hints: ["List multiples of 6 and of 4. Where do they first meet?"],
    },
    {
      id: "practice-2",
      concept: "equivalent-fractions",
      prompt: "Compute 1/4 + 1/2. Give the result as a fraction a/b.",
      answer: { kind: "expression", acceptedForms: ["3/4", "6/8"] },
      solution:
        "Re-cut the half into quarters: 1/2 = 2/4. Then 1/4 + 2/4 = 3/4.",
      misconceptions: [
        {
          id: "adds-across",
          triggerAnswers: ["2/6", "1/3"],
          description:
            "The learner added numerators and denominators separately: 1/4 + 1/2 = 2/6.",
          remediationFocus:
            "Convert to same-size pieces first; then only the counts are added.",
        },
      ],
      hints: ["How many quarters make a half?"],
    },
    {
      id: "practice-3",
      concept: "equivalent-fractions",
      prompt: "Compute 2/3 + 1/6. Give the result as a fraction a/b.",
      answer: { kind: "expression", acceptedForms: ["5/6"] },
      solution:
        "Thirds re-cut into sixths: 2/3 = 4/6. Then 4/6 + 1/6 = 5/6.",
      misconceptions: [
        {
          id: "adds-across",
          triggerAnswers: ["3/9", "1/3"],
          description:
            "The learner added numerators and denominators separately: 2/3 + 1/6 = 3/9.",
          remediationFocus:
            "Sixths are the common size here: convert 2/3 into sixths before adding.",
        },
      ],
      hints: ["How many sixths make two thirds?"],
    },
  ],
} satisfies Lesson;

export default lesson;
