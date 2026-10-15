import type { Lesson } from "../types";

const lesson = {
  id: "fractions-unlike-denominators",
  title: "Adding Fractions with Unlike Denominators",
  track: "Arithmetic",
  description:
    "Discover why fractions need a common denominator before they can be added, and how to find one.",
  concepts: ["common-denominator", "equivalent-fractions", "same-whole"],
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
        "Imagine half and a third of two identical pizzas. Are the slices the same size?",
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
      answer: { kind: "numeric", value: 5 / 6, tolerance: 0 },
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
    {
      id: "step-4",
      concept: "same-whole",
      prompt: "One person eats half a small pizza and another eats a third of a much larger pizza. Can we call the total 5/6 of one pizza without knowing how the two whole pizzas compare?",
      answer: { kind: "multipleChoice", options: ["yes", "no"], correctIndex: 1 },
      solution: "No. A fraction measures a part relative to its whole. The small pizza and the large pizza are different whole amounts, so their half and third cannot be compared on one pizza-sized scale until we know the sizes. A common denominator aligns piece counts only after a common whole or unit has been chosen.",
      misconceptions: [{ id: "ignores-reference-whole", triggerAnswers: ["yes"], description: "The learner combined part-to-whole fractions from different-sized wholes as though the reference amount were identical.", remediationFocus: "Name what one whole means for each fraction before trying to match denominators." }],
      hints: ["Would half a tiny pizza be the same amount as half a very large pizza?", "A denominator tells you how a whole is divided. First check whether the wholes themselves match."],
    },
    {
      id: "step-5",
      concept: "equivalent-fractions",
      prompt: "A ribbon is 3/4 of a metre long. You attach another piece that is 1/8 of a metre long. What is the combined length in metres? Write a fraction.",
      answer: { kind: "numeric", value: 7 / 8, tolerance: 0 },
      solution: "Both lengths refer to the same unit, one metre. Three quarters is six eighths, so 3/4 + 1/8 = 6/8 + 1/8 = 7/8 of a metre. Equivalent unsimplified forms describe the same length.",
      misconceptions: [{ id: "adds-across", triggerAnswers: ["4/12", "1/3"], description: "The learner added the numerators and denominators, creating a value smaller than the original ribbon.", remediationFocus: "An attached positive piece must make the ribbon longer. Choose one shared piece size before adding the counts." }, { id: "changes-denominator-only", triggerAnswers: ["4/8", "1/2"], description: "The learner changed quarters into eighths without doubling the count of pieces.", remediationFocus: "When each piece is cut in half, the number of pieces doubles; the amount of ribbon remains unchanged." }],
      hints: ["The answer must be longer than 3/4 of a metre. Use that as a quick sense check.", "Cut each quarter into two eighths, then count all the eighths."],
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
      answer: { kind: "numeric", value: 3 / 4, tolerance: 0 },
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
      answer: { kind: "numeric", value: 5 / 6, tolerance: 0 },
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
    {
      id: "practice-4",
      concept: "equivalent-fractions",
      prompt: "A walking route has a 2/5 km section followed by a 1/10 km section. What is the total length in kilometres? Write a fraction or decimal.",
      answer: { kind: "numeric", value: 1 / 2, tolerance: 0 },
      solution: "Both sections use kilometres. Convert 2/5 into 4/10, then add 1/10 to get 5/10 = 1/2 = 0.5 km. Any equivalent fraction gives the same route length.",
      misconceptions: [{ id: "adds-across", triggerAnswers: ["3/15", "1/5"], description: "The learner added the denominators and numerators rather than using one piece size.", remediationFocus: "Express both route sections in tenths of a kilometre before adding them." }],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
