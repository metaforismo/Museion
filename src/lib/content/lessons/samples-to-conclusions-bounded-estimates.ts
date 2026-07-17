import type { Lesson } from "../types";

const lesson = {
  id: "samples-to-conclusions-bounded-estimates",
  title: "Samples to Conclusions: Report an Estimate Without Overclaiming",
  track: "Research Methods",
  description:
    "Turn a sample count into an estimate, state the sample’s scope, and avoid claims that the observed data cannot support.",
  concepts: ["estimate", "scope", "overclaiming"],
  steps: [
    {
      id: "step-1",
      concept: "estimate",
      prompt:
        "A randomly selected sample of 40 eligible workshop attendees includes 24 people who used the worksheet. What is the sample estimate for worksheet use? Write a fraction, decimal, or percent.",
      answer: { kind: "expression", acceptedForms: ["24/40", "3/5", "0.6", "60%"] },
      solution:
        "The estimate from this sample is the observed proportion: 24 out of 40, or 24/40 = 3/5 = 0.6 = 60%. It is an estimate for the stated eligible-attendee group under this sampling description, not a guarantee about every setting or future workshop.",
      misconceptions: [
        {
          id: "reports-count-not-estimate",
          triggerAnswers: ["24"],
          description: "The learner gave the count using the worksheet rather than a part-of-sample estimate.",
          remediationFocus: "Divide the observed count by the full sample count to form an estimate.",
        },
        {
          id: "reverses-proportion",
          triggerAnswers: ["40/24", "1.6667"],
          description: "The learner reversed the sample proportion.",
          remediationFocus: "The count with the feature goes over the total number sampled.",
        },
      ],
      hints: [
        "An estimate here is the observed part of the sample.",
        "Use 24 as the part and 40 as the whole sample.",
        "Compute 24/40, which simplifies to 3/5 or 0.6 (60%).",
      ],
    },
    {
      id: "step-2",
      concept: "scope",
      prompt:
        "Which statement keeps the 60% estimate in its proper scope?",
      answer: {
        kind: "multipleChoice",
        options: [
          "In this sample of 40 eligible attendees, 60% used the worksheet; it is an estimate for the stated attendee group.",
          "Exactly 60% of every learner everywhere uses worksheets.",
          "Every future workshop attendee will use the worksheet.",
        ],
        correctIndex: 0,
      },
      solution:
        "The result directly describes 24 of 40 sampled eligible attendees and can be offered as an estimate for the defined group when the stated sampling condition applies. It does not establish an exact fact about every learner or guarantee each future individual’s action.",
      misconceptions: [
        {
          id: "extends-to-all-learners",
          triggerAnswers: ["1"],
          description: "The learner expanded a defined sample estimate to every learner in every setting.",
          remediationFocus: "Name the sampled group and avoid changing it into a universal population without supporting design.",
        },
        {
          id: "guarantees-individual-future-outcome",
          triggerAnswers: ["2"],
          description: "The learner treated a group proportion as a prediction for every future person.",
          remediationFocus: "A percentage summarizes a group; it does not determine an individual outcome.",
        },
      ],
      hints: [
        "The data come from 40 eligible attendees, not every learner.",
        "Careful wording keeps both the group and the estimate visible.",
        "Choose the option beginning with ‘In this sample of 40 eligible attendees.’",
      ],
    },
    {
      id: "step-3",
      concept: "overclaiming",
      prompt:
        "The workshop sample was collected from volunteers who chose to complete an optional feedback card. Which additional caution is most appropriate?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Volunteer feedback may not represent all eligible attendees, so the estimate should be described with that collection limit.",
          "The voluntary responses prove the worksheet caused attendance.",
          "Because volunteers responded, no count from the card can be reported.",
        ],
        correctIndex: 0,
      },
      solution:
        "Optional volunteers may differ from attendees who did not complete the card, so representativeness is a real limitation for a broad estimate. The collected count can still be reported honestly as volunteer feedback. It does not establish a causal effect on attendance.",
      misconceptions: [
        {
          id: "infers-causation-from-volunteer-card",
          triggerAnswers: ["1"],
          description: "The learner claimed a causal effect that the voluntary feedback design did not test.",
          remediationFocus: "Separate a response proportion from a controlled comparison of causes.",
        },
        {
          id: "discards-observation-entirely",
          triggerAnswers: ["2"],
          description: "The learner treated a representativeness limit as if it erased the observed volunteer responses.",
          remediationFocus: "Report the observed group accurately while limiting the conclusion to what that group can support.",
        },
      ],
      hints: [
        "Ask who had the chance to respond and who chose to respond.",
        "A limitation can narrow a conclusion without making an observed count disappear.",
        "Choose the option that reports volunteer feedback while warning against treating it as all attendees.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "estimate",
      prompt:
        "Work unaided: In a sample of 30 community-garden plots, 18 use mulch. What is the sample estimate for mulch use? Write a fraction, decimal, or percent.",
      answer: { kind: "expression", acceptedForms: ["18/30", "3/5", "0.6", "60%"] },
      solution:
        "The observed mulch-use count is 18 out of 30 sampled plots. The sample estimate is therefore 18/30 = 3/5 = 0.6 = 60%. It summarizes these sampled plots.",
      misconceptions: [
        {
          id: "reports-mulch-count-only",
          triggerAnswers: ["18"],
          description: "The learner reported the count with mulch rather than a part-to-whole estimate.",
          remediationFocus: "Use the full sample size as the denominator when making a sample estimate.",
        },
        {
          id: "reverses-estimate",
          triggerAnswers: ["30/18", "1.6667"],
          description: "The learner put the total count over the feature count.",
          remediationFocus: "An estimate of a subgroup is subgroup count divided by total sampled count.",
        },
      ],
      hints: [
        "The estimate is a proportion of the sample.",
        "There are 18 plots with mulch out of 30 plots total.",
        "Write 18/30, then simplify to 3/5 or 0.6.",
      ],
    },
    {
      id: "practice-2",
      concept: "scope",
      prompt:
        "Work unaided: A sample of 30 plots gives a 60% mulch-use estimate. Which sentence uses it appropriately?",
      answer: {
        kind: "multipleChoice",
        options: [
          "In this sample of 30 plots, 60% used mulch; the estimate describes the sampled context.",
          "Every garden plot in every city uses mulch 60% of the time.",
          "Each individual plot will use mulch next year.",
        ],
        correctIndex: 0,
      },
      solution:
        "The sample supports a sentence about the 30 plots observed and a bounded estimate in that context. It cannot establish an exact rate for every city or determine what each individual plot will do in a future year.",
      misconceptions: [
        {
          id: "universalizes-contextual-sample",
          triggerAnswers: ["1"],
          description: "The learner changed a local sample estimate into a universal claim.",
          remediationFocus: "Keep the setting, sampled units, and observation period in the conclusion.",
        },
        {
          id: "predicts-every-individual",
          triggerAnswers: ["2"],
          description: "The learner treated a group estimate as a certainty for one future unit.",
          remediationFocus: "Percentages summarize groups and uncertainty; they do not guarantee individual outcomes.",
        },
      ],
      hints: [
        "The only direct data are from 30 plots in one sample.",
        "A careful sentence names that sample rather than every location or future year.",
        "Choose the option that begins ‘In this sample of 30 plots.’",
      ],
    },
    {
      id: "practice-3",
      concept: "overclaiming",
      prompt:
        "Near transfer — work unaided: An optional online poll finds 72 of 120 respondents prefer a new park schedule. Which report is most responsible?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Among the 120 optional poll respondents, 60% preferred the new schedule; this does not by itself establish the preference of all park users.",
          "Exactly 60% of all park users prefer the schedule.",
          "The new schedule caused every respondent to be happier.",
        ],
        correctIndex: 0,
      },
      solution:
        "72/120 = 0.6, or 60%, describes the optional poll respondents. Because participation was optional, the response group may not represent all park users. The poll also records a preference, not a causal change in happiness.",
      misconceptions: [
        {
          id: "treats-optional-poll-as-census",
          triggerAnswers: ["1"],
          description: "The learner treated an optional respondent group as if every park user had been measured.",
          remediationFocus: "Name who responded and preserve the gap between respondents and the wider group.",
        },
        {
          id: "infers-happiness-causation",
          triggerAnswers: ["2"],
          description: "The learner claimed an unmeasured causal effect from a preference poll.",
          remediationFocus: "State the question actually asked; do not substitute a different outcome or cause claim.",
        },
      ],
      hints: [
        "First calculate 72 divided by 120.",
        "The poll was optional, so respondents are not automatically all park users.",
        "Choose the option that reports 60% of respondents and states the limit on a broader conclusion.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
