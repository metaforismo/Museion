import type { Lesson } from "../types";

const lesson = {
  id: "recursion-tracing",
  title: "Tracing the Call Stack",
  track: "Computer Science",
  description:
    "For learners ages 14+ who understand base case and progress: hand-trace a recursive function's return value, see when work happens on the way down versus the way back up, and count stack depth precisely.",
  concepts: [
    "recursion-unwind-order",
    "recursion-trace-result",
    "recursion-stack-depth",
    "recursion-base-case-off-by-one",
  ],
  steps: [
    {
      id: "rec-trace-step-unwind-order",
      concept: "recursion-unwind-order",
      prompt:
        "sumToN(n) is defined as: return 0 if n == 0, else return n + sumToN(n - 1). When does the addition n + sumToN(n - 1) actually get carried out?",
      answer: {
        kind: "multipleChoice",
        options: [
          "immediately, on the way down, as soon as sumToN(n - 1) is called",
          "only after sumToN(n - 1) returns its result — the addition happens on the way back up, as each call unwinds",
          "all at once, before any of the calls are made",
          "only once, in the very last call to return",
        ],
        correctIndex: 1,
      },
      solution:
        "The expression n + sumToN(n - 1) cannot be completed until sumToN(n - 1) has actually produced a value — you cannot add to a result you don't have yet. So each call makes its recursive call first, waits, and only performs its own addition once that call returns. The additions happen one at a time, from the base case back up to the original call, not while the calls are still going down.",
      misconceptions: [
        {
          id: "rec-trace-adds-on-way-down",
          triggerAnswers: [
            "immediately, on the way down, as soon as sumToN(n - 1) is called",
            "0",
          ],
          description:
            "The learner believed the addition executes as soon as the recursive call is issued, before the base case is even reached.",
          remediationFocus:
            "An addition needs both of its operands; sumToN(n - 1) has no value until it returns, so the addition must wait for that return.",
        },
        {
          id: "rec-trace-precomputed-batch",
          triggerAnswers: ["all at once, before any of the calls are made", "2"],
          description:
            "The learner imagined all the additions happening together before any recursive call runs.",
          remediationFocus:
            "Each call must first obtain a smaller result via its own recursive call before it can perform its addition; nothing is computed in a batch beforehand.",
        },
        {
          id: "rec-trace-single-final-addition",
          triggerAnswers: ["only once, in the very last call to return", "3"],
          description:
            "The learner believed only the outermost call performs an addition, as if intermediate calls contribute nothing.",
          remediationFocus:
            "Every call with n > 0 performs its own addition, once its own recursive call returns — not just the first call.",
        },
      ],
      hints: [
        "An addition needs both of its values before it can happen — does sumToN(n - 1) have a value the moment it's called?",
        "Think about which call finishes its addition first: the outermost one, or the one closest to the base case?",
      ],
    },
    {
      id: "rec-trace-step-result",
      concept: "recursion-trace-result",
      prompt:
        "Trace sumToN(4), where sumToN(n) = 0 if n == 0 else n + sumToN(n - 1). What value does sumToN(4) return?",
      answer: { kind: "numeric", value: 10, tolerance: 0 },
      solution:
        "sumToN(4) = 4 + sumToN(3) = 4 + (3 + sumToN(2)) = 4 + 3 + (2 + sumToN(1)) = 4 + 3 + 2 + (1 + sumToN(0)) = 4 + 3 + 2 + 1 + 0 = 10.",
      misconceptions: [
        {
          id: "rec-trace-multiplies-instead",
          triggerAnswers: ["24"],
          description:
            "The learner multiplied the numbers together (as in a factorial trace) instead of adding them, as this function's recursive case defines.",
          remediationFocus:
            "Reread the recursive case: it returns n + sumToN(n - 1). It adds; it does not multiply.",
        },
        {
          id: "rec-trace-drops-top-level",
          triggerAnswers: ["6"],
          description:
            "The learner's trace effectively started at sumToN(3), dropping the top-level 4 from the sum.",
          remediationFocus:
            "The call being evaluated is sumToN(4); its own addition must include 4. Retrace starting from the original call, not one level in.",
        },
      ],
      hints: [
        "Write out the chain of additions from sumToN(4) down to sumToN(0), then add them from the bottom up.",
        "Every level from 4 down to 0 contributes its own value to the sum.",
      ],
    },
    {
      id: "rec-trace-step-stack-depth",
      concept: "recursion-stack-depth",
      prompt:
        "While evaluating sumToN(4), how many stack frames — calls that have started but not yet returned — exist at the deepest point, counting the initial call and the base-case call?",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution:
        "The chain of open, unfinished calls at its deepest point is sumToN(4), sumToN(3), sumToN(2), sumToN(1), and sumToN(0) — five frames. Each is still waiting to complete its own addition until the call below it returns, so all five are on the stack simultaneously at that moment.",
      misconceptions: [
        {
          id: "rec-trace-excludes-base-frame",
          triggerAnswers: ["4"],
          description:
            "The learner counted only the frames with n > 0 and left out the base-case frame sumToN(0), which is also open until it returns.",
          remediationFocus:
            "The base-case call is still a frame on the stack — it just doesn't add another call beneath it. Include it in the count.",
        },
        {
          id: "rec-trace-reports-result-not-depth",
          triggerAnswers: ["10"],
          description:
            "The learner reported the computed sum instead of the number of open stack frames.",
          remediationFocus:
            "Stack depth counts calls that have started but not finished, not the value they eventually return.",
        },
      ],
      hints: [
        "List every call that is still 'waiting' at the moment sumToN(0) is reached.",
        "Count from sumToN(4) down through sumToN(0), inclusive.",
      ],
    },
    {
      id: "rec-trace-step-off-by-one-base-case",
      concept: "recursion-base-case-off-by-one",
      prompt:
        "A buggy version changes only the base case's return value: 'if n == 0: return 1' (instead of 'return 0'); the recursive case is unchanged. Using this buggy base case, what does sumToN(3) return?",
      answer: {
        kind: "multipleChoice",
        options: ["6", "7", "3", "10"],
        correctIndex: 1,
      },
      solution:
        "The recursive structure is unaffected: sumToN(3) = 3 + sumToN(2) = 3 + 2 + sumToN(1) = 3 + 2 + 1 + sumToN(0). Only the base case's value changed, so sumToN(0) now returns 1 instead of 0, making the total 3 + 2 + 1 + 1 = 7 — one more than the correct trace of 6.",
      misconceptions: [
        {
          id: "rec-trace-ignores-base-case-change",
          triggerAnswers: ["6", "0"],
          description:
            "The learner retraced the original, correct version and ignored that the base case's return value had changed from 0 to 1.",
          remediationFocus:
            "Substitute the actual (buggy) base-case value into the unwind — every other addition stays the same, but the last term is now 1, not 0.",
        },
        {
          id: "rec-trace-assumes-total-breakage",
          triggerAnswers: ["3", "2"],
          description:
            "The learner assumed a wrong base case invalidates the whole trace and defaulted to returning the top-level argument alone.",
          remediationFocus:
            "Only the base case's own contribution changes; the additions above it are still carried out exactly as before. Retrace the whole chain with the new base-case value.",
        },
      ],
      hints: [
        "Only one number in the whole trace changes because of this bug — which one?",
        "Redo the same addition chain as before, but substitute 1 for the base case's return value at the bottom.",
      ],
    },
  ],
  practice: [
    {
      id: "rec-trace-practice-result-five",
      concept: "recursion-trace-result",
      prompt:
        "Trace sumToN(5) using the same definition (base case returns 0 at n == 0; recursive case n + sumToN(n - 1)). What value does it return?",
      answer: { kind: "numeric", value: 15, tolerance: 0 },
      solution: "sumToN(5) = 5 + 4 + 3 + 2 + 1 + 0 = 15.",
      misconceptions: [
        {
          id: "rec-trace-practice-factorial-confusion",
          triggerAnswers: ["120"],
          description:
            "The learner computed 5! (120) by multiplying instead of tracing the addition this function defines.",
          remediationFocus:
            "This function adds at each level; it is not factorial. Retrace using n + sumToN(n - 1).",
        },
        {
          id: "rec-trace-practice-off-by-one-level",
          triggerAnswers: ["10"],
          description:
            "The learner's trace stopped one level early, effectively computing sumToN(4) instead of sumToN(5).",
          remediationFocus:
            "The call requested is sumToN(5); make sure the top level of the addition chain is 5, not 4.",
        },
      ],
      hints: [
        "Write the chain of additions from 5 down to 0.",
        "Add all six terms, from 5 down through 0.",
      ],
    },
    {
      id: "rec-trace-practice-depth-five",
      concept: "recursion-stack-depth",
      prompt:
        "While evaluating sumToN(5), how many stack frames are open at the deepest point, including the initial call and the base case?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution:
        "The open frames at the deepest point are sumToN(5), sumToN(4), sumToN(3), sumToN(2), sumToN(1), sumToN(0) — six frames total.",
      misconceptions: [
        {
          id: "rec-trace-practice-depth-excludes-base",
          triggerAnswers: ["5"],
          description:
            "The learner again omitted the base-case frame from the depth count.",
          remediationFocus:
            "Include the frame for sumToN(0); it is open until it returns, just like every other frame.",
        },
        {
          id: "rec-trace-practice-depth-reports-result",
          triggerAnswers: ["15"],
          description:
            "The learner reported the computed sum rather than the number of open frames.",
          remediationFocus: "Stack depth is a count of calls, not the value any of them return.",
        },
      ],
      hints: [
        "List every call still open when sumToN(0) is reached.",
        "Count from sumToN(5) down through sumToN(0), inclusive.",
      ],
    },
    {
      id: "rec-trace-practice-unwind-order-factorial",
      concept: "recursion-unwind-order",
      prompt:
        "For factorial(n) = 1 if n == 0 else n * factorial(n - 1), when does the multiplication n * factorial(n - 1) actually happen?",
      answer: {
        kind: "multipleChoice",
        options: [
          "before the recursive call factorial(n - 1) is made",
          "after factorial(n - 1) returns its result, as the calls unwind back up",
          "only for the outermost call, factorial(4) itself",
        ],
        correctIndex: 1,
      },
      solution:
        "As with addition, a multiplication needs both of its values. factorial(n - 1) must return first; only then can the waiting call multiply that result by n. This happens at every level, one at a time, from the base case back up to the original call.",
      misconceptions: [
        {
          id: "rec-trace-practice-multiplies-early",
          triggerAnswers: ["before the recursive call factorial(n - 1) is made", "0"],
          description:
            "The learner believed the multiplication happens before the smaller subproblem has been solved.",
          remediationFocus:
            "You cannot multiply by a result that doesn't exist yet; the recursive call must return first.",
        },
        {
          id: "rec-trace-practice-outermost-only",
          triggerAnswers: ["only for the outermost call, factorial(4) itself", "2"],
          description:
            "The learner believed only the first call performs a multiplication, as though inner calls contribute nothing.",
          remediationFocus:
            "Every call with n > 0 performs its own multiplication once its own recursive call returns — not only the outermost one.",
        },
      ],
      hints: [
        "Compare this to sumToN: does the operation happen before or after the smaller call returns?",
        "Think about which call finishes its multiplication first — the one nearest the base case, or the outermost one?",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
