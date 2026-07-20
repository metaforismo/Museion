import type { Lesson } from "../types";

const lesson = {
  id: "forces-and-motion-transfer",
  title: "Net Force, Friction, and Newton's Third Law",
  track: "Physics",
  description:
    "Apply net force and F = ma to a sled opposed by friction, then reason about Newton's third law action-reaction pairs acting on different objects.",
  concepts: ["net-force-with-friction", "second-law-application", "newtons-third-law-pairs"],
  steps: [
    {
      id: "fm-tr-step-predict-friction",
      concept: "net-force-with-friction",
      prompt:
        "Before doing any math: a sled is pulled forward while friction from the snow acts backward. If the pulling force is larger than the friction force, what do you expect to happen to the sled's speed?",
      answer: {
        kind: "multipleChoice",
        options: [
          "the speed stays constant, because forces are still acting on it",
          "the speed increases, because there is a net forward force",
          "the speed decreases, because friction always slows things down",
        ],
        correctIndex: 1,
      },
      solution:
        "Two forces act in opposite directions, so they only partially cancel. Since the pulling force is larger, the net force is forward and nonzero. By Newton's second law, a nonzero net force produces acceleration in its own direction, so the sled speeds up. Forces being present does not by itself mean they are balanced — compare their magnitudes.",
      misconceptions: [
        {
          id: "fm-tr-forces-present-means-balanced",
          triggerAnswers: ["the speed stays constant, because forces are still acting on it", "0"],
          description: "The learner assumed that any pair of opposing forces automatically balances, regardless of magnitude.",
          remediationFocus: "Balance requires equal magnitudes in opposite directions, not merely opposing directions — compare the two numbers.",
        },
        {
          id: "fm-tr-friction-always-wins",
          triggerAnswers: ["the speed decreases, because friction always slows things down", "2"],
          description: "The learner assumed friction necessarily dominates any applied force, regardless of magnitude.",
          remediationFocus: "Compare the actual sizes of the applied force and friction; whichever is larger determines the direction of the net force.",
        },
      ],
      hints: [
        "Compare the two force magnitudes before deciding whether they balance.",
        "A nonzero net force produces acceleration in its own direction.",
      ],
    },
    {
      id: "fm-tr-step-sled-net-force",
      concept: "net-force-with-friction",
      prompt: "A child pulls a sled forward with 50 N. Friction from the snow acts backward with 30 N. What is the net force on the sled, in newtons?",
      answer: { kind: "numeric", value: 20, tolerance: 0 },
      solution: "The forces act in opposite directions, so they partially cancel: 50 N - 30 N = 20 N forward.",
      misconceptions: [
        {
          id: "fm-tr-adds-sled-forces",
          triggerAnswers: ["80"],
          description: "The learner added the pulling force and friction as if both pointed the same way.",
          remediationFocus: "Friction opposes the pull; subtract it rather than adding it.",
        },
        {
          id: "fm-tr-reports-friction-only",
          triggerAnswers: ["30"],
          description: "The learner reported only the friction force and ignored the child's pull.",
          remediationFocus: "Combine every force acting on the sled, not just the resisting one.",
        },
      ],
      hints: [
        "Decide which direction is positive before combining the two forces.",
        "Subtract the smaller opposing force from the larger one.",
      ],
    },
    {
      id: "fm-tr-step-sled-acceleration",
      concept: "second-law-application",
      prompt:
        "The sled and rider together have a combined mass of 10 kg. Using the net force from the previous step (20 N), what is the sled's acceleration, in m/s²?",
      answer: { kind: "numeric", value: 2, tolerance: 0 },
      solution: "a = F / m = 20 N / 10 kg = 2 m/s².",
      misconceptions: [
        {
          id: "fm-tr-multiplies-sled-mass",
          triggerAnswers: ["200"],
          description: "The learner multiplied the net force by the mass instead of dividing.",
          remediationFocus: "Solve a = F/m by dividing the net force by the mass.",
        },
        {
          id: "fm-tr-subtracts-sled-mass",
          triggerAnswers: ["10"],
          description: "The learner subtracted the mass from the net force instead of dividing.",
          remediationFocus: "Division, not subtraction, connects force and mass to acceleration.",
        },
      ],
      hints: [
        "Identify which quantity in F = ma you are solving for.",
        "Divide the net force by the combined mass.",
      ],
    },
    {
      id: "fm-tr-step-required-pull",
      concept: "second-law-application",
      prompt:
        "The child now wants the same sled (mass 10 kg; friction still 30 N backward) to accelerate forward at 5 m/s². What forward pulling force, in newtons, must the child apply?",
      answer: { kind: "numeric", value: 80, tolerance: 0 },
      solution:
        "First find the net force needed for this acceleration: F_net = m × a = 10 kg × 5 m/s² = 50 N forward. Friction still removes 30 N from whatever the child applies, so the applied pull must supply both the needed net force and enough to overcome friction: F_pull = F_net + friction = 50 N + 30 N = 80 N.",
      misconceptions: [
        {
          id: "fm-tr-forgets-friction-in-pull",
          triggerAnswers: ["50"],
          description: "The learner computed only the net force required and forgot that friction must also be overcome by the applied pull.",
          remediationFocus:
            "The net force is what's left after friction acts; the applied pull must be larger than the net force by the amount friction removes.",
        },
        {
          id: "fm-tr-subtracts-friction-in-pull",
          triggerAnswers: ["20"],
          description: "The learner subtracted friction from the required net force instead of adding it.",
          remediationFocus:
            "Friction opposes the pull, so the pull must supply extra force to overcome it — add friction to the required net force, don't subtract it.",
        },
      ],
      hints: [
        "First find the net force needed to produce that acceleration on that mass.",
        "The applied pull must overcome friction in addition to producing the net force — combine the two.",
      ],
    },
    {
      id: "fm-tr-step-third-law-sled",
      concept: "newtons-third-law-pairs",
      prompt:
        "The child pulls the sled forward through the rope. By Newton's third law, the sled pulls back on the child with an equal and opposite force. Since these two forces are equal and opposite, why doesn't the whole system have zero net force, preventing any acceleration?",
      answer: {
        kind: "multipleChoice",
        options: [
          "the forces do cancel, so the sled can never actually accelerate",
          "the two forces act on different objects — one on the sled, one on the child — so they don't cancel within either object's own net force",
          "the forces cancel only on snow, not on pavement",
        ],
        correctIndex: 1,
      },
      solution:
        "Newton's third law pairs always act on two different objects, never on the same object. The rope's forward pull acts on the sled; the sled's backward pull acts on the child. To find the sled's acceleration, sum only the forces acting on the sled (the pull and friction) — the reaction force on the child is irrelevant to the sled's own motion. This is why action-reaction pairs never cancel an object's own applied force.",
      misconceptions: [
        {
          id: "fm-tr-third-law-same-object",
          triggerAnswers: ["the forces do cancel, so the sled can never actually accelerate", "0"],
          description: "The learner applied the third-law pair as though both forces act on the sled, producing an apparent cancellation.",
          remediationFocus: "Identify which object each force in the pair acts on; only sum forces that act on the object whose motion you're analyzing.",
        },
        {
          id: "fm-tr-third-law-surface-dependent",
          triggerAnswers: ["the forces cancel only on snow, not on pavement", "2"],
          description: "The learner invented a surface-dependent exception to Newton's third law.",
          remediationFocus: "The third law holds on every surface; the relevant question is which forces act on which object, not what surface is involved.",
        },
      ],
      hints: [
        "Ask: which object does each of the two forces act on?",
        "To find an object's acceleration, sum only the forces acting on that one object.",
      ],
    },
    {
      id: "fm-tr-step-elevator",
      concept: "second-law-application",
      prompt: "An elevator with a total mass of 800 kg accelerates upward at 2 m/s². What net force, in newtons, must act on the elevator to produce this acceleration?",
      answer: { kind: "numeric", value: 1600, tolerance: 0 },
      solution:
        "F_net = m × a = 800 kg × 2 m/s² = 1600 N. This is the required net upward force; in practice the cable tension must exceed the elevator's weight by this amount, but the question only asks for the net force from a = F/m.",
      misconceptions: [
        {
          id: "fm-tr-elevator-divides",
          triggerAnswers: ["400"],
          description: "The learner divided mass by acceleration instead of multiplying.",
          remediationFocus: "Solving for net force means multiplying mass by acceleration: F = ma.",
        },
        {
          id: "fm-tr-elevator-adds",
          triggerAnswers: ["802"],
          description: "The learner added the mass and acceleration values instead of multiplying them.",
          remediationFocus: "Mass and acceleration combine by multiplication in Newton's second law, not addition.",
        },
      ],
      hints: [
        "Identify which quantity in F = ma you are solving for: F.",
        "Multiply the elevator's mass by its acceleration.",
      ],
    },
  ],
  practice: [
    {
      id: "fm-tr-practice-crate-net-force",
      concept: "net-force-with-friction",
      prompt: "A crate is pushed forward with 90 N while friction resists with 60 N. What is the net force on the crate, in newtons?",
      answer: { kind: "numeric", value: 30, tolerance: 0 },
      solution: "90 N - 60 N = 30 N forward.",
      misconceptions: [
        {
          id: "fm-tr-practice-adds-crate",
          triggerAnswers: ["150"],
          description: "The learner added the two forces instead of subtracting the opposing one.",
          remediationFocus: "Friction opposes the push; subtract it.",
        },
        {
          id: "fm-tr-practice-friction-only-crate",
          triggerAnswers: ["60"],
          description: "The learner reported only the friction force.",
          remediationFocus: "Combine both forces acting on the crate.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-tr-practice-crate-accel",
      concept: "second-law-application",
      prompt: "Using a net force of 30 N on a crate with mass 15 kg, what is the crate's acceleration, in m/s²?",
      answer: { kind: "numeric", value: 2, tolerance: 0 },
      solution: "a = F/m = 30 N / 15 kg = 2 m/s².",
      misconceptions: [
        {
          id: "fm-tr-practice-crate-multiplies",
          triggerAnswers: ["450"],
          description: "The learner multiplied force and mass instead of dividing.",
          remediationFocus: "Divide the net force by the mass.",
        },
        {
          id: "fm-tr-practice-crate-subtracts",
          triggerAnswers: ["15"],
          description: "The learner subtracted mass from force instead of dividing.",
          remediationFocus: "Use a = F/m, not subtraction.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-tr-practice-toy-car",
      concept: "second-law-application",
      prompt: "A 4 kg toy car must accelerate forward at 3 m/s². Friction resists its motion with 2 N. What forward force must the motor provide, in newtons?",
      answer: { kind: "numeric", value: 14, tolerance: 0 },
      solution: "Required net force: 4 kg × 3 m/s² = 12 N. The motor must also overcome the 2 N of friction: 12 N + 2 N = 14 N.",
      misconceptions: [
        {
          id: "fm-tr-practice-toy-forgets-friction",
          triggerAnswers: ["12"],
          description: "The learner computed only the required net force and forgot friction must also be overcome.",
          remediationFocus: "Add the friction force to the required net force to find the motor's needed output.",
        },
        {
          id: "fm-tr-practice-toy-subtracts-friction",
          triggerAnswers: ["10"],
          description: "The learner subtracted friction from the required net force instead of adding it.",
          remediationFocus: "Friction opposes the motor's push, so it must be added, not subtracted.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-tr-practice-wall-push",
      concept: "newtons-third-law-pairs",
      prompt:
        "You push on a wall with 40 N. By Newton's third law, the wall pushes back on you with 40 N in the opposite direction. Why doesn't this pair of equal, opposite forces mean nothing can ever move?",
      answer: {
        kind: "multipleChoice",
        options: [
          "the two 40 N forces act on different objects — one on the wall, one on you — so each object's own net force is evaluated separately",
          "the forces do cancel, so nothing can ever move when you push a wall",
          "the wall's push back is always slightly smaller than yours in practice",
        ],
        correctIndex: 0,
      },
      solution:
        "Third-law pairs act on two different objects. The wall's push acts on you, not on itself, so it affects your own net force calculation, not the wall's. Whether you move depends on the other forces acting on you, such as friction with the floor, not on this pair canceling itself.",
      misconceptions: [
        {
          id: "fm-tr-practice-wall-cancels",
          triggerAnswers: ["the forces do cancel, so nothing can ever move when you push a wall", "1"],
          description: "The learner assumed the third-law pair cancels for a single object.",
          remediationFocus: "Sum only the forces acting on one object at a time; a reaction force on a different object doesn't enter that sum.",
        },
        {
          id: "fm-tr-practice-wall-unequal",
          triggerAnswers: ["the wall's push back is always slightly smaller than yours in practice", "2"],
          description: "The learner denied that the third-law pair is truly equal in magnitude.",
          remediationFocus: "Newton's third law guarantees exactly equal magnitudes; look for a different reason nothing moves.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-tr-practice-rocket",
      concept: "newtons-third-law-pairs",
      prompt: "A rocket engine pushes exhaust gas downward; by Newton's third law, the gas pushes the rocket upward. These two forces act on:",
      answer: {
        kind: "multipleChoice",
        options: [
          "the same object — the rocket",
          "two different objects — the exhaust gas and the rocket",
          "no real object; the forces are purely theoretical",
        ],
        correctIndex: 1,
      },
      solution:
        "The engine's push acts on the exhaust gas; the gas's reaction push acts on the rocket. These are two distinct, physically real forces on two different objects, which is exactly why the rocket can accelerate even though the pair is equal and opposite.",
      misconceptions: [
        {
          id: "fm-tr-practice-rocket-same-object",
          triggerAnswers: ["the same object — the rocket", "0"],
          description: "The learner placed both forces of the pair on the rocket alone.",
          remediationFocus: "Identify the two separate objects in a third-law pair — here, the gas and the rocket.",
        },
        {
          id: "fm-tr-practice-rocket-not-real",
          triggerAnswers: ["no real object; the forces are purely theoretical", "2"],
          description: "The learner dismissed one of the paired forces as not physically real.",
          remediationFocus: "Both forces in a third-law pair are equally real and measurable; they simply act on different objects.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-tr-practice-skater",
      concept: "net-force-with-friction",
      prompt: "A skater pushes off with 100 N forward while friction from the ice resists with 10 N. What is the net force, in newtons?",
      answer: { kind: "numeric", value: 90, tolerance: 0 },
      solution: "100 N - 10 N = 90 N forward.",
      misconceptions: [
        {
          id: "fm-tr-practice-skater-adds",
          triggerAnswers: ["110"],
          description: "The learner added the two forces instead of subtracting the opposing one.",
          remediationFocus: "Subtract friction from the applied push.",
        },
        {
          id: "fm-tr-practice-skater-applied-only",
          triggerAnswers: ["100"],
          description: "The learner reported the push alone and ignored friction.",
          remediationFocus: "Combine every force acting on the skater, including friction.",
        },
      ],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
