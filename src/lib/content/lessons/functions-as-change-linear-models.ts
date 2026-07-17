import type { Lesson } from "../types";

const lesson = {
  id: "functions-as-change-linear-models",
  title: "Functions as Change: Build and Bound a Linear Model",
  track: "Algebra",
  description:
    "Connect a linear rule to its rate and initial value, then state what a model does and does not justify.",
  concepts: ["linear-model", "rate-and-intercept", "model-boundary"],
  steps: [
    {
      id: "step-1",
      concept: "rate-and-intercept",
      prompt: "In the rule y = 4x + 7, what is the change in y for each one-unit increase in x?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution:
        "The coefficient of x is 4, so y increases by 4 for each one-unit increase in x. The 7 is the value when x = 0, not the rate.",
      misconceptions: [
        {
          id: "uses-intercept-as-rate",
          triggerAnswers: ["7"],
          description: "The learner treated the initial value as the per-unit change.",
          remediationFocus: "In a linear rule, the number multiplying the input is the constant rate of change.",
        },
      ],
      hints: ["Identify the number attached to x; it tells how much y changes per one x."],
    },
    {
      id: "step-2",
      concept: "linear-model",
      prompt:
        "A supply model is S(d) = 18 + 2d, where d is days after the first count. What is S(5)?",
      answer: { kind: "numeric", value: 28, tolerance: 0 },
      solution:
        "Substitute d = 5: S(5) = 18 + 2(5) = 28. The model begins at 18 and adds 2 units per day.",
      misconceptions: [
        {
          id: "uses-change-only",
          triggerAnswers: ["10"],
          description: "The learner calculated 2 × 5 but omitted the initial count.",
          remediationFocus: "A linear model combines a starting value with the accumulated rate-based change.",
        },
        {
          id: "uses-starting-value-only",
          triggerAnswers: ["18"],
          description: "The learner ignored five days of modeled change.",
          remediationFocus: "Apply the rate to the requested input before adding it to the start.",
        },
      ],
      hints: ["Find the change after five days, then add it to the initial 18."],
    },
    {
      id: "step-3",
      concept: "model-boundary",
      prompt:
        "Which statement is justified by the rule S(d) = 18 + 2d when it was fitted for the first 10 days of counting?",
      answer: {
        kind: "multipleChoice",
        options: [
          "It predicts the stated supply value within the first 10 days if the constant-rate assumption is suitable.",
          "It proves the supply will rise by 2 every day forever.",
          "It proves every earlier count was exact.",
        ],
        correctIndex: 0,
      },
      solution:
        "A linear model is a stated rule for a stated context and range. It can support a prediction within the described range if its constant-rate assumption is suitable; it does not prove an unlimited future pattern or certify every measurement.",
      misconceptions: [
        {
          id: "extends-model-without-bound",
          triggerAnswers: ["1"],
          description: "The learner turned a local model into a guarantee about all future inputs.",
          remediationFocus: "Keep the model’s context, input range, and assumptions visible when interpreting a prediction.",
        },
        {
          id: "treats-model-as-measurement-proof",
          triggerAnswers: ["2"],
          description: "The learner confused a model’s rule with proof that every observed count was exact.",
          remediationFocus: "A model summarizes a relationship; it does not remove uncertainty or measurement limits.",
        },
      ],
      hints: ["Look for the option that keeps the stated 10-day range and names the constant-rate assumption."],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "rate-and-intercept",
      prompt: "In y = −3x + 20, how does y change when x increases by 1?",
      answer: {
        kind: "multipleChoice",
        options: ["it decreases by 3", "it increases by 20", "it decreases by 23"],
        correctIndex: 0,
      },
      solution:
        "The coefficient −3 is the rate, so each one-unit increase in x decreases y by 3. The 20 is the initial value.",
      misconceptions: [
        {
          id: "uses-initial-value-as-change",
          triggerAnswers: ["1"],
          description: "The learner interpreted the constant term as the rate of change.",
          remediationFocus: "The sign and size of the x coefficient, not the constant, describe change per input unit.",
        },
      ],
      hints: ["The number multiplying x includes the direction of change."],
    },
    {
      id: "practice-2",
      concept: "linear-model",
      prompt:
        "A table has x = 0 paired with y = 4 and x = 3 paired with y = 13. Assuming a constant rate, what is y when x = 5?",
      answer: { kind: "numeric", value: 19, tolerance: 0 },
      solution:
        "The rate is (13 − 4)/(3 − 0) = 3, and the initial value is 4. The rule is y = 3x + 4, so y(5) = 19.",
      misconceptions: [
        {
          id: "uses-output-change-as-rate",
          triggerAnswers: ["49"],
          description: "The learner used 9 as a per-unit rate instead of dividing by the three input units.",
          remediationFocus: "Compute the rate as change in y divided by change in x before extending the pattern.",
        },
      ],
      hints: ["First find the change per one x-unit between the two rows."],
    },
    {
      id: "practice-3",
      concept: "model-boundary",
      prompt:
        "Near transfer: A battery model is E(m) = 90 − 6m for m minutes during a short test. What does the model predict at m = 4?",
      answer: { kind: "numeric", value: 66, tolerance: 0 },
      solution:
        "Substitute 4: E(4) = 90 − 6(4) = 66. It is a prediction for the stated short test, not proof that every battery follows the same rule outside that context.",
      misconceptions: [
        {
          id: "adds-loss-instead-of-subtracting",
          triggerAnswers: ["114"],
          description: "The learner treated the −6 per minute loss as an increase.",
          remediationFocus: "Use the sign of the rate to decide whether the model adds or removes value over time.",
        },
      ],
      hints: ["Calculate six times four, then apply the minus sign to the starting value."],
    },
  ],
} satisfies Lesson;

export default lesson;
