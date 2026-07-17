import type { Lesson } from "../types";

const lesson = {
  id: "algebra-balance-equality-as-invariant",
  title: "Equality as an Invariant",
  track: "Algebra",
  description:
    "Read equality as a relationship between two values and decide which moves keep that relationship true.",
  concepts: [
    "algebra-balance-expression-vs-equation",
    "algebra-balance-equality-relation",
    "algebra-balance-equality-preservation",
  ],
  steps: [
    {
      id: "algebra-balance-eqi-step-01",
      concept: "algebra-balance-expression-vs-equation",
      prompt:
        "Which item is an equation rather than only an expression?",
      answer: {
        kind: "multipleChoice",
        options: ["3n + 5", "3n + 5 = 20", "20 - 5", "3n"],
        correctIndex: 1,
      },
      solution:
        "An equation states that two expressions have equal value, so it contains an equals sign with an expression on each side. Here, 3n + 5 = 20 is the equation.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-chooses-long-expression",
          triggerAnswers: ["3n + 5"],
          description:
            "The learner treated a multi-term expression as an equation even though it makes no equality claim.",
          remediationFocus:
            "Contrast naming a value with asserting that two values are equal; locate the two sides and the equals sign.",
        },
        {
          id: "algebra-balance-eqi-chooses-computation",
          triggerAnswers: ["20 - 5"],
          description:
            "The learner confused an expression that can be evaluated with an equation.",
          remediationFocus:
            "An expression represents one value; an equation relates the values of two expressions.",
        },
      ],
      hints: [
        "An expression names a value. An equation makes a claim about two values.",
        "Look for an equals sign with a mathematical expression on both sides.",
      ],
    },
    {
      id: "algebra-balance-eqi-step-02",
      concept: "algebra-balance-equality-relation",
      prompt: "Which equation is true? Evaluate both sides before choosing.",
      answer: {
        kind: "multipleChoice",
        options: ["8 + 4 = 8 + 6", "8 + 4 = 6 + 6", "8 + 4 = 12 + 1"],
        correctIndex: 1,
      },
      solution:
        "The left side is 12. Only 6 + 6 also has value 12, so 8 + 4 = 6 + 6 is true. Equality compares values; it does not mean 'now calculate.'",
      misconceptions: [
        {
          id: "algebra-balance-eqi-matches-first-term",
          triggerAnswers: ["8 + 4 = 8 + 6"],
          description:
            "The learner matched a visible term instead of comparing the complete values on both sides.",
          remediationFocus:
            "Evaluate each complete side, then compare the two results.",
        },
        {
          id: "algebra-balance-eqi-off-by-one",
          triggerAnswers: ["8 + 4 = 12 + 1"],
          description:
            "The learner recognized 8 + 4 as 12 but did not evaluate the full right side.",
          remediationFocus:
            "Treat everything to the right of the equals sign as one expression that must also be evaluated.",
        },
      ],
      hints: [
        "The equals sign says the complete left and right sides have the same value.",
        "Find the value of 8 + 4, then test each complete right side.",
      ],
    },
    {
      id: "algebra-balance-eqi-step-03",
      concept: "algebra-balance-equality-preservation",
      prompt:
        "Start with the true equation 7 = 7. Which move is guaranteed to keep the two sides equal?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Add 3 only to the left side",
          "Add 3 to both sides",
          "Add 3 to the left and subtract 3 from the right",
        ],
        correctIndex: 1,
      },
      solution:
        "Applying the same operation with the same number to both equal values produces equal results: 7 + 3 = 7 + 3. The other moves change the sides differently.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-one-side-change",
          triggerAnswers: ["Add 3 only to the left side"],
          description:
            "The learner changed one side without preserving the relationship between the sides.",
          remediationFocus:
            "Use balance language: equal changes to equal sides keep the balance level.",
        },
        {
          id: "algebra-balance-eqi-opposite-changes",
          triggerAnswers: ["Add 3 to the left and subtract 3 from the right"],
          description:
            "The learner assumed opposite operations would balance each other across the equals sign.",
          remediationFocus:
            "Each side must receive the same operation, not operations that point in opposite directions.",
        },
      ],
      hints: [
        "Picture two equal weights on a level balance.",
        "Which move changes both equal values in exactly the same way?",
      ],
    },
    {
      id: "algebra-balance-eqi-step-04",
      concept: "algebra-balance-equality-preservation",
      prompt:
        "A learner changes 2x + 5 = 13 into 2x = 8. Which description justifies the move?",
      answer: {
        kind: "multipleChoice",
        options: [
          "They subtracted 5 from both sides",
          "They removed 5 only from the left side",
          "They divided both sides by 5",
        ],
        correctIndex: 0,
      },
      solution:
        "Subtracting 5 from each side gives 2x + 5 - 5 = 13 - 5, which simplifies to 2x = 8. The equality is preserved because the same quantity was removed from both sides.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-cancel-without-both-sides",
          triggerAnswers: ["They removed 5 only from the left side"],
          description:
            "The learner viewed cancellation as permission to erase a term rather than as the result of equal operations.",
          remediationFocus:
            "Write the operation on both sides before simplifying; cancellation happens only after subtracting 5 from the left.",
        },
        {
          id: "algebra-balance-eqi-wrong-operation-description",
          triggerAnswers: ["They divided both sides by 5"],
          description:
            "The learner noticed the 5 but did not distinguish an added constant from a factor.",
          remediationFocus:
            "Read 2x + 5 as '2x, then add 5'; undo that addition with subtraction.",
        },
      ],
      hints: [
        "Compare the 13 and the 8. What same-number operation connects them?",
        "Write 2x + 5 - 5 on the left. Apply that operation to 13 as well.",
      ],
    },
    {
      id: "algebra-balance-eqi-step-05",
      concept: "algebra-balance-equality-preservation",
      prompt:
        "Is the change from x + 4 = 9 to x = 9 guaranteed to preserve the same solution?",
      answer: {
        kind: "multipleChoice",
        options: ["yes", "no"],
        correctIndex: 1,
      },
      solution:
        "No. The +4 was removed only from the left. Subtracting 4 from both sides would give x = 5. The proposed change turns a true statement at x = 5 into the false statement 5 = 9.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-erasing-is-solving",
          triggerAnswers: ["yes"],
          description:
            "The learner thought isolating x permits deleting any nearby constant without changing the other side.",
          remediationFocus:
            "Distinguish the goal of isolation from the legal move that achieves it: apply the inverse operation to both sides.",
        },
      ],
      hints: [
        "Track what happened to each side of the equation.",
        "Test the original solution candidate x = 5 in both the original and changed equations.",
      ],
    },
  ],
  practice: [
    {
      id: "algebra-balance-eqi-practice-01",
      concept: "algebra-balance-expression-vs-equation",
      prompt: "Which item is only an expression?",
      answer: {
        kind: "multipleChoice",
        options: ["4y - 1 = 11", "4y - 1", "11 = 4y - 1"],
        correctIndex: 1,
      },
      solution: "4y - 1 names a value but does not state that two values are equal.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-practice-equation-confusion",
          triggerAnswers: ["4y - 1 = 11", "11 = 4y - 1"],
          description: "The learner selected an item that contains an equality claim.",
          remediationFocus: "Use the equals sign to distinguish equations from expressions.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-eqi-practice-02",
      concept: "algebra-balance-equality-relation",
      prompt: "Which equation is false?",
      answer: {
        kind: "multipleChoice",
        options: ["15 - 7 = 4 + 4", "3 × 4 = 6 + 6", "18 ÷ 3 = 2 + 3"],
        correctIndex: 2,
      },
      solution: "18 ÷ 3 has value 6, while 2 + 3 has value 5, so that equation is false.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-practice-visual-match",
          triggerAnswers: ["15 - 7 = 4 + 4", "3 × 4 = 6 + 6"],
          description: "The learner selected a true equation without evaluating both sides.",
          remediationFocus: "Evaluate both complete expressions before comparing them.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-eqi-practice-03",
      concept: "algebra-balance-equality-preservation",
      prompt:
        "From a = b, which new equation is always true?",
      answer: {
        kind: "multipleChoice",
        options: ["a + 6 = b + 6", "a + 6 = b", "a - 6 = b + 6"],
        correctIndex: 0,
      },
      solution: "Adding the same number to equal values preserves equality: a + 6 = b + 6.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-practice-asymmetric-change",
          triggerAnswers: ["a + 6 = b", "a - 6 = b + 6"],
          description: "The learner did not apply the same change to both sides.",
          remediationFocus: "Match the operation and quantity on both sides.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-eqi-practice-04",
      concept: "algebra-balance-equality-preservation",
      prompt:
        "The true equation 24 = 24 is changed to 24 ÷ 6 = 24 ÷ 6. What value is on each side now?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution: "Both sides were divided by the same nonzero number: 24 ÷ 6 = 4.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-practice-divides-once",
          triggerAnswers: ["18"],
          description: "The learner subtracted 6 rather than dividing by 6.",
          remediationFocus: "Read the division sign and compute 24 split into 6 equal groups.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-eqi-practice-05",
      concept: "algebra-balance-equality-preservation",
      prompt:
        "Which change from 3x = 21 does NOT preserve the same solution?",
      answer: {
        kind: "multipleChoice",
        options: ["3x ÷ 3 = 21 ÷ 3", "3x + 2 = 21 + 2", "3x - 3 = 21"],
        correctIndex: 2,
      },
      solution: "The last change subtracts 3 only on the left, so the sides are not changed equally.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-practice-rejects-valid-move",
          triggerAnswers: ["3x ÷ 3 = 21 ÷ 3", "3x + 2 = 21 + 2"],
          description: "The learner rejected a move that applies the same operation to both sides.",
          remediationFocus: "Judge preservation separately from whether a move immediately isolates x.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-eqi-practice-06",
      concept: "algebra-balance-equality-relation",
      prompt:
        "For x = 4, is 2x + 1 = 9 a true equation?",
      answer: {
        kind: "multipleChoice",
        options: ["yes", "no"],
        correctIndex: 0,
      },
      solution: "Substituting 4 gives 2(4) + 1 = 8 + 1 = 9, so both sides have value 9.",
      misconceptions: [
        {
          id: "algebra-balance-eqi-practice-ignores-coefficient",
          triggerAnswers: ["no"],
          description: "The learner may have read 2x as 2 + x or skipped substitution.",
          remediationFocus: "Replace x with 4, interpret 2x as 2 times 4, and compare values.",
        },
      ],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
