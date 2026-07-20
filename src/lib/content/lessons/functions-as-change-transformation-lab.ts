import type { Lesson } from "../types";

/**
 * The Function Transformation Lab. The graph steps use the interactive
 * lab control; verification and misconception matching stay in the
 * deterministic engine like every other answer kind.
 */
const lesson = {
  id: "functions-as-change-transformation-lab",
  title: "The Transformation Lab: Move the Curve",
  track: "Algebra",
  description:
    "Shape a parabola with the parameters a, h and k until it matches a target — and learn why the horizontal shift works backwards.",
  concepts: ["vertex-form", "horizontal-shift", "vertical-shift", "vertical-scale"],
  steps: [
    {
      id: "step-1",
      concept: "horizontal-shift",
      prompt:
        "Before touching the graph, predict: compared with y = x², where does the graph of y = (x − 3)² + 2 sit?",
      answer: {
        kind: "multipleChoice",
        options: [
          "3 right and 2 up",
          "3 left and 2 up",
          "2 right and 3 up",
        ],
        correctIndex: 0,
      },
      solution:
        "The graph moves 3 right and 2 up. Inside the parentheses, x − 3 means the input must be 3 larger to produce the same output as before — so every point moves right, opposite to the sign. The +2 outside acts on the output directly, moving the graph up.",
      misconceptions: [
        {
          id: "h-sign-read-literally",
          triggerAnswers: ["1", "3 left and 2 up"],
          description: "The learner read the minus sign inside the parentheses as a shift to the left.",
          remediationFocus: "Inside the parentheses the transformation works on the input, so its effect is reversed: x − 3 shifts right.",
          highlight: { kind: "term", text: "(x − 3)²" },
        },
        {
          id: "h-k-swapped",
          triggerAnswers: ["2", "2 right and 3 up"],
          description: "The learner swapped the roles of the inside and outside numbers.",
          remediationFocus: "The number inside the parentheses moves the graph horizontally; the number added outside moves it vertically.",
          highlight: { kind: "term", text: "+ 2" },
        },
      ],
      hints: [
        "Which number sits inside the parentheses with x, and which is added outside?",
        "Ask: what input now makes the squared part equal zero?",
      ],
    },
    {
      id: "step-2",
      concept: "vertex-form",
      prompt:
        "Now test your prediction. Move your curve until it matches the target, then check. Watch what h does to the graph as you change it.",
      answer: {
        kind: "graph",
        family: "quadratic-vertex",
        target: { a: 1, h: 3, k: 2 },
        tolerance: 0.25,
        xRange: [-6, 6],
        yRange: [-2, 8],
      },
      solution:
        "The target is y = (x − 3)² + 2: vertex at (3, 2) with the same width as y = x². h = 3 places the vertex 3 to the right — the minus sign in vertex form already encodes the reversal — and k = 2 lifts it 2 up.",
      misconceptions: [
        {
          id: "h-sign-flipped",
          triggerAnswers: ["a=1,h=-3,k=2"],
          description: "The learner shifted the vertex left, matching the literal sign of −3 rather than its effect on the input.",
          remediationFocus: "Compare where each curve's lowest point sits. The vertex is where x − h = 0 — solve that small equation for x.",
          highlight: { kind: "graph-region", param: "h" },
        },
        {
          id: "h-k-swapped-on-graph",
          triggerAnswers: ["a=1,h=2,k=3"],
          description: "The learner exchanged the horizontal and vertical shift values.",
          remediationFocus: "h moves the vertex along the x-axis and k along the y-axis. Locate the target vertex's coordinates one axis at a time.",
          highlight: { kind: "graph-region", param: "h" },
        },
        {
          id: "scaled-instead-of-shifted",
          triggerAnswers: ["a=2,h=3,k=2", "a=0.5,h=3,k=2"],
          description: "The learner changed the curve's steepness even though only the position differs from y = x².",
          remediationFocus: "Check the width one unit left and right of the vertex: the target rises by exactly 1, so a stays 1.",
          highlight: { kind: "graph-region", param: "a" },
        },
      ],
      hints: [
        "Find the lowest point of the dashed target first. Its coordinates are (h, k).",
        "Move only one parameter at a time and watch which direction the curve responds.",
      ],
    },
    {
      id: "step-3",
      concept: "vertical-scale",
      prompt:
        "One more curve. This target opens downward and is wider than y = x². Match it, then check.",
      answer: {
        kind: "graph",
        family: "quadratic-vertex",
        target: { a: -0.5, h: -2, k: 4 },
        tolerance: 0.25,
        xRange: [-8, 4],
        yRange: [-4, 6],
      },
      solution:
        "The target is y = −0.5(x + 2)² + 4: vertex at (−2, 4), opening downward because a is negative, and wider than y = x² because |a| is less than 1. x + 2 means h = −2 — the vertex sits 2 to the left.",
      misconceptions: [
        {
          id: "missed-reflection",
          triggerAnswers: ["a=0.5,h=-2,k=4"],
          description: "The learner matched the width and vertex but left the parabola opening upward.",
          remediationFocus: "Look at which way the arms point as you move away from the vertex. The sign of a controls that direction.",
          highlight: { kind: "graph-region", param: "a" },
        },
        {
          id: "h-sign-flipped-left-case",
          triggerAnswers: ["a=-0.5,h=2,k=4"],
          description: "The learner shifted right even though the vertex sits at x = −2.",
          remediationFocus: "A vertex left of zero means h itself is negative — in the written form it appears as x + 2.",
          highlight: { kind: "graph-region", param: "h" },
        },
        {
          id: "steepness-inverted",
          triggerAnswers: ["a=-2,h=-2,k=4"],
          description: "The learner made the parabola narrower when the target is wider than y = x².",
          remediationFocus: "One unit from the vertex the target drops by only a half. What multiple of the squared term produces that?",
          highlight: { kind: "graph-region", param: "a" },
        },
      ],
      hints: [
        "Locate the vertex first, ignoring the shape entirely.",
        "Then fix the direction the parabola opens before adjusting the width.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "vertex-form",
      prompt: "Match the target curve. No hints this time — trust the vertex.",
      answer: {
        kind: "graph",
        family: "quadratic-vertex",
        target: { a: 1, h: -4, k: -1 },
        tolerance: 0.25,
        xRange: [-8, 4],
        yRange: [-4, 8],
      },
      solution:
        "The target is y = (x + 4)² − 1: vertex at (−4, −1), standard width. The +4 inside the parentheses means h = −4.",
      misconceptions: [
        {
          id: "h-sign-flipped-practice",
          triggerAnswers: ["a=1,h=4,k=-1"],
          description: "The learner shifted right instead of left.",
          remediationFocus: "The vertex is where the squared expression equals zero — solve x + 4 = 0.",
        },
      ],
      hints: [],
    },
    {
      id: "practice-2",
      concept: "horizontal-shift",
      prompt: "In y = (x + 5)² − 3, what is the x-coordinate of the vertex?",
      answer: { kind: "numeric", value: -5, tolerance: 0 },
      solution:
        "The squared part is zero when x + 5 = 0, so x = −5. The vertex form's minus sign is already built in: x + 5 equals x − (−5).",
      misconceptions: [
        {
          id: "reads-plus-five-as-right",
          triggerAnswers: ["5"],
          description: "The learner read +5 inside the parentheses as a shift to the right.",
          remediationFocus: "Set the inside expression to zero and solve — that x-value is the vertex.",
        },
      ],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
