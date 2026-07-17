import type { Lesson } from "../types";

const lesson = {
  id: "logarithmic-reasoning-and-transfer",
  title: "Reason About Repeated Halving",
  track: "Computer Science",
  description:
    "For learners ages 14+ who can trace binary search: count candidate reductions, compare growth carefully, and transfer the invariant to a new sorted search.",
  concepts: [
    "search-halving-candidate-count",
    "search-halving-logarithmic-growth",
    "search-halving-linear-comparison",
    "search-halving-near-transfer",
  ],
  steps: [
    {
      id: "sh-log-step-one-halving",
      concept: "search-halving-candidate-count",
      prompt: "A sorted search starts with 64 candidate positions. After one unsuccessful middle comparison and a valid update, at most how many candidates remain?",
      answer: { kind: "numeric", value: 32, tolerance: 0 },
      solution: "A valid middle comparison discards the midpoint and one side. A conservative upper bound is half of 64, so at most 32 candidates remain.",
      misconceptions: [
        {
          id: "sh-log-subtracts-one-only",
          triggerAnswers: ["63"],
          description: "The learner removed only the checked item and ignored the ordered half that was also disproved.",
          remediationFocus: "Sorted order lets one comparison dismiss an entire side, not just the midpoint.",
        },
        {
          id: "sh-log-divides-by-four",
          triggerAnswers: ["16"],
          description: "The learner reduced the candidates by more than one halving step guarantees.",
          remediationFocus: "One comparison chooses between two halves; it does not perform two halvings at once.",
        },
      ],
      hints: ["One valid update keeps no more than one half.", "Divide the candidate count by 2 once."],
    },
    {
      id: "sh-log-step-three-halvings",
      concept: "search-halving-candidate-count",
      prompt: "Starting from 64 candidates, what is the maximum candidate count after three unsuccessful halving updates?",
      answer: { kind: "numeric", value: 8, tolerance: 0 },
      solution: "The upper-bound sequence is 64 → 32 → 16 → 8. Three halvings leave at most 8 candidates.",
      misconceptions: [
        {
          id: "sh-log-halves-once-for-three",
          triggerAnswers: ["32"],
          description: "The learner applied only one of the three requested halvings.",
          remediationFocus: "Record one candidate count after each unsuccessful update.",
        },
        {
          id: "sh-log-subtracts-three",
          triggerAnswers: ["61"],
          description: "The learner modeled the process as removing one candidate per comparison.",
          remediationFocus: "Each ordered comparison removes about half of the current candidates.",
        },
      ],
      hints: ["Write a three-arrow sequence beginning at 64.", "Halve the current count at each arrow, not the original count only once."],
    },
    {
      id: "sh-log-step-halvings-to-one",
      concept: "search-halving-logarithmic-growth",
      prompt: "How many halvings reduce 128 candidates to at most 1 candidate?",
      answer: { kind: "numeric", value: 7, tolerance: 0 },
      solution: "128 → 64 → 32 → 16 → 8 → 4 → 2 → 1, which contains seven halving operations. Equivalently, 128 = 2^7.",
      misconceptions: [
        {
          id: "sh-log-counts-sequence-values",
          triggerAnswers: ["8"],
          description: "The learner counted the starting value as an operation.",
          remediationFocus: "Count arrows or divisions, not the number of values written in the sequence.",
        },
        {
          id: "sh-log-confuses-half-with-exponent",
          triggerAnswers: ["64"],
          description: "The learner reported the result of one halving rather than the number of halvings.",
          remediationFocus: "The question asks for an operation count; find the exponent in 2^k = 128.",
        },
      ],
      hints: ["Build a chain by dividing by 2 until you reach 1.", "Count the arrows in that chain."],
    },
    {
      id: "sh-log-step-linear-vs-binary",
      concept: "search-halving-linear-comparison",
      prompt: "Which statement is justified when comparing search growth on suitable inputs?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Binary search always takes exactly one millisecond",
          "Linear search grows with the item count, while binary search comparison count grows with the number of halvings",
          "Binary search is valid on every unsorted array",
          "Asymptotic notation proves an exact timing speedup on every device",
        ],
        correctIndex: 1,
      },
      solution: "The justified claim concerns growth in comparison counts under their respective assumptions. Exact elapsed time also depends on implementation, data access, hardware, and input size, so asymptotic reasoning alone does not establish seconds or a universal speedup.",
      misconceptions: [
        {
          id: "sh-log-invents-exact-time",
          triggerAnswers: ["Binary search always takes exactly one millisecond", "0"],
          description: "The learner converted a growth-rate statement into an exact elapsed time.",
          remediationFocus: "Keep comparison growth separate from measured wall-clock time.",
        },
        {
          id: "sh-log-infers-universal-speedup",
          triggerAnswers: ["Asymptotic notation proves an exact timing speedup on every device", "3"],
          description: "The learner treated asymptotic analysis as a universal benchmark result.",
          remediationFocus: "Asymptotic classes describe how work grows; exact performance requires measurement and context.",
        },
        {
          id: "sh-log-forgets-sorted-precondition",
          triggerAnswers: ["Binary search is valid on every unsorted array", "2"],
          description: "The learner generalized binary search beyond its ordering precondition.",
          remediationFocus: "The halving guarantee depends on an order that makes a whole side dismissible.",
        },
      ],
      hints: ["Look for a statement about growth, not seconds.", "Check whether the statement preserves the sorted-input condition and avoids hardware claims."],
    },
  ],
  practice: [
    {
      id: "sh-log-practice-twenty-once",
      concept: "search-halving-candidate-count",
      prompt: "A valid binary search has 20 candidates. After one unsuccessful update, at most how many remain?",
      answer: { kind: "numeric", value: 10, tolerance: 0 },
      solution: "One update keeps at most one of two halves, so at most 10 of 20 candidates remain.",
      misconceptions: [
        {
          id: "sh-log-twenty-removes-one",
          triggerAnswers: ["19"],
          description: "The learner removed only the midpoint.",
          remediationFocus: "The comparison and sorted order eliminate one complete side as well as the midpoint.",
        },
      ],
      hints: ["Keep at most half.", "Divide 20 by 2 once."],
    },
    {
      id: "sh-log-practice-twenty-twice",
      concept: "search-halving-candidate-count",
      prompt: "Starting with 20 candidates, at most how many remain after two unsuccessful halving updates?",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution: "The conservative count sequence is 20 → 10 → 5, so at most 5 remain.",
      misconceptions: [
        {
          id: "sh-log-twenty-halves-once",
          triggerAnswers: ["10"],
          description: "The learner stopped after one of two updates.",
          remediationFocus: "Apply the second halving to the remaining 10 candidates.",
        },
        {
          id: "sh-log-twenty-subtracts-two",
          triggerAnswers: ["18"],
          description: "The learner subtracted one candidate per update.",
          remediationFocus: "Track the candidate interval, which shrinks by about half each time.",
        },
      ],
      hints: ["Write one count after each update.", "First halve 20, then halve the result."],
    },
    {
      id: "sh-log-practice-fifty-to-one",
      concept: "search-halving-logarithmic-growth",
      prompt: "What is the smallest number of halvings needed to reduce 50 candidates to at most 1?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution: "Using upper bounds and rounding up when needed: 50 → 25 → 13 → 7 → 4 → 2 → 1. That is six halvings; five can still leave 2 candidates.",
      misconceptions: [
        {
          id: "sh-log-rounds-halving-count-down",
          triggerAnswers: ["5"],
          description: "The learner rounded down even though candidates would remain.",
          remediationFocus: "For a guarantee, round remaining candidate counts up and continue until the bound reaches 1.",
        },
        {
          id: "sh-log-fifty-one-step",
          triggerAnswers: ["25"],
          description: "The learner supplied the remaining count after one halving instead of the number of halvings.",
          remediationFocus: "Distinguish the requested operation count from an intermediate candidate count.",
        },
      ],
      hints: ["Halve repeatedly, rounding a fractional candidate count upward for an upper bound.", "Check whether five halvings guarantee only one candidate."],
    },
    {
      id: "sh-log-practice-no-timing-claim",
      concept: "search-halving-linear-comparison",
      prompt: "From O(n) versus O(log n) alone, which claim can you make?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Binary search will save exactly 2 seconds",
          "Binary search uses fewer comparisons for every possible tiny input",
          "Their comparison counts grow at different rates as n increases, under the algorithms' assumptions",
        ],
        correctIndex: 2,
      },
      solution: "Big-O supports a growth-rate statement under stated assumptions. It does not provide exact seconds or guarantee a strict comparison advantage for every small case.",
      misconceptions: [
        {
          id: "sh-log-practice-exact-seconds",
          triggerAnswers: ["Binary search will save exactly 2 seconds", "0"],
          description: "The learner inferred a measured duration from asymptotic notation.",
          remediationFocus: "Exact timing needs a specified implementation, environment, inputs, and measurement.",
        },
        {
          id: "sh-log-practice-every-small-input",
          triggerAnswers: ["Binary search uses fewer comparisons for every possible tiny input", "1"],
          description: "The learner turned a long-run growth comparison into an every-input guarantee.",
          remediationFocus: "Asymptotic growth does not assert strict superiority for every small input instance.",
        },
      ],
      hints: ["Big-O describes growth, not a stopwatch reading.", "Choose the statement that includes assumptions and increasing input size."],
    },
    {
      id: "sh-log-practice-transfer-trace",
      concept: "search-halving-near-transfer",
      prompt: "A catalog's sorted page starts are [1, 12, 24, 39, 55, 73, 94]. To locate page 70, first compare with start 39 at index 3. Which inclusive low,high bounds should be searched next?",
      answer: { kind: "expression", acceptedForms: ["4,6", "(4,6)", "[4,6]"] },
      solution: "Page 70 comes after start 39, so indices 0 through 3 cannot be the greatest page start at or below 70. The remaining candidate starts are at indices 4 through 6.",
      misconceptions: [
        {
          id: "sh-log-transfer-keeps-mid",
          triggerAnswers: ["3,6", "(3,6)", "[3,6]"],
          description: "The learner reused the middle start after proving the desired later section must be to its right.",
          remediationFocus: "Translate the familiar strict-update rule to the catalog context: low becomes mid plus one.",
        },
        {
          id: "sh-log-transfer-wrong-side",
          triggerAnswers: ["0,2", "(0,2)", "[0,2]"],
          description: "The learner searched earlier page starts for a later page.",
          remediationFocus: "Use the sorted meaning of page starts: values greater than 39 occur to the right.",
        },
      ],
      hints: ["Compare page 70 with start 39.", "Move strictly past index 3 while keeping the original high bound."],
    },
  ],
} satisfies Lesson;

export default lesson;
