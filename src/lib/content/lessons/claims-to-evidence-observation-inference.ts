import type { Lesson } from "../types";

const lesson = {
  id: "claims-to-evidence-observation-inference",
  title: "Claims to Evidence: Separate What Was Seen from What Is Inferred",
  track: "Research Methods",
  description:
    "Distinguish recorded observations from interpretations, then choose conclusions whose wording stays within the evidence collected.",
  concepts: ["observation", "inference", "bounded-conclusion"],
  steps: [
    {
      id: "step-1",
      concept: "observation",
      prompt:
        "In a reading-room trial, 12 of 20 visitors found a requested article within five minutes. Which statement is an observation from the record?",
      answer: {
        kind: "multipleChoice",
        options: [
          "12 of the 20 recorded visitors found the article within five minutes.",
          "The room layout definitely causes people to read better.",
          "Every future visitor will find articles quickly.",
        ],
        correctIndex: 0,
      },
      solution:
        "An observation reports what was recorded: 12 of these 20 visitors met the stated time condition. Claims about causes or all future visitors go beyond the recorded count and require additional assumptions or evidence.",
      misconceptions: [
        {
          id: "turns-count-into-cause",
          triggerAnswers: ["1"],
          description: "The learner treated an observed count as proof of a causal explanation.",
          remediationFocus: "First state the count and conditions exactly; explanations are separate inferences.",
        },
        {
          id: "generalizes-to-all-future-visitors",
          triggerAnswers: ["2"],
          description: "The learner expanded a finite record into a universal prediction.",
          remediationFocus: "Keep the scope of a conclusion tied to the group and time actually observed.",
        },
      ],
      hints: [
        "An observation can be checked directly against the record.",
        "Which option repeats the given number, group, and condition without adding a reason or prediction?",
        "Choose the statement that says exactly what happened for the 20 recorded visitors.",
      ],
    },
    {
      id: "step-2",
      concept: "inference",
      prompt:
        "A class records that seedlings by a window grew 9 cm on average while seedlings in a cupboard grew 2 cm on average during the same week. Which statement is an inference rather than a direct observation?",
      answer: {
        kind: "multipleChoice",
        options: [
          "The window group’s recorded average was 9 cm.",
          "Light may be one explanation for the difference in these recorded averages.",
          "The cupboard group’s recorded average was 2 cm.",
        ],
        correctIndex: 1,
      },
      solution:
        "The two averages are observations from the record. Saying that light may explain their difference connects the observations to a possible cause, so it is an inference. The word ‘may’ keeps the explanation tentative rather than pretending the measurements settled every alternative explanation.",
      misconceptions: [
        {
          id: "labels-recorded-average-as-inference",
          triggerAnswers: ["0", "2"],
          description: "The learner confused a measured summary with an explanation for it.",
          remediationFocus: "Ask whether the statement reports a value, or supplies a reason the value might differ.",
        },
      ],
      hints: [
        "The data directly give two averages.",
        "An inference adds an explanation that is not itself a measurement.",
        "Choose the option that suggests a possible reason for the difference.",
      ],
    },
    {
      id: "step-3",
      concept: "bounded-conclusion",
      prompt:
        "A pilot compares 10 users with an old checklist and 10 different users with a revised checklist. The revised group makes fewer recorded omissions. Which conclusion is best bounded by this evidence?",
      answer: {
        kind: "multipleChoice",
        options: [
          "In this small pilot, the revised-checklist group had fewer recorded omissions; a larger, well-controlled comparison would be needed before making a broad claim.",
          "The revised checklist proves it will reduce every omission everywhere.",
          "The old checklist caused all omissions in the pilot.",
        ],
        correctIndex: 0,
      },
      solution:
        "The record supports a comparison of these two pilot groups: the revised group had fewer recorded omissions. Because the groups were small and different people used each version, the evidence alone does not prove a universal effect or identify every cause of every omission.",
      misconceptions: [
        {
          id: "universalizes-pilot",
          triggerAnswers: ["1"],
          description: "The learner converted a limited comparison into an all-settings guarantee.",
          remediationFocus: "State what happened in the observed comparison before extending a conclusion beyond it.",
        },
        {
          id: "assigns-total-causation",
          triggerAnswers: ["2"],
          description: "The learner claimed one condition caused every outcome despite unmeasured alternatives.",
          remediationFocus: "Separate a group difference from a complete causal account.",
        },
      ],
      hints: [
        "The evidence describes a pilot with two small groups, not every possible user and setting.",
        "Look for wording that preserves the observed difference and names its limit.",
        "Choose the conclusion scoped to ‘this small pilot’ rather than a promise about everywhere.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "observation",
      prompt:
        "Work unaided: In a transit survey, 34 of 50 respondents say they used a bus this week. Which statement is an observation?",
      answer: {
        kind: "multipleChoice",
        options: [
          "34 of the 50 respondents reported using a bus this week.",
          "Buses are the best way for everyone to travel.",
          "The transit survey changed how respondents travel.",
        ],
        correctIndex: 0,
      },
      solution:
        "The record supports only the stated response count among these 50 respondents. A claim about the best travel method or an effect of the survey adds judgment or causation not contained in the response count.",
      misconceptions: [
        {
          id: "uses-value-judgment",
          triggerAnswers: ["1"],
          description: "The learner replaced a reportable count with a broad preference claim.",
          remediationFocus: "Repeat the recorded group, number, and question before interpreting it.",
        },
        {
          id: "asserts-survey-causation",
          triggerAnswers: ["2"],
          description: "The learner inferred a behavior change from a survey response alone.",
          remediationFocus: "Identify whether a statement is a measurement or an untested explanation.",
        },
      ],
      hints: [
        "Use only information directly given by the survey record.",
        "The group is the 50 respondents, not everyone who travels.",
        "Choose the option that reports the exact count and response condition.",
      ],
    },
    {
      id: "practice-2",
      concept: "inference",
      prompt:
        "Work unaided: Two display tables receive the same number of visitors; one table has more item pickups. Which statement is an inference?",
      answer: {
        kind: "multipleChoice",
        options: [
          "The first table had 18 pickups.",
          "The table’s position may have contributed to the higher pickup count.",
          "The second table had 9 pickups.",
        ],
        correctIndex: 1,
      },
      solution:
        "The pickup counts are observations. Suggesting that position may have contributed is an inference because it offers a possible reason. It is carefully tentative because other features could also differ.",
      misconceptions: [
        {
          id: "mistakes-count-for-explanation",
          triggerAnswers: ["0", "2"],
          description: "The learner chose a direct count instead of a possible explanation.",
          remediationFocus: "Look for language that adds a reason, not merely a recorded value.",
        },
      ],
      hints: [
        "An inference answers ‘why might this have happened?’",
        "Counts are observations; causes are not directly printed in a count.",
        "Choose the statement that proposes a tentative explanation.",
      ],
    },
    {
      id: "practice-3",
      concept: "bounded-conclusion",
      prompt:
        "Near transfer — work unaided: In one afternoon, 7 of 10 students who tried a new note format recalled all four terms on an immediate check. Which conclusion is best supported?",
      answer: {
        kind: "multipleChoice",
        options: [
          "In this immediate, small check, 7 of 10 students recalled all four terms; this does not establish durable learning for all students.",
          "The note format guarantees long-term memory for every student.",
          "Students who did not recall all four terms did not try hard enough.",
        ],
        correctIndex: 0,
      },
      solution:
        "The evidence is an immediate result from ten students and four terms. It supports reporting that result with its scope. It cannot establish long-term retention, a result for every student, or a reason for any individual’s outcome.",
      misconceptions: [
        {
          id: "claims-durable-universal-learning",
          triggerAnswers: ["1"],
          description: "The learner treated an immediate small observation as a universal long-term guarantee.",
          remediationFocus: "Name the time, group, and outcome actually measured before making a conclusion.",
        },
        {
          id: "assigns-unmeasured-motive",
          triggerAnswers: ["2"],
          description: "The learner invented an explanation about individual effort without evidence.",
          remediationFocus: "Do not turn an outcome record into a claim about a learner’s motive or character.",
        },
      ],
      hints: [
        "The check happened once, immediately, with ten students.",
        "A supported conclusion includes those limits instead of predicting lasting results.",
        "Choose the option that reports 7 of 10 and explicitly avoids a durable-learning claim.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
