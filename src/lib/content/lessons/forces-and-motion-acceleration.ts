import type { Lesson } from "../types";

const lesson = {
  id: "forces-and-motion-acceleration",
  title: "Newton's Second Law: a = F/m",
  track: "Physics",
  description:
    "Compute acceleration, force, or mass with F = ma, reason about how doubling force or mass changes acceleration, and separate mass from weight.",
  concepts: ["force-vs-acceleration", "second-law-computing", "mass-vs-weight", "second-law-proportional-reasoning"],
  steps: [
    {
      id: "fm-acc-step-force-not-accel",
      concept: "force-vs-acceleration",
      prompt:
        "A student says: 'If I push a box with a 10 N force, its acceleration is 10 m/s² — the numbers are just the same.' What is wrong with this claim?",
      answer: {
        kind: "multipleChoice",
        options: [
          "nothing is wrong; force in newtons always equals acceleration in m/s² directly",
          "acceleration depends on both the force and the object's mass: a = F / m, not F alone",
          "the claim is backwards: acceleration equals force times mass, so a = 10 × m",
        ],
        correctIndex: 1,
      },
      solution:
        "Force and acceleration are related but different quantities. Newton's second law is a = F / m: the same 10 N force produces a large acceleration on a small mass and a small acceleration on a large mass. The numeric value of the force only equals the acceleration when the mass happens to be exactly 1 kg — it is not a general rule.",
      misconceptions: [
        {
          id: "fm-acc-force-equals-accel",
          triggerAnswers: ["nothing is wrong; force in newtons always equals acceleration in m/s² directly", "0"],
          description:
            "The learner treated the numeric value of force as automatically equal to acceleration, ignoring mass entirely.",
          remediationFocus:
            "Write a = F / m and identify the object's mass before claiming any numeric equality between force and acceleration.",
        },
        {
          id: "fm-acc-multiplies-for-a",
          triggerAnswers: ["the claim is backwards: acceleration equals force times mass, so a = 10 × m", "2"],
          description: "The learner rearranged the second law incorrectly, multiplying by mass instead of dividing by it.",
          remediationFocus: "Solve a = F / m by dividing the net force by the mass, not multiplying.",
        },
      ],
      hints: [
        "Ask what role the object's mass plays in how much a given force accelerates it.",
        "Write Newton's second law and identify which quantity is being solved for: a.",
      ],
    },
    {
      id: "fm-acc-step-write-equation",
      concept: "second-law-computing",
      prompt:
        "Newton's second law relates net force, mass, and acceleration. Write the equation that gives the net force F in terms of mass m and acceleration a.",
      answer: { kind: "expression", acceptedForms: ["f=ma", "ma", "m*a"] },
      solution:
        "Newton's second law states that net force equals mass times acceleration: F = m × a. This can be written as F = ma or simply ma when 'F =' is understood from context.",
      misconceptions: [
        {
          id: "fm-acc-inverts-division",
          triggerAnswers: ["f=m/a"],
          description: "The learner divided mass by acceleration instead of multiplying them, inverting the relationship.",
          remediationFocus:
            "Check the pattern from your own calculations: larger mass or larger acceleration both require a larger force, which means multiplication, not division.",
        },
        {
          id: "fm-acc-adds-instead",
          triggerAnswers: ["f=m+a"],
          description:
            "The learner combined mass and acceleration by addition, as some other formulas do, instead of multiplication.",
          remediationFocus: "Newton's second law is a product relationship: F = m × a, not a sum of the two quantities.",
        },
      ],
      hints: [
        "Recall which single operation connects mass and acceleration to produce a force.",
        "Check your equation against a step where you already computed F, m, and a together — does it reproduce those numbers?",
      ],
    },
    {
      id: "fm-acc-step-solve-for-a",
      concept: "second-law-computing",
      prompt: "A 5 kg cart is pushed with a net force of 20 N. What is its acceleration, in m/s²?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution: "a = F / m = 20 N / 5 kg = 4 m/s².",
      misconceptions: [
        {
          id: "fm-acc-subtracts-for-a",
          triggerAnswers: ["15"],
          description: "The learner subtracted mass from force instead of dividing.",
          remediationFocus: "Use a = F / m; divide the net force by the mass rather than subtracting.",
        },
        {
          id: "fm-acc-multiplies-for-a-numeric",
          triggerAnswers: ["100"],
          description: "The learner multiplied force and mass instead of dividing.",
          remediationFocus: "Solving for acceleration means dividing by mass, the inverse of the multiplication used to find force.",
        },
      ],
      hints: [
        "Identify which quantity in F = ma you are solving for: a.",
        "Divide the net force by the mass.",
      ],
    },
    {
      id: "fm-acc-step-solve-for-f",
      concept: "second-law-computing",
      prompt: "A 6 kg cart accelerates at 2 m/s². What net force, in newtons, is acting on it?",
      answer: { kind: "numeric", value: 12, tolerance: 0 },
      solution: "F = m × a = 6 kg × 2 m/s² = 12 N.",
      misconceptions: [
        {
          id: "fm-acc-divides-for-f",
          triggerAnswers: ["3"],
          description: "The learner divided mass by acceleration instead of multiplying.",
          remediationFocus: "Solving for force means multiplying mass by acceleration: F = ma.",
        },
        {
          id: "fm-acc-adds-for-f",
          triggerAnswers: ["8"],
          description: "The learner added mass and acceleration instead of multiplying them.",
          remediationFocus: "Mass and acceleration combine by multiplication in Newton's second law, not addition.",
        },
      ],
      hints: [
        "Identify which quantity in F = ma you are solving for: F.",
        "Multiply the mass by the acceleration.",
      ],
    },
    {
      id: "fm-acc-step-moon-mass",
      concept: "mass-vs-weight",
      prompt:
        "A 10 kg object is taken from Earth to the Moon, where gravity is weaker. Which statement is correct?",
      answer: {
        kind: "multipleChoice",
        options: [
          "its mass becomes less than 10 kg, because it feels lighter",
          "its mass stays 10 kg; only its weight, the gravitational force on it, becomes smaller",
          "both its mass and its weight stay exactly the same everywhere",
        ],
        correctIndex: 1,
      },
      solution:
        "Mass measures the amount of matter in an object, in kilograms, and does not depend on location. Weight is the gravitational force on that mass, in newtons, equal to mass times the local gravitational acceleration (W = mg). The Moon's gravitational acceleration is weaker than Earth's, so the object's weight decreases there even though its mass — still 10 kg — is unchanged.",
      misconceptions: [
        {
          id: "fm-acc-mass-changes-with-location",
          triggerAnswers: ["its mass becomes less than 10 kg, because it feels lighter", "0"],
          description: "The learner treated mass as the same quantity as weight, which does depend on location.",
          remediationFocus: "Mass (kg) is the amount of matter and is constant; weight (N) is a force that depends on local gravity.",
        },
        {
          id: "fm-acc-weight-never-changes",
          triggerAnswers: ["both its mass and its weight stay exactly the same everywhere", "2"],
          description: "The learner assumed weight is a fixed property of the object rather than a force that depends on local gravity.",
          remediationFocus:
            "Weight = mass × local gravitational acceleration, so weight changes whenever gravitational acceleration changes, even though mass does not.",
        },
      ],
      hints: [
        "Ask which quantity is measured in kilograms and which is a force measured in newtons.",
        "Weight depends on gravitational acceleration; mass does not.",
      ],
    },
    {
      id: "fm-acc-step-double-mass",
      concept: "second-law-proportional-reasoning",
      prompt:
        "A cart accelerates at 6 m/s² under a constant net force. If the mass is doubled while the force stays the same, what is the new acceleration, in m/s²?",
      answer: { kind: "numeric", value: 3, tolerance: 0 },
      solution:
        "For a fixed force, acceleration is inversely proportional to mass (a = F/m). Doubling the mass halves the acceleration: 6 m/s² ÷ 2 = 3 m/s².",
      misconceptions: [
        {
          id: "fm-acc-doubles-with-mass",
          triggerAnswers: ["12"],
          description: "The learner assumed acceleration increases when mass increases, treating mass and acceleration as directly proportional.",
          remediationFocus:
            "For a constant force, more mass means less acceleration, not more — check the direction of the a = F/m relationship.",
        },
        {
          id: "fm-acc-ignores-mass-change",
          triggerAnswers: ["6"],
          description: "The learner reported the original acceleration unchanged, as if mass had no effect.",
          remediationFocus: "Mass is in the denominator of a = F/m, so changing it changes the acceleration even though the force is unchanged.",
        },
      ],
      hints: [
        "Write a = F/m and decide which quantity changed.",
        "Doubling the denominator of a fraction has what effect on its value?",
      ],
    },
  ],
  practice: [
    {
      id: "fm-acc-practice-solve-m",
      concept: "second-law-computing",
      prompt: "A net force of 24 N produces an acceleration of 4 m/s². What is the mass of the object, in kg?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution: "m = F / a = 24 N / 4 m/s² = 6 kg.",
      misconceptions: [
        {
          id: "fm-acc-practice-multiplies-for-m",
          triggerAnswers: ["96"],
          description: "The learner multiplied force and acceleration instead of dividing.",
          remediationFocus: "Solving for mass means dividing force by acceleration: m = F / a.",
        },
        {
          id: "fm-acc-practice-subtracts-for-m",
          triggerAnswers: ["20"],
          description: "The learner subtracted acceleration from force instead of dividing.",
          remediationFocus: "Use m = F / a, not subtraction.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-acc-practice-solve-f",
      concept: "second-law-computing",
      prompt: "A 3 kg ball accelerates at 7 m/s². What net force acts on it, in newtons?",
      answer: { kind: "numeric", value: 21, tolerance: 0 },
      solution: "F = m × a = 3 kg × 7 m/s² = 21 N.",
      misconceptions: [
        {
          id: "fm-acc-practice-adds-for-f",
          triggerAnswers: ["10"],
          description: "The learner added mass and acceleration instead of multiplying.",
          remediationFocus: "Force is mass times acceleration, not their sum.",
        },
        {
          id: "fm-acc-practice-subtracts-for-f",
          triggerAnswers: ["4"],
          description: "The learner subtracted mass from acceleration instead of multiplying.",
          remediationFocus: "Multiply the mass by the acceleration: F = ma.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-acc-practice-solve-a",
      concept: "second-law-computing",
      prompt: "A net force of 45 N acts on a 9 kg crate. What is its acceleration, in m/s²?",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution: "a = F / m = 45 N / 9 kg = 5 m/s².",
      misconceptions: [
        {
          id: "fm-acc-practice-multiplies-for-a",
          triggerAnswers: ["405"],
          description: "The learner multiplied force and mass instead of dividing.",
          remediationFocus: "Divide the net force by the mass: a = F/m.",
        },
        {
          id: "fm-acc-practice-subtracts-for-a",
          triggerAnswers: ["36"],
          description: "The learner subtracted mass from force instead of dividing.",
          remediationFocus: "Use division, not subtraction, to solve for acceleration.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-acc-practice-force-not-accel",
      concept: "force-vs-acceleration",
      prompt:
        "A student claims a 12 N force always produces a 12 m/s² acceleration, no matter the object's mass. Which best corrects this claim?",
      answer: {
        kind: "multipleChoice",
        options: [
          "true; force and acceleration are always numerically equal",
          "false; acceleration is force divided by mass, so it depends on the object's mass",
          "false; acceleration is force multiplied by mass",
        ],
        correctIndex: 1,
      },
      solution:
        "Acceleration equals force divided by mass (a = F/m); the same 12 N force produces different accelerations on different masses.",
      misconceptions: [
        {
          id: "fm-acc-practice-force-equals-accel",
          triggerAnswers: ["true; force and acceleration are always numerically equal", "0"],
          description: "The learner treated force and acceleration as always numerically equal, ignoring mass.",
          remediationFocus: "Divide by the object's mass to find acceleration; do not assume the numbers match.",
        },
        {
          id: "fm-acc-practice-multiplies-mass",
          triggerAnswers: ["false; acceleration is force multiplied by mass", "2"],
          description: "The learner multiplied instead of divided when solving for acceleration.",
          remediationFocus: "Isolating a in F = ma requires dividing by m, not multiplying.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-acc-practice-mass-weight",
      concept: "mass-vs-weight",
      prompt: "Which statement correctly distinguishes mass from weight?",
      answer: {
        kind: "multipleChoice",
        options: [
          "mass and weight are the same physical quantity, just in different units",
          "mass is the amount of matter in an object (kg) and stays constant; weight is the gravitational force on that mass (N) and can change",
          "weight is whatever a scale shows and never depends on gravity",
        ],
        correctIndex: 1,
      },
      solution:
        "Mass and weight are different physical quantities. Mass (kg) measures matter and is constant; weight (N) is a force equal to mass times local gravitational acceleration, so it changes when gravity changes.",
      misconceptions: [
        {
          id: "fm-acc-practice-mass-weight-same",
          triggerAnswers: ["mass and weight are the same physical quantity, just in different units", "0"],
          description: "The learner treated mass and weight as the same quantity in different units.",
          remediationFocus: "Mass is measured in kilograms and is constant; weight is a force, measured in newtons, and depends on gravity.",
        },
        {
          id: "fm-acc-practice-weight-fixed",
          triggerAnswers: ["weight is whatever a scale shows and never depends on gravity", "2"],
          description: "The learner assumed weight never depends on gravity.",
          remediationFocus: "Weight = mass × local gravitational acceleration; it changes wherever gravitational acceleration changes.",
        },
      ],
      hints: [],
    },
    {
      id: "fm-acc-practice-double-force",
      concept: "second-law-proportional-reasoning",
      prompt:
        "A cart accelerates at 3 m/s² under a net force F. If the net force is doubled while the mass stays the same, what is the new acceleration, in m/s²?",
      answer: { kind: "numeric", value: 6, tolerance: 0 },
      solution:
        "For a fixed mass, acceleration is directly proportional to force (a = F/m). Doubling the force doubles the acceleration: 3 m/s² × 2 = 6 m/s².",
      misconceptions: [
        {
          id: "fm-acc-practice-force-no-effect",
          triggerAnswers: ["3"],
          description: "The learner assumed acceleration is unaffected by a change in force.",
          remediationFocus: "Force is in the numerator of a = F/m; changing it changes the acceleration proportionally.",
        },
        {
          id: "fm-acc-practice-inverts-force-doubling",
          triggerAnswers: ["1.5"],
          description:
            "The learner halved the acceleration instead of doubling it, inverting the direct relationship between force and acceleration.",
          remediationFocus:
            "Unlike mass, force is directly proportional to acceleration — doubling force doubles acceleration, it does not halve it.",
        },
      ],
      hints: [],
    },
  ],
} satisfies Lesson;

export default lesson;
