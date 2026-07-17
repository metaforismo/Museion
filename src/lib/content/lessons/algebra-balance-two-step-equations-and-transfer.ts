import type { Lesson } from "../types";

const lesson = {
  id: "algebra-balance-two-step-equations-and-transfer",
  title: "Two-Step Equations and Transfer",
  track: "Algebra",
  description:
    "Plan reversible moves, compare valid paths, verify solutions by substitution, and model a new situation.",
  concepts: [
    "algebra-balance-reversible-plan",
    "algebra-balance-substitution-check",
    "algebra-balance-equivalent-solution-paths",
    "algebra-balance-context-modeling",
  ],
  steps: [
    {
      id: "algebra-balance-two-step-01",
      concept: "algebra-balance-reversible-plan",
      prompt:
        "For 3x + 4 = 19, which plan isolates x while preserving equality at every move?",
      answer: {
        kind: "multipleChoice",
        options: [
          "subtract 4 from both sides, then divide both sides by 3",
          "divide both sides by 3, then subtract 4 only from the left",
          "subtract 3 from both sides, then divide by 4",
        ],
        correctIndex: 0,
      },
      solution:
        "Undo the operations in reverse order. First subtract 4 from both sides to get 3x = 15. Then divide both sides by 3 to get x = 5.",
      misconceptions: [
        {
          id: "algebra-balance-two-asymmetric-plan",
          triggerAnswers: ["divide both sides by 3, then subtract 4 only from the left"],
          description: "The learner included a one-sided change and did not fully divide the expression by 3.",
          remediationFocus: "Require every line to apply one named operation to both complete sides.",
        },
        {
          id: "algebra-balance-two-swaps-roles",
          triggerAnswers: ["subtract 3 from both sides, then divide by 4"],
          description: "The learner swapped the coefficient and constant roles.",
          remediationFocus: "Identify +4 as the outer operation and ×3 as the operation directly on x.",
        },
      ],
      hints: [
        "Read the left side as: start with x, multiply by 3, then add 4.",
        "Undo that sequence from last operation to first, changing both sides each time.",
      ],
    },
    {
      id: "algebra-balance-two-step-02",
      concept: "algebra-balance-reversible-plan",
      prompt: "Use that reversible plan to solve 3x + 4 = 19.",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution:
        "Subtract 4 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
      misconceptions: [
        {
          id: "algebra-balance-two-divides-before-removing-constant",
          triggerAnswers: ["5/3", "1.6666666667"],
          description: "The learner divided 19 by 3 and then subtracted 4, or otherwise handled only part of the left side.",
          remediationFocus: "Remove the +4 first so the entire remaining left side is the product 3x.",
        },
        {
          id: "algebra-balance-two-stops-after-first-move",
          triggerAnswers: ["15"],
          description: "The learner stopped at 3x = 15 and reported the value of 3x rather than x.",
          remediationFocus: "Check whether x is alone; if a coefficient remains, divide both sides by it.",
        },
      ],
      hints: [
        "First remove the added constant from both sides.",
        "After that move, split both sides into 3 equal groups.",
      ],
    },
    {
      id: "algebra-balance-two-step-03",
      concept: "algebra-balance-substitution-check",
      prompt:
        "A learner says x = 5 solves 3x + 4 = 19. Which substitution check is correct?",
      answer: {
        kind: "multipleChoice",
        options: ["3 + 5 + 4 = 12", "3(5) + 4 = 19", "3(4) + 5 = 19"],
        correctIndex: 1,
      },
      solution:
        "Replace every x with 5 while keeping the equation's operations: 3(5) + 4 = 15 + 4 = 19. The resulting true statement verifies the solution.",
      misconceptions: [
        {
          id: "algebra-balance-two-reads-3x-as-sum",
          triggerAnswers: ["3 + 5 + 4 = 12"],
          description: "The learner interpreted 3x as 3 + x during substitution.",
          remediationFocus: "Preserve multiplication: a coefficient next to a variable means multiplication.",
        },
        {
          id: "algebra-balance-two-substitutes-wrong-position",
          triggerAnswers: ["3(4) + 5 = 19"],
          description: "The learner replaced the constant rather than the variable with the proposed value.",
          remediationFocus: "Locate each x first, then replace only x with the candidate value.",
        },
      ],
      hints: [
        "Substitution replaces the variable, not the other numbers.",
        "Keep 3x as multiplication when x becomes 5.",
      ],
    },
    {
      id: "algebra-balance-two-step-04",
      concept: "algebra-balance-equivalent-solution-paths",
      prompt:
        "For 2(x + 3) = 14, which statement about the two paths is correct? Path A divides both sides by 2, then subtracts 3. Path B distributes 2, subtracts 6 from both sides, then divides by 2.",
      answer: {
        kind: "multipleChoice",
        options: [
          "Only Path A is valid",
          "Only Path B is valid",
          "Both paths are valid and give the same solution",
        ],
        correctIndex: 2,
      },
      solution:
        "Path A gives x + 3 = 7, then x = 4. Path B gives 2x + 6 = 14, then 2x = 8, then x = 4. Distribution preserves expression value, and each equation move is applied to both sides, so both paths are valid.",
      misconceptions: [
        {
          id: "algebra-balance-two-only-short-path-valid",
          triggerAnswers: ["Only Path A is valid"],
          description: "The learner confused efficiency with validity.",
          remediationFocus: "Judge whether each step preserves equivalence; a longer correct path can still be valid.",
        },
        {
          id: "algebra-balance-two-distribution-required",
          triggerAnswers: ["Only Path B is valid"],
          description: "The learner assumed parentheses must always be expanded before solving.",
          remediationFocus: "Dividing away a common outer factor can legally expose the grouped expression first.",
        },
      ],
      hints: [
        "Follow each path one line at a time and record its final x-value.",
        "Validity depends on preserving equal values, not on using a particular order.",
      ],
    },
    {
      id: "algebra-balance-two-step-05",
      concept: "algebra-balance-context-modeling",
      prompt:
        "Four identical supply boxes and one 3 kg packing tray weigh 27 kg altogether. If 4b + 3 = 27 models the situation, what is the weight b of one box in kilograms?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution:
        "Subtract the tray's 3 kg from both sides: 4b = 24. Divide both sides by 4: b = 6 kg. Check in context: four 6 kg boxes plus 3 kg weigh 24 + 3 = 27 kg.",
      misconceptions: [
        {
          id: "algebra-balance-two-divides-total-before-tray",
          triggerAnswers: ["6.75", "27/4"],
          description: "The learner divided the total by four without removing the separate tray weight.",
          remediationFocus: "Separate the fixed tray weight before sharing the remaining weight equally among boxes.",
        },
        {
          id: "algebra-balance-two-removes-coefficient-as-constant",
          triggerAnswers: ["5"],
          description: "The learner subtracted 4 and 3 from 27, confusing the number of boxes with added weight.",
          remediationFocus: "The 4 counts equal boxes; it is a multiplier, not an extra 4 kg.",
        },
      ],
      hints: [
        "Which part of 27 kg belongs to the tray rather than the boxes?",
        "After removing the tray weight, share the remaining weight equally among four boxes.",
      ],
    },
  ],
  practice: [
    {
      id: "algebra-balance-two-practice-01",
      concept: "algebra-balance-reversible-plan",
      prompt: "Solve 2x + 5 = 17.",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution: "Subtract 5 from both sides to get 2x = 12, then divide by 2: x = 6.",
      misconceptions: [
        {
          id: "algebra-balance-two-practice-stops-at-term",
          triggerAnswers: ["12"],
          description: "The learner stopped after finding the value of 2x.",
          remediationFocus: "Continue until x, not 2x, is isolated.",
        },
        {
          id: "algebra-balance-two-practice-divides-total-first",
          triggerAnswers: ["3.5", "7/2"],
          description: "The learner divided 17 by 2 before accounting for +5.",
          remediationFocus: "Undo the added constant before the coefficient.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-two-practice-02",
      concept: "algebra-balance-reversible-plan",
      prompt: "Solve 4x - 7 = 13.",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution: "Add 7 to both sides: 4x = 20. Divide both sides by 4: x = 5.",
      misconceptions: [
        {
          id: "algebra-balance-two-practice-subtracts-again",
          triggerAnswers: ["1.5", "3/2"],
          description: "The learner subtracted 7 again, then divided 6 by 4.",
          remediationFocus: "Undo -7 by adding 7 to both sides.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-two-practice-03",
      concept: "algebra-balance-substitution-check",
      prompt: "Does x = 3 solve 5x - 2 = 13?",
      answer: {
        kind: "multipleChoice",
        options: ["yes", "no"],
        correctIndex: 0,
      },
      solution: "Substitute 3: 5(3) - 2 = 15 - 2 = 13, so the equation is true.",
      misconceptions: [
        {
          id: "algebra-balance-two-practice-adds-coefficient",
          triggerAnswers: ["no"],
          description: "The learner may have interpreted 5x as 5 + x.",
          remediationFocus: "Preserve multiplication when substituting for x.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-two-practice-04",
      concept: "algebra-balance-substitution-check",
      prompt: "Does x = 4 solve 3x + 2 = 17?",
      answer: {
        kind: "multipleChoice",
        options: ["yes", "no"],
        correctIndex: 1,
      },
      solution: "Substitute 4: 3(4) + 2 = 14, not 17, so x = 4 is not a solution.",
      misconceptions: [
        {
          id: "algebra-balance-two-practice-accepts-near-value",
          triggerAnswers: ["yes"],
          description: "The learner accepted a candidate without comparing the evaluated side to 17.",
          remediationFocus: "Complete the substitution and require the two final values to match exactly.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-two-practice-05",
      concept: "algebra-balance-equivalent-solution-paths",
      prompt:
        "For 3(x + 2) = 21, what is x? You may divide by 3 first or distribute first.",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution: "Dividing first gives x + 2 = 7, then x = 5. Distributing gives 3x + 6 = 21, then 3x = 15 and x = 5.",
      misconceptions: [
        {
          id: "algebra-balance-two-practice-ignores-grouping",
          triggerAnswers: ["19/3", "6.3333333333"],
          description: "The learner treated the equation as 3x + 2 = 21, ignoring that 3 multiplies the whole group.",
          remediationFocus: "Keep the grouped x + 2 together when dividing, or distribute 3 to both terms.",
        },
      ],
      hints: [],
    },
    {
      id: "algebra-balance-two-practice-06",
      concept: "algebra-balance-context-modeling",
      prompt:
        "A game rental charges a fixed 4-credit fee plus 3 credits per round. The total is 25 credits. How many rounds were played?",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution: "Model 3r + 4 = 25. Subtract 4: 3r = 21. Divide by 3: r = 7 rounds.",
      misconceptions: [
        {
          id: "algebra-balance-two-practice-divides-before-fee",
          triggerAnswers: ["25/3", "8.3333333333"],
          description: "The learner divided the total before removing the fixed fee.",
          remediationFocus: "Remove the one-time fee, then split the remaining credits into groups of 3.",
        },
        {
          id: "algebra-balance-two-practice-counts-fee-as-round",
          triggerAnswers: ["6"],
          description: "The learner subtracted both 4 and 3 as standalone amounts before dividing or counting.",
          remediationFocus: "Distinguish the fixed 4 credits from the rate of 3 credits for each round.",
        },
      ],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
