import type { Lesson } from "../types";

const lesson = {
  id: "linear-equations-intro",
  title: "Solving Linear Equations",
  description:
    "Learn to solve one-variable linear equations by keeping both sides balanced, one verified step at a time.",
  concepts: ["balance-principle", "inverse-operations", "combining-like-terms"],
  steps: [
    {
      id: "step-1",
      concept: "balance-principle",
      prompt:
        "We want to solve 2x + 6 = 14. First: what number should we subtract from BOTH sides to isolate the term with x?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution:
        "The constant on the left side is +6. Subtracting 6 from both sides keeps the equation balanced and leaves 2x = 8. The key idea: whatever you do to one side, you must do to the other.",
      misconceptions: [
        {
          id: "subtract-the-coefficient",
          triggerAnswers: ["2"],
          description:
            "The learner subtracted the coefficient of x instead of the constant term.",
          remediationFocus:
            "Distinguish a coefficient (a number multiplying x, undone by division) from a constant term (a number added, undone by subtraction).",
        },
        {
          id: "moves-to-result",
          triggerAnswers: ["14"],
          description:
            "The learner tried to subtract the right-hand side, confusing the goal (isolate x) with the result.",
          remediationFocus:
            "We isolate the x-term by removing what is added to it on its own side.",
        },
      ],
      hints: [
        "Look only at the left side: 2x + 6. Which part is NOT attached to x?",
        "The +6 is added to the 2x. What operation undoes an addition?",
        "Subtracting the constant term from both sides leaves the x-term alone on the left.",
      ],
    },
    {
      id: "step-2",
      concept: "inverse-operations",
      prompt: "After subtracting, we have 2x = 8. What is x?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution:
        "2x = 8 means '2 times x equals 8'. The inverse of multiplying by 2 is dividing by 2. Dividing both sides by 2 gives x = 4. Check: 2(4) + 6 = 14. Correct.",
      misconceptions: [
        {
          id: "subtracts-instead-of-divides",
          triggerAnswers: ["6"],
          description:
            "The learner subtracted 2 from 8 instead of dividing, treating the coefficient like a constant term.",
          remediationFocus:
            "2x means 2 TIMES x. Multiplication is undone by division, not subtraction.",
        },
        {
          id: "multiplies-instead-of-divides",
          triggerAnswers: ["16"],
          description: "The learner multiplied 8 by 2 instead of dividing.",
          remediationFocus:
            "To undo 'times 2', apply the inverse operation: divide by 2.",
        },
      ],
      hints: [
        "Read 2x out loud: '2 times x'. What single operation connects 2 and x?",
        "What operation undoes a multiplication?",
        "Divide both sides of the equation by the coefficient of x.",
      ],
    },
    {
      id: "step-3",
      concept: "combining-like-terms",
      prompt:
        "New equation: 3x + 2x - 4 = 11. Before isolating anything, simplify the left side. What is the coefficient of x after combining like terms?",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution:
        "3x and 2x are like terms: 3x + 2x = 5x. The simplified equation is 5x - 4 = 11. Combining like terms first keeps the rest of the solution simple.",
      misconceptions: [
        {
          id: "multiplies-coefficients",
          triggerAnswers: ["6"],
          description:
            "The learner multiplied the coefficients (3 times 2) instead of adding them.",
          remediationFocus:
            "3x + 2x means three x's plus two x's: count them, don't multiply them.",
        },
      ],
      hints: [
        "Think of 3x as 'three x's' and 2x as 'two x's'. How many x's in total?",
        "Like terms are combined by adding their coefficients.",
      ],
    },
    {
      id: "step-4",
      concept: "inverse-operations",
      prompt: "Finish it: solve 5x - 4 = 11 for x.",
      answer: { kind: "numeric", value: 3, tolerance: 0 },
      solution:
        "Add 4 to both sides: 5x = 15. Divide both sides by 5: x = 3. Check: 5(3) - 4 = 11. Correct. This is the full two-move pattern: undo the constant first, then undo the coefficient.",
      misconceptions: [
        {
          id: "wrong-order-divides-first",
          triggerAnswers: ["2.2", "11/5"],
          description:
            "The learner divided by 5 before moving the -4, then mishandled the constant.",
          remediationFocus:
            "Undo additions and subtractions before multiplications: peel the equation like an onion, outermost operation first.",
        },
      ],
      hints: [
        "Two things are happening to x: it is multiplied by 5, and then 4 is subtracted. Which do you undo first?",
        "First undo the -4. What does the equation look like after that?",
        "Once you have 5x alone on the left, one inverse operation remains.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
