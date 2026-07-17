import type { Lesson } from "../types";

const lesson = {
  id: "binary-search-invariant",
  title: "Keep the Target in the Interval",
  track: "Computer Science",
  description:
    "For learners ages 14+ who understand sorted arrays and zero-based indices: trace inclusive binary search without losing a possible target.",
  concepts: [
    "search-halving-candidate-invariant",
    "search-halving-deterministic-midpoint",
    "search-halving-strict-update",
    "search-halving-termination",
  ],
  steps: [
    {
      id: "sh-invariant-step-initialize",
      concept: "search-halving-candidate-invariant",
      prompt:
        "We search [2, 5, 8, 12, 16, 23, 38, 56, 72] for 56. With inclusive bounds, enter the initial low,high indices.",
      answer: { kind: "expression", acceptedForms: ["0,8", "(0,8)", "[0,8]"] },
      solution:
        "There are nine items at indices 0 through 8. The initial candidate interval includes every index, so low = 0 and high = 8.",
      misconceptions: [
        {
          id: "sh-invariant-initial-high-length",
          triggerAnswers: ["0,9", "(0,9)", "[0,9]"],
          description: "The learner used the item count as an inclusive index.",
          remediationFocus: "For inclusive zero-based bounds, initialize high to length minus one.",
        },
        {
          id: "sh-invariant-skips-boundaries",
          triggerAnswers: ["1,7", "(1,7)", "[1,7]"],
          description: "The learner excluded both boundary positions before making any comparison.",
          remediationFocus: "The invariant initially keeps every position that could contain the target, including both ends.",
        },
      ],
      hints: ["Label the first and last indices.", "The initial candidate interval covers the whole array."],
    },
    {
      id: "sh-invariant-step-first-mid",
      concept: "search-halving-deterministic-midpoint",
      prompt: "For low = 0 and high = 8, use mid = low + floor((high - low) / 2). What is mid?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution: "mid = 0 + floor((8 - 0) / 2) = floor(4) = 4.",
      misconceptions: [
        {
          id: "sh-invariant-mid-count-not-index",
          triggerAnswers: ["5"],
          description: "The learner counted the fifth item but reported its one-based position rather than index 4.",
          remediationFocus: "Compute with the low and high indices, then report the zero-based index.",
        },
        {
          id: "sh-invariant-mid-rounds-up",
          triggerAnswers: ["4.5"],
          description: "The learner averaged endpoints but did not apply the required floor operation.",
          remediationFocus: "An array index must be an integer; this course deterministically floors the half-distance.",
        },
      ],
      hints: ["First compute high - low.", "Divide that distance by 2, floor it, then add low."],
    },
    {
      id: "sh-invariant-step-discard-small",
      concept: "search-halving-strict-update",
      prompt:
        "At mid = 4 the value is 16, which is less than target 56. Enter the next inclusive low,high bounds.",
      answer: { kind: "expression", acceptedForms: ["5,8", "(5,8)", "[5,8]"] },
      solution:
        "Sorted order proves indices 0 through 4 are too small. Moving strictly past the disproved midpoint gives low = mid + 1 = 5 while high remains 8.",
      misconceptions: [
        {
          id: "sh-invariant-reuses-small-mid",
          triggerAnswers: ["4,8", "(4,8)", "[4,8]"],
          description: "The learner kept the midpoint even though its value was proved too small.",
          remediationFocus: "A disproved midpoint cannot remain a candidate; update low to mid plus one.",
        },
        {
          id: "sh-invariant-discards-target-side-small",
          triggerAnswers: ["0,3", "(0,3)", "[0,3]"],
          description: "The learner kept the smaller half when the target is greater than the middle value.",
          remediationFocus: "Preserve the invariant by keeping only values greater than 16, which lie to the right.",
        },
      ],
      hints: ["Which indices are now proved too small?", "Move low strictly beyond mid; high does not change."],
    },
    {
      id: "sh-invariant-step-second-update",
      concept: "search-halving-strict-update",
      prompt:
        "Now low = 5 and high = 8, so mid = 6 and the middle value is 38. It is still below 56. Enter the next low,high bounds.",
      answer: { kind: "expression", acceptedForms: ["7,8", "(7,8)", "[7,8]"] },
      solution:
        "The midpoint and all smaller indices are disproved. Set low = 6 + 1 = 7 and keep high = 8. The target at index 7 remains inside the candidate interval.",
      misconceptions: [
        {
          id: "sh-invariant-reuses-second-mid",
          triggerAnswers: ["6,8", "(6,8)", "[6,8]"],
          description: "The learner again reused a midpoint known to be too small.",
          remediationFocus: "Every unsuccessful update must remove the midpoint so the interval strictly shrinks.",
        },
        {
          id: "sh-invariant-oversteps-candidate",
          triggerAnswers: ["8,8", "(8,8)", "[8,8]"],
          description: "The learner advanced two positions and discarded index 7 without evidence.",
          remediationFocus: "Discard only positions proved too small; the next index after mid remains possible.",
        },
      ],
      hints: ["The value at index 6 is disproved, but index 7 has not been checked.", "Use low = mid + 1."],
    },
    {
      id: "sh-invariant-step-found",
      concept: "search-halving-candidate-invariant",
      prompt: "With low = 7 and high = 8, the deterministic mid is 7. What index is returned when its value is 56?",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution: "The value at index 7 equals the target, so the search returns index 7 immediately.",
      misconceptions: [
        {
          id: "sh-invariant-returns-value-not-index",
          triggerAnswers: ["56"],
          description: "The learner returned the matching value rather than its requested index.",
          remediationFocus: "Read the output contract: the search returns where the match occurs, not the target itself.",
        },
        {
          id: "sh-invariant-one-based-result",
          triggerAnswers: ["8"],
          description: "The learner reported the eighth position using one-based counting.",
          remediationFocus: "Keep the zero-based labels used throughout the trace.",
        },
      ],
      hints: ["Check whether the middle value equals the target.", "Return the zero-based index attached to that value."],
    },
  ],
  practice: [
    {
      id: "sh-invariant-practice-too-large",
      concept: "search-halving-strict-update",
      prompt: "With low = 2, high = 8, and mid = 5, the middle value is greater than the target. Enter the next low,high bounds.",
      answer: { kind: "expression", acceptedForms: ["2,4", "(2,4)", "[2,4]"] },
      solution: "The midpoint is too large, so high moves strictly left to mid - 1 = 4; low remains 2.",
      misconceptions: [
        {
          id: "sh-invariant-reuses-large-mid",
          triggerAnswers: ["2,5", "(2,5)", "[2,5]"],
          description: "The learner kept a midpoint known to be too large.",
          remediationFocus: "Set high to mid minus one so the disproved index leaves the interval.",
        },
        {
          id: "sh-invariant-wrong-half-large",
          triggerAnswers: ["6,8", "(6,8)", "[6,8]"],
          description: "The learner kept larger values even though the target is smaller than the midpoint value.",
          remediationFocus: "In increasing order, a smaller target can only remain to the left.",
        },
      ],
      hints: ["A too-large middle rules out that index and everything to its right.", "Move high to one less than mid."],
    },
    {
      id: "sh-invariant-practice-absent-first",
      concept: "search-halving-strict-update",
      prompt: "Search [1, 4, 7, 10, 13] for 8. The first mid is index 2 with value 7. Enter the next low,high bounds.",
      answer: { kind: "expression", acceptedForms: ["3,4", "(3,4)", "[3,4]"] },
      solution: "Since 8 is greater than 7, indices 0 through 2 are too small. The next bounds are 3,4.",
      misconceptions: [
        {
          id: "sh-invariant-absent-reuses-mid",
          triggerAnswers: ["2,4", "(2,4)", "[2,4]"],
          description: "The learner kept the unequal midpoint in the interval.",
          remediationFocus: "Even when the target is absent, each disproved midpoint must be removed.",
        },
        {
          id: "sh-invariant-absent-guessed-before-empty",
          triggerAnswers: ["absent", "notfound", "not found"],
          description: "The learner declared absence while unchecked candidates remain.",
          remediationFocus: "Absence follows from an empty candidate interval, not merely from an unequal first comparison.",
        },
      ],
      hints: ["Compare 8 with 7.", "Keep the side with values greater than 7 and move past mid."],
    },
    {
      id: "sh-invariant-practice-absent-finish",
      concept: "search-halving-termination",
      prompt: "Continuing the search for 8: low = 3, high = 4, mid = 3, and value 10 is too large. Enter the next low,high bounds.",
      answer: { kind: "expression", acceptedForms: ["3,2", "(3,2)", "[3,2]"] },
      solution: "Move high to mid - 1 = 2 while low stays 3. Because low is now greater than high, the candidate interval is empty and 8 is absent.",
      misconceptions: [
        {
          id: "sh-invariant-absent-keeps-large-mid",
          triggerAnswers: ["3,3", "(3,3)", "[3,3]"],
          description: "The learner kept index 3 after proving its value too large.",
          remediationFocus: "A too-large midpoint requires high = mid - 1, even when this crosses low.",
        },
        {
          id: "sh-invariant-forces-valid-looking-order",
          triggerAnswers: ["2,3", "(2,3)", "[2,3]"],
          description: "The learner rearranged the bounds to keep low no greater than high.",
          remediationFocus: "Crossed bounds are the intended empty-interval signal; do not reorder them.",
        },
      ],
      hints: ["The value at mid is too large, so update high.", "Use high = mid - 1 and allow the bounds to cross."],
    },
    {
      id: "sh-invariant-practice-empty-init",
      concept: "search-halving-termination",
      prompt: "For an empty array, low starts at 0 and high is length - 1. Enter low,high.",
      answer: { kind: "expression", acceptedForms: ["0,-1", "(0,-1)", "[0,-1]"] },
      solution: "The length is 0, so high = 0 - 1 = -1. Since low > high immediately, no array access is attempted.",
      misconceptions: [
        {
          id: "sh-invariant-empty-index-zero",
          triggerAnswers: ["0,0", "(0,0)", "[0,0]"],
          description: "The learner invented index 0 for an array with no items.",
          remediationFocus: "An empty array has no valid index; high = length - 1 gives the empty interval directly.",
        },
      ],
      hints: ["Substitute length = 0 into high = length - 1.", "Crossed bounds represent no candidates."],
    },
    {
      id: "sh-invariant-practice-first-boundary",
      concept: "search-halving-strict-update",
      prompt: "Search [3, 6, 9, 12] for boundary target 3. First mid = 1 with value 6. Enter the next low,high bounds.",
      answer: { kind: "expression", acceptedForms: ["0,0", "(0,0)", "[0,0]"] },
      solution: "The target is smaller than 6, so high becomes mid - 1 = 0 and low stays 0. The boundary index remains a candidate.",
      misconceptions: [
        {
          id: "sh-invariant-discards-low-boundary",
          triggerAnswers: ["1,0", "(1,0)", "[1,0]"],
          description: "The learner moved low and accidentally discarded the possible first index.",
          remediationFocus: "When the midpoint is too large, low does not move; preserve the left boundary.",
        },
        {
          id: "sh-invariant-keeps-large-boundary-mid",
          triggerAnswers: ["0,1", "(0,1)", "[0,1]"],
          description: "The learner kept the disproved midpoint alongside the boundary target.",
          remediationFocus: "Move high strictly before the too-large midpoint.",
        },
      ],
      hints: ["The target is smaller than the value at mid.", "Keep low and set high to mid - 1."],
    },
  ],
} satisfies Lesson;

export default lesson;
