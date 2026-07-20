import type { Lesson } from "../types";

const lesson = {
  id: "linear-equations-intro",
  title: "Solving Linear Equations",
  track: "Algebra",
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
          highlight: { kind: "term", text: "+ 6" },
        },
        {
          id: "moves-to-result",
          triggerAnswers: ["14"],
          description:
            "The learner tried to subtract the right-hand side, confusing the goal (isolate x) with the result.",
          remediationFocus:
            "We isolate the x-term by removing what is added to it on its own side.",
          highlight: { kind: "term", text: "+ 6" },
        },
      ],
      hints: [
        "Look only at the left side: 2x + 6. Which part is NOT attached to x?",
        "The +6 is added to the 2x. What operation undoes an addition?",
        "Subtracting the constant term from both sides leaves the x-term alone on the left.",
      ],
      variants: [
        {
          prompt:
            "We want to solve 3x + 4 = 19. What number should we subtract from BOTH sides to isolate the term with x?",
          answer: { kind: "numeric", value: 4, tolerance: 0 },
          solution:
            "The constant on the left side is +4. Subtracting 4 from both sides keeps the equation balanced and leaves 3x = 15. Same principle as before: remove the constant term first.",
          misconceptions: [
            {
              id: "subtract-the-coefficient",
              triggerAnswers: ["3"],
              description:
                "The learner subtracted the coefficient of x instead of the constant term.",
              remediationFocus:
                "Distinguish a coefficient (a number multiplying x, undone by division) from a constant term (a number added, undone by subtraction).",
              highlight: { kind: "term", text: "+ 4" },
            },
            {
              id: "moves-to-result",
              triggerAnswers: ["19"],
              description:
                "The learner tried to subtract the right-hand side, confusing the goal (isolate x) with the result.",
              remediationFocus:
                "We isolate the x-term by removing what is added to it on its own side.",
              highlight: { kind: "term", text: "+ 4" },
            },
          ],
          hints: [
            "Look only at the left side: 3x + 4. Which part is NOT attached to x?",
            "The +4 is added to the 3x. What operation undoes an addition?",
            "Subtracting the constant term from both sides leaves the x-term alone on the left.",
          ],
        },
        {
          prompt:
            "We want to solve 5x + 9 = 24. What number should we subtract from BOTH sides to isolate the term with x?",
          answer: { kind: "numeric", value: 9, tolerance: 0 },
          solution:
            "The constant on the left side is +9. Subtracting 9 from both sides keeps the equation balanced and leaves 5x = 15.",
          misconceptions: [
            {
              id: "subtract-the-coefficient",
              triggerAnswers: ["5"],
              description:
                "The learner subtracted the coefficient of x instead of the constant term.",
              remediationFocus:
                "Distinguish a coefficient (a number multiplying x, undone by division) from a constant term (a number added, undone by subtraction).",
              highlight: { kind: "term", text: "+ 9" },
            },
            {
              id: "moves-to-result",
              triggerAnswers: ["24"],
              description:
                "The learner tried to subtract the right-hand side, confusing the goal (isolate x) with the result.",
              remediationFocus:
                "We isolate the x-term by removing what is added to it on its own side.",
              highlight: { kind: "term", text: "+ 9" },
            },
          ],
          hints: [
            "Look only at the left side: 5x + 9. Which part is NOT attached to x?",
            "The +9 is added to the 5x. What operation undoes an addition?",
            "Subtracting the constant term from both sides leaves the x-term alone on the left.",
          ],
        },
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
          highlight: { kind: "term", text: "2x" },
        },
        {
          id: "multiplies-instead-of-divides",
          triggerAnswers: ["16"],
          description: "The learner multiplied 8 by 2 instead of dividing.",
          remediationFocus:
            "To undo 'times 2', apply the inverse operation: divide by 2.",
          highlight: { kind: "term", text: "2x" },
        },
      ],
      hints: [
        "Read 2x out loud: '2 times x'. What single operation connects 2 and x?",
        "What operation undoes a multiplication?",
        "Divide both sides of the equation by the coefficient of x.",
      ],
      variants: [
        {
          prompt: "New equation: 3x = 15. What is x?",
          answer: { kind: "numeric", value: 5, tolerance: 0 },
          solution:
            "3x = 15 means '3 times x equals 15'. Dividing both sides by 3 gives x = 5. Check: 3(5) = 15. Correct.",
          misconceptions: [
            {
              id: "subtracts-instead-of-divides",
              triggerAnswers: ["12"],
              description:
                "The learner subtracted 3 from 15 instead of dividing, treating the coefficient like a constant term.",
              remediationFocus:
                "3x means 3 TIMES x. Multiplication is undone by division, not subtraction.",
              highlight: { kind: "term", text: "3x" },
            },
            {
              id: "multiplies-instead-of-divides",
              triggerAnswers: ["45"],
              description: "The learner multiplied 15 by 3 instead of dividing.",
              remediationFocus:
                "To undo 'times 3', apply the inverse operation: divide by 3.",
              highlight: { kind: "term", text: "3x" },
            },
          ],
          hints: [
            "Read 3x out loud: '3 times x'. What single operation connects 3 and x?",
            "What operation undoes a multiplication?",
            "Divide both sides of the equation by the coefficient of x.",
          ],
        },
        {
          prompt: "New equation: 4x = 24. What is x?",
          answer: { kind: "numeric", value: 6, tolerance: 0 },
          solution:
            "4x = 24 means '4 times x equals 24'. Dividing both sides by 4 gives x = 6. Check: 4(6) = 24. Correct.",
          misconceptions: [
            {
              id: "subtracts-instead-of-divides",
              triggerAnswers: ["20"],
              description:
                "The learner subtracted 4 from 24 instead of dividing, treating the coefficient like a constant term.",
              remediationFocus:
                "4x means 4 TIMES x. Multiplication is undone by division, not subtraction.",
              highlight: { kind: "term", text: "4x" },
            },
            {
              id: "multiplies-instead-of-divides",
              triggerAnswers: ["96"],
              description: "The learner multiplied 24 by 4 instead of dividing.",
              remediationFocus:
                "To undo 'times 4', apply the inverse operation: divide by 4.",
              highlight: { kind: "term", text: "4x" },
            },
          ],
          hints: [
            "Read 4x out loud: '4 times x'. What single operation connects 4 and x?",
            "What operation undoes a multiplication?",
            "Divide both sides of the equation by the coefficient of x.",
          ],
        },
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
          highlight: { kind: "term", text: "3x + 2x" },
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
          highlight: { kind: "term", text: "- 4" },
        },
      ],
      hints: [
        "Two things are happening to x: it is multiplied by 5, and then 4 is subtracted. Which do you undo first?",
        "First undo the -4. What does the equation look like after that?",
        "Once you have 5x alone on the left, one inverse operation remains.",
      ],
      variants: [
        {
          prompt: "Finish this one: solve 4x - 6 = 10 for x.",
          answer: { kind: "numeric", value: 4, tolerance: 0 },
          solution:
            "Add 6 to both sides: 4x = 16. Divide both sides by 4: x = 4. Check: 4(4) - 6 = 10. Correct. Same pattern: undo the constant first, then undo the coefficient.",
          misconceptions: [
            {
              id: "wrong-order-divides-first",
              triggerAnswers: ["2.5", "10/4"],
              description:
                "The learner divided by 4 before moving the -6, then mishandled the constant.",
              remediationFocus:
                "Undo additions and subtractions before multiplications: peel the equation like an onion, outermost operation first.",
              highlight: { kind: "term", text: "- 6" },
            },
          ],
          hints: [
            "Two things are happening to x: it is multiplied by 4, and then 6 is subtracted. Which do you undo first?",
            "First undo the -6. What does the equation look like after that?",
            "Once you have 4x alone on the left, one inverse operation remains.",
          ],
        },
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "balance-principle",
      prompt: "Solve 3x + 5 = 20 for x.",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution:
        "Subtract 5 from both sides: 3x = 15. Divide both sides by 3: x = 5. Check: 3(5) + 5 = 20.",
      misconceptions: [
        {
          id: "wrong-order-divides-first",
          triggerAnswers: ["20/3"],
          description:
            "The learner divided by 3 before removing the +5.",
          remediationFocus:
            "Undo the added constant before undoing the coefficient.",
        },
      ],
      hints: ["Undo the +5 first, then deal with the 3."],
    },
    {
      id: "practice-2",
      concept: "combining-like-terms",
      prompt: "Simplify and solve: 4x + x = 30. What is x?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution:
        "4x + x = 5x (a bare x has coefficient 1). So 5x = 30 and x = 6.",
      misconceptions: [
        {
          id: "treats-x-as-zero",
          triggerAnswers: ["7.5"],
          description:
            "The learner combined 4x + x into 4x, treating the bare x as having no coefficient.",
          remediationFocus: "A bare x means 1x — it counts.",
        },
      ],
      hints: ["What is the coefficient of a bare x?"],
    },
    {
      id: "practice-3",
      concept: "inverse-operations",
      prompt: "Solve 2x - 7 = 9 for x.",
      answer: { kind: "numeric", value: 8, tolerance: 0 },
      solution:
        "Add 7 to both sides: 2x = 16. Divide both sides by 2: x = 8. Check: 2(8) - 7 = 9.",
      misconceptions: [
        {
          id: "subtracts-the-constant-again",
          triggerAnswers: ["1"],
          description:
            "The learner subtracted 7 instead of adding it, getting 2x = 2.",
          remediationFocus:
            "The inverse of subtracting 7 is ADDING 7 — move against the operation, not with it.",
        },
      ],
      hints: ["The constant is being SUBTRACTED. What undoes a subtraction?"],
    },
  ],
} satisfies Lesson;

export default lesson;
