import type { Lesson } from "../types";

const lesson = {
  id: "functions-as-change-rate-of-change",
  title: "Functions as Change: Read the Rate",
  track: "Algebra",
  description:
    "Find how much an output changes for each unit of input, then separate that rate from a starting value.",
  concepts: ["rate-of-change", "constant-rate", "initial-value"],
  steps: [
    {
      id: "step-1",
      concept: "rate-of-change",
      prompt:
        "A water-level table shows 10 cm at 0 minutes and 18 cm at 2 minutes. If the change is constant, what is the rate of change in centimetres per minute?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution:
        "The water level rises 18 − 10 = 8 cm while time rises 2 − 0 = 2 minutes. Rate of change is output change divided by input change: 8/2 = 4 cm per minute.",
      misconceptions: [
        {
          id: "reports-total-change",
          triggerAnswers: ["8"],
          description: "The learner found the output change but did not divide by the time change.",
          remediationFocus: "A rate compares a change in output with the corresponding change in input.",
        },
        {
          id: "divides-ending-value-by-time",
          triggerAnswers: ["9"],
          description: "The learner divided the ending level by time instead of using the difference in levels.",
          remediationFocus: "Subtract starting values before forming a rate; rates use changes, not final values alone.",
        },
      ],
      hints: [
        "Find how much the water level changed first.",
        "Find how much time changed, then divide level change by time change.",
        "Include the unit ‘per minute’ in your interpretation.",
      ],
    },
    {
      id: "step-2",
      concept: "initial-value",
      prompt:
        "A height model is h(t) = 3t + 12. What is h(0), the starting height?",
      answer: {
        kind: "multipleChoice",
        options: ["3", "12", "15"],
        correctIndex: 1,
      },
      solution:
        "At t = 0, the changing part 3t is zero, leaving h(0) = 12. In a linear rule of the form rate × input + initial value, the constant term is the value at input zero.",
      misconceptions: [
        {
          id: "uses-rate-as-start",
          triggerAnswers: ["0"],
          description: "The learner identified the coefficient 3 as the starting value.",
          remediationFocus: "The coefficient tells how the output changes per input; evaluate at input zero to find the start.",
        },
        {
          id: "adds-coefficient-and-constant",
          triggerAnswers: ["2"],
          description: "The learner combined parts of the rule rather than evaluating it at zero.",
          remediationFocus: "Substitute the requested input before interpreting the result.",
        },
      ],
      hints: ["Put t = 0 into the rule. What happens to 3t?"],
    },
    {
      id: "step-3",
      concept: "constant-rate",
      prompt: "Using h(t) = 3t + 12, what is the height after 5 time units?",
      answer: { kind: "numeric", value: 27, tolerance: 0 },
      solution:
        "Substitute t = 5: h(5) = 3(5) + 12 = 15 + 12 = 27. The starting height and the accumulated change are both needed.",
      misconceptions: [
        {
          id: "uses-rate-times-input-only",
          triggerAnswers: ["15"],
          description: "The learner calculated the accumulated change but omitted the initial height.",
          remediationFocus: "A model with a nonzero initial value needs that starting amount added after calculating the change.",
        },
        {
          id: "adds-before-multiplying",
          triggerAnswers: ["51"],
          description: "The learner added 12 and 5 before applying the rate.",
          remediationFocus: "Preserve the multiplication in 3t before adding the initial value.",
        },
      ],
      hints: ["Calculate the change 3 × 5, then add the starting value 12."],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "rate-of-change",
      prompt:
        "A table shows y = 7 when x = 1 and y = 19 when x = 4. If the change is constant, what is the rate of change?",
      answer: { kind: "numeric", value: 4, tolerance: 0 },
      solution: "The output change is 19 − 7 = 12 and the input change is 4 − 1 = 3, so the rate is 12/3 = 4.",
      misconceptions: [
        {
          id: "reports-output-change",
          triggerAnswers: ["12"],
          description: "The learner found the vertical change but did not compare it with the horizontal change.",
          remediationFocus: "Rate is a ratio of changes: change in y over change in x.",
        },
      ],
      hints: ["Subtract y-values and x-values separately, then divide the two changes."],
    },
    {
      id: "practice-2",
      concept: "constant-rate",
      prompt: "In y = 5x − 2, how does y change when x increases by 1?",
      answer: {
        kind: "multipleChoice",
        options: ["it increases by 5", "it decreases by 2", "it increases by 3"],
        correctIndex: 0,
      },
      solution:
        "The coefficient of x is 5, so each one-unit increase in x raises y by 5. The −2 is the initial value, not the change per unit.",
      misconceptions: [
        {
          id: "uses-intercept-as-rate",
          triggerAnswers: ["1"],
          description: "The learner interpreted the constant term as a per-input change.",
          remediationFocus: "Look for the quantity multiplying x to identify the constant rate.",
        },
      ],
      hints: ["Which number is attached to x? That number controls the per-unit change."],
    },
    {
      id: "practice-3",
      concept: "initial-value",
      prompt:
        "Near transfer: A path begins 2 km from a trailhead and increases by 0.5 km each minute. After 6 minutes, how far is it from the trailhead?",
      answer: { kind: "numeric", value: 5, tolerance: 0 },
      solution:
        "The change after six minutes is 0.5 × 6 = 3 km. Add the 2 km starting distance: 5 km. This calculation assumes the stated constant-rate model holds for those six minutes.",
      misconceptions: [
        {
          id: "omits-starting-distance",
          triggerAnswers: ["3"],
          description: "The learner calculated only the distance added after the start.",
          remediationFocus: "Separate accumulated change from the value at time zero, then combine them.",
        },
      ],
      hints: ["Find the added distance first, then include the initial 2 km."],
    },
  ],
} satisfies Lesson;

export default lesson;
