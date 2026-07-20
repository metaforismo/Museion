import type { Lesson } from "../types";

const lesson = {
  id: "forces-and-motion-net-force",
  title: "Net Force and Newton's First Law",
  track: "Physics",
  description:
    "Combine forces acting on an object and use Newton's first law to decide when motion changes and when it doesn't.",
  concepts: ["net-force-combining", "first-law-motion-persists", "gravity-independent-of-mass"],
  steps: [
    {
      id: "fm-net-step-first-law-predict",
      concept: "first-law-motion-persists",
      prompt:
        "A hockey puck slides across frictionless ice at a constant 4 m/s. No one and nothing is touching it. According to Newton's first law, what happens to its motion?",
      answer: {
        kind: "multipleChoice",
        options: [
          "it gradually slows down and stops, because nothing is pushing it forward",
          "it keeps moving at 4 m/s in a straight line, because no net force acts on it",
          "it speeds up on its own, because the ice is very slippery",
        ],
        correctIndex: 1,
      },
      solution:
        "Newton's first law (the law of inertia) states that an object in motion continues at constant velocity in a straight line unless a net external force acts on it. Here friction is negligible and no other horizontal force is described, so the net force is zero and the puck's velocity does not change: it keeps sliding at 4 m/s. Motion does not require a continuing push — only a change in motion requires a net force.",
      misconceptions: [
        {
          id: "fm-net-continuous-force-myth",
          triggerAnswers: [
            "it gradually slows down and stops, because nothing is pushing it forward",
            "0",
          ],
          description:
            "The learner assumed constant motion needs a sustained forward force and treated the absence of a new force as a reason to slow down — the classic 'motion needs a mover' (Aristotelian) misconception.",
          remediationFocus:
            "Separate the cause of a change in velocity from the cause of velocity itself. Ask what net force is acting right now, and whether the puck's speed is changing at all.",
        },
        {
          id: "fm-net-spontaneous-speedup",
          triggerAnswers: ["it speeds up on its own, because the ice is very slippery", "2"],
          description: "The learner attributed a speed increase to the surface itself rather than to any force.",
          remediationFocus:
            "A change in speed requires a net force in the direction of the change. Identify what new force, if any, is described in the scenario.",
        },
      ],
      hints: [
        "What does 'net force' mean when friction is negligible and no other horizontal force is described?",
        "Newton's first law links a change in velocity to a net force — ask whether the puck's velocity is changing at all.",
      ],
    },
    {
      id: "fm-net-step-tug-of-war",
      concept: "net-force-combining",
      prompt:
        "Two tug-of-war teams pull a rope in opposite directions. Team A pulls with 300 N; Team B pulls with 300 N. What is the net force on the rope, in newtons?",
      answer: { kind: "numeric", value: 0, tolerance: 0 },
      solution:
        "Forces in opposite directions partially or fully cancel. Taking one direction as positive, the net force is 300 N + (-300 N) = 0 N. Equal and opposite pulls balance exactly, which is why the rope does not accelerate.",
      misconceptions: [
        {
          id: "fm-net-adds-opposing-magnitudes",
          triggerAnswers: ["600"],
          description: "The learner added the two magnitudes as if the forces pointed the same way.",
          remediationFocus:
            "Assign a positive direction and a negative direction before adding; opposite forces get opposite signs.",
        },
        {
          id: "fm-net-reports-one-side-only",
          triggerAnswers: ["300"],
          description: "The learner reported a single team's pull instead of combining both forces acting on the rope.",
          remediationFocus: "Net force means combining every force acting on the object, not selecting just one of them.",
        },
      ],
      hints: [
        "Assign a positive direction to one team's pull and a negative direction to the other's.",
        "Add the two signed forces together.",
      ],
    },
    {
      id: "fm-net-step-tugboat",
      concept: "net-force-combining",
      prompt:
        "A tugboat pushes a barge forward with 800 N. Water drag pushes back on the barge with 500 N. What is the magnitude of the net force on the barge, in newtons?",
      answer: { kind: "numeric", value: 300, tolerance: 0 },
      solution:
        "The two forces act in opposite directions, so they partially cancel: 800 N - 500 N = 300 N forward. The barge experiences a net 300 N force in the tugboat's direction, even though two separate forces of different sizes are acting.",
      misconceptions: [
        {
          id: "fm-net-adds-opposing-tugboat",
          triggerAnswers: ["1300"],
          description: "The learner added 800 N and 500 N as if drag also pushed forward.",
          remediationFocus: "Drag opposes the tugboat's push; subtract the opposing force rather than adding it.",
        },
        {
          id: "fm-net-reports-drag-only",
          triggerAnswers: ["500"],
          description: "The learner reported only the resisting drag force and ignored the tugboat's push.",
          remediationFocus: "Combine every force acting on the barge, not just the one that opposes motion.",
        },
      ],
      hints: [
        "Decide which force points which way before combining them.",
        "Subtract the smaller opposing force from the larger one.",
      ],
    },
    {
      id: "fm-net-step-falling-objects",
      concept: "gravity-independent-of-mass",
      prompt:
        "Ignoring air resistance, a 2 kg ball and a 6 kg ball are dropped from the same height at the same time. Which reaches the ground first?",
      answer: {
        kind: "multipleChoice",
        options: [
          "the 6 kg ball, because gravity pulls harder on more mass",
          "the 2 kg ball, because less mass is easier to accelerate",
          "they land at the same time",
        ],
        correctIndex: 2,
      },
      solution:
        "Gravity does exert a larger force on the more massive ball (its weight is greater). But Newton's second law says acceleration is force divided by mass, and the extra force on the heavier ball is exactly proportional to its extra mass. The two effects cancel, so every object in free fall, with no air resistance, accelerates at the same rate regardless of mass. You will verify this directly with a = F/m in the next lesson.",
      misconceptions: [
        {
          id: "fm-net-heavier-falls-faster",
          triggerAnswers: ["the 6 kg ball, because gravity pulls harder on more mass", "0"],
          description:
            "The learner assumed greater weight alone causes greater falling acceleration — the classic 'heavier objects fall faster' misconception.",
          remediationFocus:
            "A larger force from gravity acts on a proportionally larger mass; acceleration is force divided by mass, not force alone.",
        },
        {
          id: "fm-net-lighter-falls-faster",
          triggerAnswers: ["the 2 kg ball, because less mass is easier to accelerate", "1"],
          description:
            "The learner focused only on how mass resists acceleration and ignored that gravity's force is also smaller on that same lighter object.",
          remediationFocus: "Compare both the force of gravity and the mass together — not mass alone — to find acceleration.",
        },
      ],
      hints: [
        "Think about two things separately: how hard gravity pulls on each ball, and how much each ball resists changes in motion.",
        "The next lesson lets you compute a = F/m directly — for now, ask whether those two effects might exactly balance.",
      ],
    },
    {
      id: "fm-net-step-book-on-table",
      concept: "first-law-motion-persists",
      prompt:
        "A book rests on a table. The table's surface pushes up on the book with a normal force equal to the book's weight. What is the net force on the book, and what does this predict about its motion?",
      answer: {
        kind: "multipleChoice",
        options: [
          "net force is zero; the book stays at rest",
          "net force equals the book's weight; the book accelerates downward",
          "net force is zero, but the book still accelerates upward because the forces are balanced",
        ],
        correctIndex: 0,
      },
      solution:
        "Two forces act on the book: its weight, pulling down, and the table's normal force, pushing up with equal magnitude. These are balanced, so the net force is 0 N. By Newton's first law, zero net force means zero acceleration — the book's velocity does not change. Since it started at rest, it stays at rest.",
      misconceptions: [
        {
          id: "fm-net-ignores-normal-force",
          triggerAnswers: ["net force equals the book's weight; the book accelerates downward", "1"],
          description: "The learner accounted for the book's weight but ignored the table's normal force pushing back.",
          remediationFocus:
            "List every force touching the object before summing — here that includes the table's supporting push, not just gravity.",
        },
        {
          id: "fm-net-balanced-forces-still-move",
          triggerAnswers: [
            "net force is zero, but the book still accelerates upward because the forces are balanced",
            "2",
          ],
          description:
            "The learner correctly found zero net force but incorrectly concluded that balance itself produces motion.",
          remediationFocus: "Zero net force means zero acceleration — no change in velocity — not motion in either direction.",
        },
      ],
      hints: [
        "List every force touching the book, not only gravity.",
        "Compare the two forces' directions and sizes before deciding whether they cancel.",
      ],
    },
  ],
  practice: [
    {
      id: "fm-net-practice-cart-pull",
      concept: "net-force-combining",
      prompt: "A cart is pulled right with 150 N and pulled left with 90 N. What is the net force on the cart, in newtons?",
      answer: { kind: "numeric", value: 60, tolerance: 0 },
      solution: "Taking right as positive: 150 N - 90 N = 60 N to the right.",
      misconceptions: [
        {
          id: "fm-net-practice-adds-cart-forces",
          triggerAnswers: ["240"],
          description: "The learner added both magnitudes instead of subtracting the opposing one.",
          remediationFocus: "Give opposite directions opposite signs before combining.",
        },
        {
          id: "fm-net-practice-reports-left-only",
          triggerAnswers: ["90"],
          description: "The learner reported only the leftward force.",
          remediationFocus: "Combine both forces acting on the cart, not just one.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-net-practice-two-mallets",
      concept: "net-force-combining",
      prompt: "Two mallets each push a puck to the right with 12 N. What is the net force on the puck, in newtons?",
      answer: { kind: "numeric", value: 24, tolerance: 0 },
      solution: "Same-direction forces add: 12 N + 12 N = 24 N to the right.",
      misconceptions: [
        {
          id: "fm-net-practice-averages-mallets",
          triggerAnswers: ["12"],
          description: "The learner reported a single mallet's push instead of combining both.",
          remediationFocus: "Same-direction forces add; find the sum, not one term.",
        },
        {
          id: "fm-net-practice-assumes-cancel",
          triggerAnswers: ["0"],
          description: "The learner assumed the two forces pointed in opposite directions and canceled.",
          remediationFocus: "Both mallets push the same way here — same-direction forces add rather than cancel.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-net-practice-smooth-floor",
      concept: "first-law-motion-persists",
      prompt:
        "A ball rolls across a very long, smooth, friction-free floor at a constant speed. No one is touching it. What is the net force on it right now?",
      answer: {
        kind: "multipleChoice",
        options: [
          "zero net force",
          "a force equal to its weight, pushing it forward",
          "a small force that keeps it going, matching its speed",
        ],
        correctIndex: 0,
      },
      solution:
        "Constant speed in a straight line, by Newton's first law, means the net force is zero. No forward force is needed to sustain motion that already exists.",
      misconceptions: [
        {
          id: "fm-net-practice-invents-forward-weight",
          triggerAnswers: ["a force equal to its weight, pushing it forward", "1"],
          description:
            "The learner invented a forward force sized to the ball's weight rather than checking whether any force is actually described.",
          remediationFocus: "Only forces you can identify in the scenario count; weight acts downward, not forward.",
        },
        {
          id: "fm-net-practice-invents-motion-sustaining-force",
          triggerAnswers: ["a small force that keeps it going, matching its speed", "2"],
          description:
            "The learner assumed constant motion needs a matching sustaining force — the continuous-force myth.",
          remediationFocus:
            "Constant velocity persists on its own under zero net force; nothing needs to keep matching the ball's speed.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-net-practice-spacecraft",
      concept: "first-law-motion-persists",
      prompt:
        "A spacecraft drifts through deep space at constant velocity with its engines off and negligible gravity from any nearby body. What does Newton's first law predict about its motion?",
      answer: {
        kind: "multipleChoice",
        options: [
          "it continues at that constant velocity indefinitely",
          "it gradually slows to a stop, since nothing is powering it",
          "it speeds up over time, since space has no friction to hold it back",
        ],
        correctIndex: 0,
      },
      solution:
        "With zero net force — no engine thrust, negligible gravity, no drag in vacuum — Newton's first law predicts unchanged velocity: the spacecraft keeps moving at the same speed and direction indefinitely.",
      misconceptions: [
        {
          id: "fm-net-practice-spacecraft-slows",
          triggerAnswers: ["it gradually slows to a stop, since nothing is powering it", "1"],
          description:
            "The learner assumed motion decays without continued power — the continuous-force myth applied to space travel.",
          remediationFocus: "Zero net force means zero change in velocity, not gradual loss of speed.",
        },
        {
          id: "fm-net-practice-spacecraft-speeds-up",
          triggerAnswers: ["it speeds up over time, since space has no friction to hold it back", "2"],
          description: "The learner assumed the absence of friction causes speeding up rather than simply no slowing.",
          remediationFocus:
            "No net force means no acceleration at all — the spacecraft's speed stays exactly the same; it does not increase either.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-net-practice-two-rocks",
      concept: "gravity-independent-of-mass",
      prompt:
        "A 1 kg rock and a 4 kg rock are dropped at the same time from a cliff; air resistance is small enough to ignore. Compare their fall times.",
      answer: {
        kind: "multipleChoice",
        options: ["the 4 kg rock lands first", "they land at the same time", "the 1 kg rock lands first"],
        correctIndex: 1,
      },
      solution:
        "With air resistance negligible, free-fall acceleration does not depend on mass (a = F/m = mg/m = g for every mass). Both rocks accelerate identically and land together.",
      misconceptions: [
        {
          id: "fm-net-practice-heavy-rock-first",
          triggerAnswers: ["the 4 kg rock lands first", "0"],
          description: "The learner assumed greater weight causes greater falling acceleration.",
          remediationFocus: "Gravity's larger force on the heavier rock is matched by its larger mass; the ratio F/m is unchanged.",
        },
        {
          id: "fm-net-practice-light-rock-first",
          triggerAnswers: ["the 1 kg rock lands first", "2"],
          description: "The learner assumed less mass falls faster.",
          remediationFocus: "Compare force and mass together, not mass alone.",
        },
      ],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
