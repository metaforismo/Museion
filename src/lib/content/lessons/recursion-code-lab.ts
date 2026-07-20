import type { Lesson } from "../types";

/**
 * The Recursion Lab. Learners complete recursive functions by choosing
 * enumerated slot values and watch the call trace respond live. The
 * canonical slot string is verified server-side as an expression, so
 * the deterministic pipeline (misconceptions, hints, Maia) applies
 * unchanged. No arbitrary code ever runs.
 */
const lesson = {
  id: "recursion-code-lab",
  title: "The Recursion Lab: Build It, Watch It Run",
  track: "Computer Science",
  description:
    "Complete two recursive functions slot by slot, watch the call stack respond, and see exactly why a bad recursive argument never stops.",
  concepts: ["complete-a-recursion", "watch-the-stack", "spot-non-termination"],
  steps: [
    {
      id: "step-1",
      concept: "spot-non-termination",
      prompt:
        "Before building: a function is defined as f(n) = 2 × f(n) with base case f(1) = 1. What happens when you call f(5)?",
      answer: {
        kind: "multipleChoice",
        options: [
          "it calls f(5) forever and never reaches the base case",
          "it returns 32",
          "it returns 10",
        ],
        correctIndex: 0,
      },
      solution:
        "It never stops. The recursive call uses the same input, f(n), so every call is exactly as far from the base case as the one before. A correct recursion must make progress: the recursive argument has to move toward the base case, as in f(n − 1).",
      misconceptions: [
        {
          id: "assumes-it-computes-powers",
          triggerAnswers: ["1", "it returns 32"],
          description: "The learner computed what the function was probably meant to do, not what its definition actually does.",
          remediationFocus: "Trace the definition literally: what input does the recursive call receive?",
        },
        {
          id: "assumes-doubling-once",
          triggerAnswers: ["2", "it returns 10"],
          description: "The learner applied the doubling a single time instead of following the recursion.",
          remediationFocus: "Each call defers to another call. Follow where the chain of calls leads before computing anything.",
        },
      ],
      hints: [
        "Write the first two calls: f(5) calls f(?), which calls f(?).",
        "Does the input ever get closer to 1?",
      ],
    },
    {
      id: "step-2",
      concept: "complete-a-recursion",
      prompt:
        "Build sum_to(n): the sum 1 + 2 + … + n. Fill the slots, watch the trace, and make the visible tests pass before you check.",
      lab: {
        kind: "recursion-code",
        functionName: "sum_to",
        paramName: "n",
        lines: [
          "def sum_to(n):",
          "    if n == {base}:",
          "        return {baseReturn}",
          "    return {head} + sum_to({next})",
        ],
        slots: [
          { id: "base", options: ["0", "1", "n"] },
          { id: "baseReturn", options: ["0", "1", "n"] },
          { id: "head", options: ["1", "n", "n - 1"] },
          { id: "next", options: ["n", "n - 1", "n + 1"] },
        ],
        tests: [
          { input: 3, expected: 6 },
          { input: 5, expected: 15 },
        ],
        op: "+",
      },
      answer: {
        kind: "expression",
        // Both anchors are correct for n ≥ 1; the engine accepts either.
        acceptedForms: ["base=0,basereturn=0,head=n,next=n-1", "base=1,basereturn=1,head=n,next=n-1"],
      },
      solution:
        "sum_to(n): if n == 0 return 0; otherwise return n + sum_to(n − 1). The base case anchors the chain at 0, each call contributes its own n, and n − 1 guarantees progress toward the base case. sum_to(3) unwinds as 3 + 2 + 1 + 0 = 6.",
      misconceptions: [
        {
          id: "no-progress-argument",
          triggerAnswers: ["base=0,basereturn=0,head=n,next=n", "base=1,basereturn=1,head=n,next=n"],
          description: "The learner recursed on the same value, so no call moves toward the base case.",
          remediationFocus: "Watch the trace: every call shows the same number. What smaller input would move the function toward the base case?",
        },
        {
          id: "counts-instead-of-sums",
          triggerAnswers: ["base=0,basereturn=0,head=1,next=n-1"],
          description: "The learner added 1 per call instead of adding the current value of n, computing the count of calls rather than the sum.",
          remediationFocus: "Compare the failing test: sum_to(3) should be 6, not 3. What should each call contribute?",
        },
        {
          id: "wrong-direction",
          triggerAnswers: ["base=0,basereturn=0,head=n,next=n+1"],
          description: "The learner recursed on n + 1, moving away from the base case.",
          remediationFocus: "The trace climbs instead of descending. Progress means the argument gets closer to the base value.",
        },
      ],
      hints: [
        "Anchor first: what value of n should stop the recursion, and what should it return there?",
        "Each call contributes its own n; the rest of the sum comes from the recursive call on a smaller number.",
      ],
    },
    {
      id: "step-3",
      concept: "watch-the-stack",
      prompt:
        "CacheCoins: the pile has 1 coin on day 1 and doubles each day. Build coins(day) so the tests pass.",
      lab: {
        kind: "recursion-code",
        functionName: "coins",
        paramName: "day",
        lines: [
          "def coins(day):",
          "    if day == {base}:",
          "        return {baseReturn}",
          "    return {head} * coins({next})",
        ],
        slots: [
          { id: "base", options: ["0", "1", "day"] },
          { id: "baseReturn", options: ["0", "1", "2"] },
          { id: "head", options: ["2", "day", "1"] },
          { id: "next", options: ["day", "day - 1", "day - 2"] },
        ],
        tests: [
          { input: 3, expected: 4 },
          { input: 5, expected: 16 },
        ],
        op: "*",
      },
      answer: {
        kind: "expression",
        acceptedForms: ["base=1,basereturn=1,head=2,next=day-1"],
      },
      solution:
        "coins(day): if day == 1 return 1; otherwise return 2 × coins(day − 1). Day 1 anchors the pile at one coin, each later day doubles the previous day, and day − 1 walks back toward the anchor. coins(5) = 2 × 2 × 2 × 2 × 1 = 16.",
      misconceptions: [
        {
          id: "same-day-forever",
          triggerAnswers: ["base=1,basereturn=1,head=2,next=day"],
          description: "The learner recursed on the same day — the classic runaway trace from the prediction step, now in their own code.",
          remediationFocus: "The output panel shows the same call repeating. Ask: which smaller input would move the function toward day 1?",
        },
        {
          id: "multiplies-by-day",
          triggerAnswers: ["base=1,basereturn=1,head=day,next=day-1"],
          description: "The learner multiplied by the day number instead of doubling, computing a factorial-like value.",
          remediationFocus: "Check the failing test: coins(3) should be 4, not 6. Doubling means multiplying by the same fixed number each day.",
        },
        {
          id: "zero-base-kills-product",
          triggerAnswers: ["base=1,basereturn=0,head=2,next=day-1", "base=0,basereturn=0,head=2,next=day-1"],
          description: "The learner anchored the product at 0, which makes every product 0.",
          remediationFocus: "A product chain needs a neutral anchor. What must the base case return so the doubling survives?",
        },
      ],
      hints: [
        "Anchor the story: how many coins are there on day 1?",
        "Each day is double the day before — which call gives you 'the day before'?",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "spot-non-termination",
      prompt:
        "A function g(n) = g(n − 1) + 2 has no base case at all. What happens when you call g(4)?",
      answer: {
        kind: "multipleChoice",
        options: [
          "it keeps calling smaller values forever — nothing ever stops it",
          "it returns 8",
          "it stops by itself at 0",
        ],
        correctIndex: 0,
      },
      solution:
        "Without a base case nothing stops the descent: g(4) calls g(3), g(2), g(1), g(0), g(−1), … forever. Progress alone is not enough; a recursion needs both a base case and progress toward it.",
      misconceptions: [
        {
          id: "assumes-auto-stop-at-zero",
          triggerAnswers: ["2", "it stops by itself at 0"],
          description: "The learner assumed recursion halts at zero automatically.",
          remediationFocus: "Nothing stops a recursion except an explicit base case; zero is not special unless the code says so.",
        },
      ],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
