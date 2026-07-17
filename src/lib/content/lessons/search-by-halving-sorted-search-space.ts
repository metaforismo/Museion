import type { Lesson } from "../types";

const lesson = {
  id: "sorted-search-space",
  title: "Prepare a Search Space",
  track: "Computer Science",
  description:
    "For learners ages 14+ who can read arrays: decide when halving is valid, predict the useful side, and set inclusive boundaries.",
  concepts: [
    "search-halving-sorted-precondition",
    "search-halving-side-prediction",
    "search-halving-inclusive-boundaries",
    "search-halving-duplicate-contract",
  ],
  steps: [
    {
      id: "sh-space-step-sorted-input",
      concept: "search-halving-sorted-precondition",
      prompt:
        "Which array is ready for binary search for the value 12, without rearranging it first?",
      answer: {
        kind: "multipleChoice",
        options: ["[2, 6, 9, 12, 18]", "[2, 12, 6, 9, 18]", "[18, 12, 9, 6, 2]"],
        correctIndex: 0,
      },
      solution:
        "[2, 6, 9, 12, 18] is ordered from least to greatest, which is the ordering assumed in this course. Comparing a target with a middle value then justifies discarding one side. The other arrays do not follow that order.",
      misconceptions: [
        {
          id: "sh-space-target-visible-means-ready",
          triggerAnswers: ["[2, 12, 6, 9, 18]", "1"],
          description:
            "The learner chose an array because the target is easy to see, even though the values are not sorted.",
          remediationFocus:
            "Check the ordering of every neighboring pair; target visibility does not make a halving decision valid.",
        },
        {
          id: "sh-space-descending-without-contract",
          triggerAnswers: ["[18, 12, 9, 6, 2]", "2"],
          description:
            "The learner treated descending order as compatible with the course's increasing-order comparison rules.",
          remediationFocus:
            "An algorithm needs a stated ordering contract. These lessons use least-to-greatest order and matching update rules.",
        },
      ],
      hints: [
        "Binary search needs an order that makes one whole side safely dismissible.",
        "Read each array from left to right and check whether every next value is at least the previous value.",
      ],
    },
    {
      id: "sh-space-step-predict-side",
      concept: "search-halving-side-prediction",
      prompt:
        "In [3, 7, 11, 15, 19, 23, 27], the middle value is 15 and the target is 19. Where can the target still be?",
      answer: {
        kind: "multipleChoice",
        options: ["Only left of 15", "At 15", "Only right of 15", "On either side"],
        correctIndex: 2,
      },
      solution:
        "The array increases from left to right. Since 19 is greater than 15, every value at or left of the middle is too small, so only the positions right of 15 can still contain 19.",
      misconceptions: [
        {
          id: "sh-space-reverses-comparison-direction",
          triggerAnswers: ["Only left of 15", "0"],
          description:
            "The learner moved toward smaller values even though the target is greater than the middle value.",
          remediationFocus:
            "Connect array direction to value direction: in increasing order, larger values are to the right.",
        },
        {
          id: "sh-space-keeps-disproved-half",
          triggerAnswers: ["On either side", "3"],
          description:
            "The learner did not use sorted order to rule out a complete half.",
          remediationFocus:
            "State what sorted order proves about every value on the left before choosing the remaining side.",
        },
      ],
      hints: [
        "Compare the target with 15 before thinking about indices.",
        "In an increasing array, which direction contains values greater than 15?",
      ],
    },
    {
      id: "sh-space-step-inclusive-bounds",
      concept: "search-halving-inclusive-boundaries",
      prompt:
        "For the six-item array [4, 8, 12, 16, 20, 24], this course uses inclusive low and high indices. Enter the initial bounds as low,high.",
      answer: { kind: "expression", acceptedForms: ["0,5", "(0,5)", "[0,5]"] },
      solution:
        "Array indices start at 0, so the first index is 0 and the sixth item's index is 5. Inclusive bounds therefore begin at low = 0 and high = 5.",
      misconceptions: [
        {
          id: "sh-space-high-equals-length",
          triggerAnswers: ["0,6", "(0,6)", "[0,6]"],
          description:
            "The learner used the array length as the last valid index.",
          remediationFocus:
            "For zero-based indexing, the last valid index is length minus one.",
        },
        {
          id: "sh-space-one-based-low",
          triggerAnswers: ["1,6", "(1,6)", "[1,6]"],
          description:
            "The learner numbered positions from 1 rather than using zero-based indices.",
          remediationFocus:
            "Label the first array item with index 0, then count through the final item.",
        },
      ],
      hints: [
        "Write the index under the first and last item.",
        "The first index is 0; the last index is one less than the number of items.",
      ],
    },
    {
      id: "sh-space-step-invalid-use",
      concept: "search-halving-sorted-precondition",
      prompt:
        "A learner searches [2, 9, 4, 12, 15] for 4. They compare with the middle value 4. What is the sound conclusion about using binary-search discard rules on this array?",
      answer: {
        kind: "multipleChoice",
        options: [
          "The discard rules are justified because 4 was found",
          "The discard rules are not justified because the array is not sorted",
          "The entire left side is always safe to discard",
        ],
        correctIndex: 1,
      },
      solution:
        "The lucky first comparison finds this target, but the array violates the sorted-input precondition. That coincidence does not make the discard rules valid for this array or for other targets.",
      misconceptions: [
        {
          id: "sh-space-lucky-hit-validates-method",
          triggerAnswers: ["The discard rules are justified because 4 was found", "0"],
          description:
            "The learner used one lucky result as evidence that the method's precondition holds.",
          remediationFocus:
            "Separate an observed result from the guarantee: a correct first guess does not establish sorted order.",
        },
        {
          id: "sh-space-unconditional-left-discard",
          triggerAnswers: ["The entire left side is always safe to discard", "2"],
          description:
            "The learner applied a discard direction without a valid ordering comparison.",
          remediationFocus:
            "A side is discarded only after sorted order and the target-to-middle comparison justify it.",
        },
      ],
      hints: [
        "Ask whether the method would still be reliable for a different target in the same array.",
        "Check the neighboring values 9 and 4 against the increasing-order contract.",
      ],
    },
    {
      id: "sh-space-step-duplicates",
      concept: "search-halving-duplicate-contract",
      prompt:
        "The sorted array [2, 5, 5, 5, 9] contains three copies of 5. What may a basic binary search that promises only 'find an occurrence' return?",
      answer: {
        kind: "multipleChoice",
        options: ["Only index 1", "Only index 3", "Any of indices 1, 2, or 3", "It must report absent"],
        correctIndex: 2,
      },
      solution:
        "Indices 1, 2, and 3 all satisfy the stated contract because each stores 5. Finding the first or last duplicate requires an additional boundary rule; it is not implied by basic binary search.",
      misconceptions: [
        {
          id: "sh-space-assumes-leftmost-contract",
          triggerAnswers: ["Only index 1", "0"],
          description:
            "The learner assumed the algorithm must return the first duplicate even though that contract was not stated.",
          remediationFocus:
            "Distinguish finding any occurrence from finding the leftmost occurrence; the latter needs extra rules.",
        },
        {
          id: "sh-space-duplicates-treated-absent",
          triggerAnswers: ["It must report absent", "3"],
          description:
            "The learner thought duplicate values make a sorted search invalid.",
          remediationFocus:
            "Nondecreasing order allows equal neighbors; duplicates change which matching index may be returned, not whether searching is possible.",
        },
      ],
      hints: [
        "Look at the exact promise: it says an occurrence, not the first occurrence.",
        "List every index whose stored value equals 5.",
      ],
    },
  ],
  practice: [
    {
      id: "sh-space-practice-empty",
      concept: "search-halving-inclusive-boundaries",
      prompt: "How many candidate positions are in the empty array []?",
      answer: { kind: "numeric", value: 0, tolerance: 0 },
      solution: "An empty array has no valid indices, so its candidate interval contains 0 positions.",
      misconceptions: [
        {
          id: "sh-space-empty-has-one-slot",
          triggerAnswers: ["1"],
          description: "The learner counted the empty container itself as a candidate position.",
          remediationFocus: "Candidates are valid item positions; an empty array contains none.",
        },
      ],
      hints: ["Candidates must point to actual items.", "Count the items between the brackets."],
    },
    {
      id: "sh-space-practice-singleton",
      concept: "search-halving-inclusive-boundaries",
      prompt: "For the one-item array [8], enter the inclusive initial bounds as low,high.",
      answer: { kind: "expression", acceptedForms: ["0,0", "(0,0)", "[0,0]"] },
      solution: "The only item has index 0, so both inclusive boundaries point to index 0.",
      misconceptions: [
        {
          id: "sh-space-singleton-high-one",
          triggerAnswers: ["0,1", "(0,1)", "[0,1]"],
          description: "The learner used length rather than length minus one for the inclusive high bound.",
          remediationFocus: "A one-item zero-based array begins and ends at index 0.",
        },
      ],
      hints: ["Write the index of the only item.", "Both boundaries include that same position."],
    },
    {
      id: "sh-space-practice-lower-boundary",
      concept: "search-halving-side-prediction",
      prompt: "In [1, 4, 7, 10, 13], the middle value is 7 and the target is the boundary value 1. Which region remains possible?",
      answer: {
        kind: "multipleChoice",
        options: ["Indices left of the middle", "Indices right of the middle", "No indices"],
        correctIndex: 0,
      },
      solution: "Because 1 is less than 7 in an increasing array, only indices left of the middle can contain it.",
      misconceptions: [
        {
          id: "sh-space-boundary-reverses-side",
          triggerAnswers: ["Indices right of the middle", "1"],
          description: "The learner moved right for a target smaller than the middle value.",
          remediationFocus: "Smaller values lie to the left in the stated increasing order.",
        },
        {
          id: "sh-space-boundary-discarded",
          triggerAnswers: ["No indices", "2"],
          description: "The learner discarded the boundary even though it remains a valid candidate.",
          remediationFocus: "A comparison with the middle removes the middle and one side, not every other index.",
        },
      ],
      hints: ["Compare 1 with 7.", "In increasing order, where are values below 7?"],
    },
    {
      id: "sh-space-practice-absent-prediction",
      concept: "search-halving-side-prediction",
      prompt: "In [4, 8, 12, 16, 20], the middle value is 12 and the target is 14. Which side must be checked next, even though 14 is absent?",
      answer: {
        kind: "multipleChoice",
        options: ["Left", "Right", "Both", "Neither, absence is already proved"],
        correctIndex: 1,
      },
      solution: "Since 14 is greater than 12, only the right side can still contain it. Absence is proved only after that candidate interval is exhausted.",
      misconceptions: [
        {
          id: "sh-space-absent-guessed-early",
          triggerAnswers: ["Neither, absence is already proved", "3"],
          description: "The learner concluded absence after one unequal comparison.",
          remediationFocus: "An unequal middle value removes only the disproved region; continue until no candidate remains.",
        },
        {
          id: "sh-space-absent-keeps-both",
          triggerAnswers: ["Both", "2"],
          description: "The learner kept the side whose values are all too small.",
          remediationFocus: "Use sorted order to eliminate every value at or left of 12.",
        },
      ],
      hints: ["Absence is not known yet; compare 14 with 12.", "Which side contains values greater than 12?"],
    },
    {
      id: "sh-space-practice-order-audit",
      concept: "search-halving-sorted-precondition",
      prompt: "Which neighboring pair proves that [1, 5, 9, 7, 12] violates increasing order?",
      answer: { kind: "expression", acceptedForms: ["9,7", "(9,7)", "[9,7]", "9>7"] },
      solution: "The sequence drops from 9 to 7, so the neighboring pair 9, 7 violates nondecreasing order.",
      misconceptions: [
        {
          id: "sh-space-audits-target-not-order",
          triggerAnswers: ["7,12", "(7,12)", "[7,12]"],
          description: "The learner selected a neighboring pair that is correctly ordered.",
          remediationFocus: "Find the exact place where a later value is smaller than the value immediately before it.",
        },
      ],
      hints: ["Compare each item with the next item.", "Look for the only left-to-right decrease."],
    },
  ],
} satisfies Lesson;

export default lesson;
