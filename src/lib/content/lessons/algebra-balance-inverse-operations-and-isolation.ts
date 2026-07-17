import type { Lesson } from "../types";

const lesson = {
  id: "algebra-balance-inverse-operations-and-isolation",
  title: "Inverse Operations and Isolation",
  track: "Algebra",
  description:
    "Undo one operation on both sides, distinguish coefficients from constants, and isolate an unknown with justification.",
  concepts: [
    "algebra-balance-additive-inverses",
    "algebra-balance-multiplicative-inverses",
    "algebra-balance-coefficient-vs-constant",
  ],
  steps: [
    {
      id: "algebra-balance-inv-step-01",
      concept: "algebra-balance-additive-inverses",
      prompt:
        "To isolate x in x + 7 = 12, which operation should be applied to both sides?",
      answer: {
        kind: "multipleChoice",
        options: ["add 7", "subtract 7", "divide by 7"],
        correctIndex: 1,
      },
      solution:
        "The +7 is undone by its additive inverse, -7. Subtracting 7 from both sides gives x + 7 - 7 = 12 - 7, so x = 5.",
      misconceptions: [
        {
          id: "algebra-balance-inv-repeats-addition",
          triggerAnswers: ["add 7"],
          description: "The learner repeated the visible operation instead of undoing it.",
          remediationFocus: "Pair addition with subtraction as inverse operations.",
        },
        {
          id: "algebra-balance-inv-divides-added-constant",
          triggerAnswers: ["divide by 7"],
          description: "The learner treated an added constant as though it were multiplying x.",
          remediationFocus: "Read x + 7 aloud and identify the operation joining x and 7.",
        },
      ],
      hints: [
        "Ask which operation turns +7 into 0.",
        "Apply that inverse operation to both sides of the equation.",
      ],
    },
    {
      id: "algebra-balance-inv-step-02",
      concept: "algebra-balance-additive-inverses",
      prompt: "Solve x - 4 = 9.",
      answer: { kind: "numeric", value: 13, tolerance: 0 },
      solution:
        "Add 4 to both sides: x - 4 + 4 = 9 + 4, so x = 13. Check: 13 - 4 = 9.",
      misconceptions: [
        {
          id: "algebra-balance-inv-subtracts-again",
          triggerAnswers: ["5"],
          description: "The learner subtracted 4 again instead of undoing subtraction.",
          remediationFocus: "Use the additive inverse: adding 4 makes -4 + 4 equal zero.",
        },
        {
          id: "algebra-balance-inv-switches-sides-without-sign",
          triggerAnswers: ["-13"],
          description: "The learner changed the sign of the result while informally moving terms.",
          remediationFocus: "Write +4 on both sides and simplify rather than relying on a move-across shortcut.",
        },
      ],
      hints: [
        "What operation undoes subtracting 4?",
        "Keep the balance: perform that operation on 9 as well.",
      ],
    },
    {
      id: "algebra-balance-inv-step-03",
      concept: "algebra-balance-multiplicative-inverses",
      prompt: "Solve 5x = 35.",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution:
        "The coefficient 5 multiplies x. Divide both sides by the nonzero number 5: 5x ÷ 5 = 35 ÷ 5, so x = 7. Check: 5(7) = 35.",
      misconceptions: [
        {
          id: "algebra-balance-inv-subtracts-coefficient",
          triggerAnswers: ["30"],
          description: "The learner subtracted the coefficient from 35 as if 5 were an added constant.",
          remediationFocus: "Interpret 5x as five equal groups of x; undo multiplication with division.",
        },
        {
          id: "algebra-balance-inv-multiplies-coefficient",
          triggerAnswers: ["175"],
          description: "The learner multiplied by 5 again instead of undoing multiplication.",
          remediationFocus: "Use division as the inverse of multiplication.",
        },
      ],
      hints: [
        "Read 5x as '5 times x.'",
        "Split both sides into 5 equal groups.",
      ],
    },
    {
      id: "algebra-balance-inv-step-04",
      concept: "algebra-balance-multiplicative-inverses",
      prompt: "Solve x ÷ 3 = 6.",
      answer: { kind: "numeric", value: 18, tolerance: 0 },
      solution:
        "Multiplying both sides by 3 undoes division by 3: (x ÷ 3) × 3 = 6 × 3, so x = 18. Check: 18 ÷ 3 = 6.",
      misconceptions: [
        {
          id: "algebra-balance-inv-divides-again",
          triggerAnswers: ["2"],
          description: "The learner divided 6 by 3 again instead of undoing the division.",
          remediationFocus: "Pair division by 3 with multiplication by 3.",
        },
        {
          id: "algebra-balance-inv-adds-divisor",
          triggerAnswers: ["9"],
          description: "The learner added the divisor as if it were a subtracted constant.",
          remediationFocus: "Identify division as the operation connecting x and 3, then choose its inverse.",
        },
      ],
      hints: [
        "What operation reverses dividing a quantity into 3 equal groups?",
        "Apply that operation to both x ÷ 3 and 6.",
      ],
    },
    {
      id: "algebra-balance-inv-step-05",
      concept: "algebra-balance-coefficient-vs-constant",
      prompt:
        "In 4x + 6 = 22, which number is the coefficient and which is the constant added to the x-term?",
      answer: {
        kind: "multipleChoice",
        options: [
          "coefficient 4; added constant 6",
          "coefficient 6; added constant 4",
          "coefficient 22; added constant 6",
        ],
        correctIndex: 0,
      },
      solution:
        "The coefficient is the factor multiplying x, so it is 4. The separate number added to 4x is the constant 6. This distinction determines the inverse operations: subtract 6 before dividing by 4.",
      misconceptions: [
        {
          id: "algebra-balance-inv-swaps-coefficient-constant",
          triggerAnswers: ["coefficient 6; added constant 4"],
          description: "The learner swapped the number multiplying x with the separate added term.",
          remediationFocus: "Locate the number directly attached to x by multiplication; then locate the standalone term.",
        },
        {
          id: "algebra-balance-inv-uses-right-side-as-coefficient",
          triggerAnswers: ["coefficient 22; added constant 6"],
          description: "The learner treated the value on the other side as a coefficient.",
          remediationFocus: "A coefficient belongs to a variable term and appears as its multiplier.",
        },
      ],
      hints: [
        "A coefficient is a factor: it tells how many copies of x there are.",
        "Read 4x + 6 aloud as '4 times x, plus 6.'",
      ],
    },
  ],
  practice: [
    {
      id: "algebra-balance-inv-practice-01",
      concept: "algebra-balance-additive-inverses",
      prompt: "Solve y + 9 = 15.",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution: "Subtract 9 from both sides: y = 15 - 9 = 6.",
      misconceptions: [
        {
          id: "algebra-balance-inv-practice-adds-nine",
          triggerAnswers: ["24"],
          description: "The learner added 9 instead of undoing +9.",
          remediationFocus: "Use subtraction as the inverse of addition.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-inv-practice-02",
      concept: "algebra-balance-additive-inverses",
      prompt: "Solve p - 8 = 5.",
      answer: { kind: "numeric", value: 13, tolerance: 0 },
      solution: "Add 8 to both sides: p = 5 + 8 = 13.",
      misconceptions: [
        {
          id: "algebra-balance-inv-practice-subtracts-eight",
          triggerAnswers: ["-3", "3"],
          description: "The learner subtracted 8 from 5 instead of undoing -8.",
          remediationFocus: "Add 8 to both sides so -8 and +8 cancel.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-inv-practice-03",
      concept: "algebra-balance-multiplicative-inverses",
      prompt: "Solve 6m = 42.",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution: "Divide both sides by 6: m = 42 ÷ 6 = 7.",
      misconceptions: [
        {
          id: "algebra-balance-inv-practice-subtracts-six",
          triggerAnswers: ["36"],
          description: "The learner treated the coefficient as an added constant.",
          remediationFocus: "6m means 6 times m, so divide by 6.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-inv-practice-04",
      concept: "algebra-balance-multiplicative-inverses",
      prompt: "Solve q ÷ 4 = 7.",
      answer: { kind: "numeric", value: 28, tolerance: 0 },
      solution: "Multiply both sides by 4: q = 7 × 4 = 28.",
      misconceptions: [
        {
          id: "algebra-balance-inv-practice-divides-four",
          triggerAnswers: ["1.75", "7/4"],
          description: "The learner divided 7 by 4 instead of reversing division by 4.",
          remediationFocus: "Multiplication by 4 undoes division by 4.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-inv-practice-05",
      concept: "algebra-balance-coefficient-vs-constant",
      prompt:
        "In 7k - 3 = 25, which number is the coefficient of k?",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution: "The factor multiplying k is 7, so 7 is the coefficient. The -3 is a constant term.",
      misconceptions: [
        {
          id: "algebra-balance-inv-practice-chooses-constant",
          triggerAnswers: ["-3", "3"],
          description: "The learner chose the standalone constant instead of the multiplier of k.",
          remediationFocus: "Find the number directly multiplying the variable.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-inv-practice-06",
      concept: "algebra-balance-coefficient-vs-constant",
      prompt:
        "For 3x + 8 = 20, which operation correctly removes the constant term from the left?",
      answer: {
        kind: "multipleChoice",
        options: ["subtract 8 from both sides", "divide both sides by 8", "subtract 3 from both sides"],
        correctIndex: 0,
      },
      solution: "The standalone +8 is removed by subtracting 8 from both sides.",
      misconceptions: [
        {
          id: "algebra-balance-inv-practice-divides-constant",
          triggerAnswers: ["divide both sides by 8"],
          description: "The learner treated the added constant as a factor.",
          remediationFocus: "Identify the operation connecting 8 to the x-term: addition is undone by subtraction.",
        },
        {
          id: "algebra-balance-inv-practice-subtracts-coefficient",
          triggerAnswers: ["subtract 3 from both sides"],
          description: "The learner tried to subtract the coefficient rather than undo its multiplication later.",
          remediationFocus: "Remove the standalone constant first; a coefficient is undone by division.",
        },
      ],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
