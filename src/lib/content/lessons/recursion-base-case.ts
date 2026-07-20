import type { Lesson } from "../types";

const lesson = {
  id: "recursion-base-case",
  title: "Base Case and Progress",
  track: "Computer Science",
  description:
    "For learners ages 14+ starting recursion: a correct recursive definition needs a base case, and every recursive call must move the input toward it.",
  concepts: [
    "recursion-requires-base-case",
    "recursion-requires-progress",
    "recursion-call-count",
    "recursion-recurrence-relation",
  ],
  steps: [
    {
      id: "rec-base-step-no-base-case",
      concept: "recursion-requires-base-case",
      prompt:
        "Consider this definition, written without any stopping condition:\n\ncountdown(n):\n  print(n)\n  countdown(n - 1)\n\nWhat happens when you call countdown(3)?",
      answer: {
        kind: "multipleChoice",
        options: [
          "it prints 3, 2, 1, 0, and then stops on its own",
          "it keeps calling itself with smaller values forever, because no condition ever stops it",
          "it prints 3 once and returns immediately",
          "it stops because n eventually becomes undefined",
        ],
        correctIndex: 1,
      },
      solution:
        "A recursive function only stops recursing where its code explicitly checks a condition and returns without making another call — that check is the base case. This definition has no such check, so countdown keeps calling itself with n-1, n-2, n-3, and so on, without end. Nothing about reaching zero or a negative number halts it automatically; the code would have to test for that and choose not to recurse.",
      misconceptions: [
        {
          id: "rec-base-assumes-auto-stop",
          triggerAnswers: [
            "it prints 3, 2, 1, 0, and then stops on its own",
            "0",
          ],
          description:
            "The learner assumed the recursion halts once the values look 'small' (like reaching 0), without an explicit check that stops it.",
          remediationFocus:
            "A recursive call only stops where the code tests a condition and chooses not to recurse; nothing halts it automatically just because a value looks small.",
        },
        {
          id: "rec-base-single-call-only",
          triggerAnswers: ["it prints 3 once and returns immediately", "2"],
          description:
            "The learner treated the recursive call as if it were never actually executed, as though the function only runs its first line.",
          remediationFocus:
            "Every call to a recursive function runs its full body, including the line that calls itself again; trace what the second call actually does.",
        },
        {
          id: "rec-base-assumes-implicit-halt",
          triggerAnswers: ["it stops because n eventually becomes undefined", "3"],
          description:
            "The learner assumed the recursion would run out of valid input and stop on its own, as if negative numbers were undefined for the function.",
          remediationFocus:
            "Nothing about ordinary numbers stops the calls at zero or in negative territory unless the code itself checks for it; without that check, n keeps decreasing without bound.",
        },
      ],
      hints: [
        "Look for a line that checks a condition and returns without recursing further.",
        "If no such check exists, what stops the chain of calls?",
      ],
    },
    {
      id: "rec-base-step-no-progress",
      concept: "recursion-requires-progress",
      prompt:
        "Now this version DOES have a base case check:\n\ncountdown(n):\n  if n == 0:\n    return\n  print(n)\n  countdown(n)\n\nIt still never finishes for countdown(3). Why?",
      answer: {
        kind: "multipleChoice",
        options: [
          "the base case is written in the wrong order, before the print statement",
          "the recursive call passes n unchanged, so the base case condition n == 0 is never reached",
          "print statements block a function from returning",
          "the function needs two separate base cases to work",
        ],
        correctIndex: 1,
      },
      solution:
        "A base case being present is not enough — every recursive call must also make progress toward it. Here the recursive call is countdown(n), passing the same n every time. Since n never changes, the check n == 0 is tested against the same value on every call and never becomes true unless it started true. The chain of calls is exactly as endless as if there were no base case at all.",
      misconceptions: [
        {
          id: "rec-base-reorders-base-case",
          triggerAnswers: [
            "the base case is written in the wrong order, before the print statement",
            "0",
          ],
          description:
            "The learner attributed the bug to the base case's position in the code rather than to the unchanged argument.",
          remediationFocus:
            "Where the base-case check appears matters for when it runs, but the actual defect here is that n is never smaller on the next call; check what value is passed to the recursive call.",
        },
        {
          id: "rec-base-blames-print",
          triggerAnswers: ["print statements block a function from returning", "2"],
          description:
            "The learner attributed the non-termination to an unrelated statement (print) rather than to the recursive call's argument.",
          remediationFocus:
            "print has no effect on whether recursion continues; look specifically at the value passed into the recursive call itself.",
        },
        {
          id: "rec-base-wants-two-base-cases",
          triggerAnswers: ["the function needs two separate base cases to work", "3"],
          description:
            "The learner assumed the fix requires additional stopping conditions rather than fixing the argument passed to the existing one.",
          remediationFocus:
            "One correct base case is enough as long as every recursive call strictly moves the input toward it; the fix is calling countdown(n - 1), not adding more checks.",
        },
      ],
      hints: [
        "A base case being present isn't enough on its own — what else does a correct recursive call need to do?",
        "Compare the argument passed in the recursive call with the argument the base case checks.",
      ],
    },
    {
      id: "rec-base-step-call-count",
      concept: "recursion-call-count",
      prompt:
        "factorial(n) is defined as: return 1 if n == 0, else return n * factorial(n - 1). Counting the initial call and every call it makes, including the one that hits the base case, how many total calls occur when you evaluate factorial(4)?",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution:
        "The call chain is factorial(4) → factorial(3) → factorial(2) → factorial(1) → factorial(0). That is five calls in total: four calls where n > 0 makes a further recursive call, plus the base-case call factorial(0), which returns 1 without recursing further.",
      misconceptions: [
        {
          id: "rec-base-excludes-base-call",
          triggerAnswers: ["4"],
          description:
            "The learner counted only the calls that themselves make another recursive call (n = 4, 3, 2, 1) and left out the base-case call factorial(0).",
          remediationFocus:
            "The call that hits the base case is still a call — it just doesn't make a further one. Count every call in the chain, including the last one.",
        },
        {
          id: "rec-base-reports-factorial-value",
          triggerAnswers: ["24"],
          description:
            "The learner reported the value factorial(4) computes (24) rather than the number of calls made to compute it.",
          remediationFocus:
            "Separate what the function returns from how many times it was invoked; walk the chain of calls one at a time and count entries, not the final product.",
        },
      ],
      hints: [
        "List each call in the chain from factorial(4) down to the base case.",
        "Count every entry in that list, including the one where n == 0.",
      ],
    },
    {
      id: "rec-base-step-recurrence",
      concept: "recursion-recurrence-relation",
      prompt:
        "For factorial(n) with base case 'if n == 0: return 1', write the recursive case: the expression returned when n > 0, in terms of n and factorial(n - 1).",
      answer: {
        kind: "expression",
        acceptedForms: [
          "n*factorial(n-1)",
          "n * factorial(n - 1)",
          "factorial(n-1)*n",
          "factorial(n - 1) * n",
        ],
      },
      solution:
        "The recursive case must combine the current n with the result of the smaller subproblem factorial(n - 1). Multiplying them, in either order, gives n * factorial(n - 1) — which is exactly what 'n! = n × (n-1)!' means.",
      misconceptions: [
        {
          id: "rec-base-drops-multiplier",
          triggerAnswers: ["factorial(n-1)", "factorial(n - 1)"],
          description:
            "The learner recursed correctly but returned the subproblem's result unchanged, without combining it with n.",
          remediationFocus:
            "The recursive case must do something with n before returning — combine it with the smaller result rather than passing it straight through.",
        },
        {
          id: "rec-base-no-progress-in-recurrence",
          triggerAnswers: ["n*factorial(n)", "n * factorial(n)"],
          description:
            "The learner wrote a recursive call with the same argument n instead of a strictly smaller one.",
          remediationFocus:
            "The argument to the recursive call must decrease toward the base case; use n - 1, not n.",
        },
      ],
      hints: [
        "The recursive case has to use the result of factorial(n - 1) for something — what?",
        "Combine n with that smaller result using multiplication.",
      ],
    },
  ],
  practice: [
    {
      id: "rec-base-practice-call-count-three",
      concept: "recursion-call-count",
      prompt:
        "Using the same factorial(n) definition (base case at n == 0, recursive case n * factorial(n - 1)), how many total calls occur when evaluating factorial(3), including the base-case call?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution:
        "The chain is factorial(3) → factorial(2) → factorial(1) → factorial(0): four calls total, ending with the base case.",
      misconceptions: [
        {
          id: "rec-base-practice-excludes-base-three",
          triggerAnswers: ["3"],
          description:
            "The learner again left out the base-case call, counting only calls with n > 0.",
          remediationFocus:
            "Include the call where n == 0; it is still a call, even though it doesn't recurse further.",
        },
        {
          id: "rec-base-practice-reports-value-three",
          triggerAnswers: ["6"],
          description:
            "The learner reported factorial(3)'s value (6) instead of the number of calls made.",
          remediationFocus:
            "Count entries in the call chain, not the final computed product.",
        },
      ],
      hints: [
        "Write out the chain of calls from factorial(3) to the base case.",
        "Count every call in that chain, including the last one.",
      ],
    },
    {
      id: "rec-base-practice-moves-away",
      concept: "recursion-requires-progress",
      prompt:
        "A different version increments instead of decrementing:\n\ncountdown(n):\n  if n == 0:\n    return\n  print(n)\n  countdown(n + 1)\n\nFor countdown(3), does this terminate?",
      answer: {
        kind: "multipleChoice",
        options: [
          "yes, it terminates immediately",
          "no, because n grows away from 0 instead of moving toward it",
          "yes, once n grows large enough it wraps back around to 0",
          "no, because the base case checks the wrong variable",
        ],
        correctIndex: 1,
      },
      solution:
        "Progress toward the base case means the argument must move toward the value the base case checks for — here, toward 0. Passing n + 1 moves n away from 0 with every call, so the condition n == 0 is never satisfied for a call that starts at 3; the recursion never terminates.",
      misconceptions: [
        {
          id: "rec-base-practice-assumes-terminates",
          triggerAnswers: ["yes, it terminates immediately", "0"],
          description:
            "The learner assumed any base case guarantees termination, without checking whether the recursive call actually makes progress toward it.",
          remediationFocus:
            "A base case only helps if some call eventually satisfies it; check whether the argument moves toward the base case's condition.",
        },
        {
          id: "rec-base-practice-assumes-wraparound",
          triggerAnswers: [
            "yes, once n grows large enough it wraps back around to 0",
            "2",
          ],
          description:
            "The learner assumed that an ever-growing number would eventually cycle back to 0.",
          remediationFocus:
            "Ordinary integers don't wrap around to 0 by growing; the condition n == 0 only becomes true if something actually decreases n to 0.",
        },
        {
          id: "rec-base-practice-blames-base-case-var",
          triggerAnswers: ["no, because the base case checks the wrong variable", "3"],
          description:
            "The learner correctly sensed something was wrong but blamed the base case's condition rather than the recursive call's argument.",
          remediationFocus:
            "The base case n == 0 is a perfectly reasonable check; the defect is in the recursive call, which moves n the wrong direction.",
        },
      ],
      hints: [
        "Which value does the base case test for?",
        "Does n + 1 move n toward that value or away from it?",
      ],
    },
    {
      id: "rec-base-practice-call-count-five",
      concept: "recursion-call-count",
      prompt:
        "Continuing the same factorial pattern, how many total calls occur when evaluating factorial(5), including the base-case call?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution:
        "The chain is factorial(5) → factorial(4) → factorial(3) → factorial(2) → factorial(1) → factorial(0): six calls total.",
      misconceptions: [
        {
          id: "rec-base-practice-excludes-base-five",
          triggerAnswers: ["5"],
          description:
            "The learner once more omitted the base-case call from the count.",
          remediationFocus:
            "The pattern is n + 1 total calls for factorial(n), because the base case call itself is included.",
        },
        {
          id: "rec-base-practice-reports-value-five",
          triggerAnswers: ["120"],
          description:
            "The learner reported factorial(5)'s computed value (120) instead of the number of calls.",
          remediationFocus:
            "Keep the call count separate from the returned value; list the chain and count its entries.",
        },
      ],
      hints: [
        "Extend the chain pattern from factorial(4) one more step.",
        "Count every call from factorial(5) down through factorial(0).",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
