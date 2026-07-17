import type { Lesson } from "../types";

const lesson = {
  id: "claims-to-evidence-falsifiable-comparison",
  title: "Claims to Evidence: Design a Comparison That Could Challenge a Claim",
  track: "Research Methods",
  description:
    "Specify a comparison and an outcome that could count against a claim instead of collecting only confirming stories.",
  concepts: ["comparison", "falsifiability", "fair-conditions"],
  steps: [
    {
      id: "step-1",
      concept: "comparison",
      prompt:
        "A claim says a revised sign helps people find the recycling bin. Which plan makes a direct comparison?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Time similar visitors finding the bin with the old sign and with the revised sign, using the same starting point.",
          "Ask the sign designer whether the revised sign is clearer.",
          "Photograph the revised sign after it is installed.",
        ],
        correctIndex: 0,
      },
      solution:
        "A comparison needs an outcome measured under two relevant conditions. Timing similar visitors from the same start with the old and revised signs gives two records that can be compared. A designer opinion or photograph may document the sign, but neither tests the finding outcome.",
      misconceptions: [
        {
          id: "uses-designer-opinion",
          triggerAnswers: ["1"],
          description: "The learner chose a creator’s opinion rather than an outcome comparison.",
          remediationFocus: "Collect the stated outcome from users under both conditions.",
        },
        {
          id: "documents-without-testing",
          triggerAnswers: ["2"],
          description: "The learner documented the intervention but did not compare its claimed effect.",
          remediationFocus: "A test needs a measure that could differ between a baseline and a revised condition.",
        },
      ],
      hints: [
        "The claim is about helping people find something, not about the sign’s appearance.",
        "A comparison includes a baseline condition and a revised condition measured in the same way.",
        "Choose the plan that records finding time for old and revised signs from the same start.",
      ],
    },
    {
      id: "step-2",
      concept: "falsifiability",
      prompt:
        "For the sign claim, which possible result would count against the idea that the revised sign helps people find the bin faster?",
      answer: {
        kind: "multipleChoice",
        options: [
          "The revised-sign group takes longer on the same finding task than the old-sign group.",
          "The revised sign uses a new colour.",
          "The team still hopes the sign will help.",
        ],
        correctIndex: 0,
      },
      solution:
        "If a revised sign is claimed to make finding faster, longer times under the same task challenge that claim. Its colour and the team’s hope do not tell us whether finding became faster. A claim is testable when some possible observation could count against it.",
      misconceptions: [
        {
          id: "uses-feature-not-outcome",
          triggerAnswers: ["1"],
          description: "The learner named a design feature rather than evidence about the claimed effect.",
          remediationFocus: "Connect the possible result to the exact outcome word in the claim.",
        },
        {
          id: "uses-belief-not-test",
          triggerAnswers: ["2"],
          description: "The learner chose a belief that cannot challenge or support the measured claim.",
          remediationFocus: "Ask what result would make a reasonable investigator reconsider the claim.",
        },
      ],
      hints: [
        "The claim predicts a direction: finding should be faster.",
        "What measured result would point in the opposite direction?",
        "Choose the result in which the revised condition has longer, not shorter, finding times.",
      ],
    },
    {
      id: "step-3",
      concept: "fair-conditions",
      prompt:
        "Which detail most improves the fairness of a comparison between an old and revised route map?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Give both groups the same destination question and the same time limit.",
          "Let the revised-map group choose an easier destination.",
          "Show the revised-map group the answer before timing begins.",
        ],
        correctIndex: 0,
      },
      solution:
        "A comparison is more interpretable when the relevant task conditions are held alike. The same destination question and time limit reduce a clear alternative explanation. Easier destinations or advance answers change more than the map and make the groups difficult to compare.",
      misconceptions: [
        {
          id: "changes-task-difficulty",
          triggerAnswers: ["1"],
          description: "The learner allowed a condition besides the map to vary between groups.",
          remediationFocus: "Keep the task alike so the intended difference is not mixed with an easier challenge.",
        },
        {
          id: "reveals-answer",
          triggerAnswers: ["2"],
          description: "The learner gave one group information that directly changes the outcome.",
          remediationFocus: "Avoid supplying a group with an advantage unrelated to the condition being compared.",
        },
      ],
      hints: [
        "Ask whether both groups face the same task apart from the map version.",
        "A fair comparison tries not to change the question, timing, or advance information at the same time.",
        "Choose the option that keeps destination and time conditions identical.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "comparison",
      prompt:
        "Work unaided: A club claims a reminder card reduces missed meetings. Which plan best tests that claim?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Compare the recorded missed-meeting rate for similar meeting periods with and without the reminder card.",
          "Ask the card illustrator whether the card is memorable.",
          "Count how many colours appear on the card.",
        ],
        correctIndex: 0,
      },
      solution:
        "The claim concerns missed meetings, so a useful plan compares recorded missed-meeting rates across periods that differ in the reminder condition. The illustrator’s view and the card’s colours do not measure missed attendance.",
      misconceptions: [
        {
          id: "uses-illustrator-opinion",
          triggerAnswers: ["1"],
          description: "The learner selected an opinion about the intervention rather than the claimed outcome.",
          remediationFocus: "Measure the behavior named in the claim under both relevant conditions.",
        },
        {
          id: "counts-unrelated-feature",
          triggerAnswers: ["2"],
          description: "The learner measured a visual feature unrelated to missed meetings.",
          remediationFocus: "Distinguish properties of an intervention from evidence about its effect.",
        },
      ],
      hints: [
        "The outcome word is ‘missed meetings.’",
        "A comparison needs data from a period with the card and a comparable period without it.",
        "Choose the option that compares recorded absence outcomes, not design opinions.",
      ],
    },
    {
      id: "practice-2",
      concept: "falsifiability",
      prompt:
        "Work unaided: A claim says a clearer checkout instruction reduces form errors. Which result would challenge the claim?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Under the same form task, the clearer-instruction group has more recorded errors.",
          "The instruction is printed in blue.",
          "The writer is proud of the instruction.",
        ],
        correctIndex: 0,
      },
      solution:
        "The claim predicts fewer errors. More recorded errors under comparable conditions would challenge that prediction. Ink colour and the writer’s pride do not report the claimed outcome and cannot serve as contrary evidence.",
      misconceptions: [
        {
          id: "uses-colour-as-evidence",
          triggerAnswers: ["1"],
          description: "The learner selected a feature that does not measure form errors.",
          remediationFocus: "Identify the outcome predicted by the claim and look for a result in the opposite direction.",
        },
        {
          id: "uses-author-belief",
          triggerAnswers: ["2"],
          description: "The learner treated confidence as if it could test an outcome claim.",
          remediationFocus: "A test turns on observations that could disagree with the prediction, not on commitment to it.",
        },
      ],
      hints: [
        "The prediction is ‘reduces errors.’",
        "Contrary evidence would show errors moving the other way under a comparable task.",
        "Choose the result with more recorded errors after the clearer instruction.",
      ],
    },
    {
      id: "practice-3",
      concept: "fair-conditions",
      prompt:
        "Near transfer — work unaided: A garden group compares two seed labels to see which helps volunteers plant at the right depth. Which condition should stay the same?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Give both groups the same seed type, bed, and depth-check method; change only the label version.",
          "Give one group a demonstration and the other group no instructions.",
          "Let one group use a ruler and the other group estimate by sight.",
        ],
        correctIndex: 0,
      },
      solution:
        "The question is about label versions. Holding seed type, bed, and depth-check method the same reduces alternative explanations for any difference. A demonstration or different measuring tools would change additional conditions that can affect planting depth.",
      misconceptions: [
        {
          id: "adds-unequal-demonstration",
          triggerAnswers: ["1"],
          description: "The learner added unequal instruction, so any difference could be due to the demonstration.",
          remediationFocus: "Keep assistance levels alike when the label is the condition being tested.",
        },
        {
          id: "changes-measurement-method",
          triggerAnswers: ["2"],
          description: "The learner varied the way the outcome is measured between groups.",
          remediationFocus: "Use one outcome rule for both groups so their records mean the same thing.",
        },
      ],
      hints: [
        "The planned difference is the label version, not a lesson or tool.",
        "Other conditions should not give one group an extra advantage or a different measurement rule.",
        "Choose the option that changes only the label while keeping task and checking method alike.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
