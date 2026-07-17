import type { Lesson } from "../types";

const lesson = {
  id: "samples-to-conclusions-variability",
  title: "Samples to Conclusions: Expect Variation in a Sample",
  track: "Research Methods",
  description:
    "Compute simple sample proportions, compare repeated samples, and treat variation as information rather than proof that one count is wrong.",
  concepts: ["sample-proportion", "sampling-variability", "uncertainty"],
  steps: [
    {
      id: "step-1",
      concept: "sample-proportion",
      prompt:
        "In one sample of 20 library visitors, 8 use a study room. What proportion of this sample used a study room? Write a fraction or decimal.",
      answer: { kind: "expression", acceptedForms: ["8/20", "2/5", "0.4", "40%"] },
      solution:
        "A sample proportion compares the count with the sample size: 8 out of 20. This can be written as 8/20, simplified to 2/5, or as 0.4 (40%). The proportion describes this sample; it is not yet a fact about every possible visitor.",
      misconceptions: [
        {
          id: "reports-count-only",
          triggerAnswers: ["8"],
          description: "The learner gave the numerator but omitted the sample-size comparison.",
          remediationFocus: "A proportion needs both the count meeting the condition and the full sample count.",
        },
        {
          id: "reverses-fraction",
          triggerAnswers: ["20/8", "2.5"],
          description: "The learner placed the total over the qualifying count.",
          remediationFocus: "Put the subgroup count over the complete sample count so the value is between zero and one.",
        },
      ],
      hints: [
        "A proportion is part divided by whole.",
        "The part is 8 visitors and the whole sample is 20 visitors.",
        "Write 8/20, then simplify or convert if you wish.",
      ],
    },
    {
      id: "step-2",
      concept: "sampling-variability",
      prompt:
        "A second sample of 20 visitors has 11 study-room users. Which statement best describes the two samples?",
      answer: {
        kind: "multipleChoice",
        options: [
          "The samples have different observed proportions: 8/20 and 11/20.",
          "One sample must be fabricated because the counts differ.",
          "The second sample proves exactly 55% of every visitor uses a study room.",
        ],
        correctIndex: 0,
      },
      solution:
        "The two samples produced different observed proportions, 0.40 and 0.55. Different samples can vary even when they are drawn from the same broader process. The difference alone does not prove dishonesty or settle the exact proportion for every visitor.",
      misconceptions: [
        {
          id: "treats-variation-as-fabrication",
          triggerAnswers: ["1"],
          description: "The learner assumed any difference between samples means one record is false.",
          remediationFocus: "Repeated samples can naturally contain different people and therefore different proportions.",
        },
        {
          id: "treats-one-sample-as-exact-population",
          triggerAnswers: ["2"],
          description: "The learner converted one sample’s observed proportion into an exact population fact.",
          remediationFocus: "Use sample language and retain uncertainty when extending beyond the observed group.",
        },
      ],
      hints: [
        "First compare what is directly recorded in each group of 20.",
        "Different samples can include different people, so their proportions need not match exactly.",
        "Choose the statement that reports both observed proportions without calling either one a population certainty.",
      ],
    },
    {
      id: "step-3",
      concept: "uncertainty",
      prompt:
        "A report is based on those two samples only. Which wording handles uncertainty most carefully?",
      answer: {
        kind: "multipleChoice",
        options: [
          "In these two samples, study-room use ranged from 40% to 55%; more representative data would be needed for a broader estimate.",
          "Study-room use is exactly 47.5% for all visitors forever.",
          "The lower sample is wrong because it is not equal to the higher sample.",
        ],
        correctIndex: 0,
      },
      solution:
        "The two observed proportions are 40% and 55%, so reporting their range accurately describes the available evidence. A broader conclusion also depends on how visitors were reached and sampled. Neither a permanent exact percentage nor a claim that one differing sample is wrong follows from these two records alone.",
      misconceptions: [
        {
          id: "asserts-exact-permanent-population-rate",
          triggerAnswers: ["1"],
          description: "The learner erased sampling and time limits by claiming a permanent exact value.",
          remediationFocus: "Report the observed samples and state what additional evidence a broader estimate would require.",
        },
        {
          id: "rejects-lower-sample-for-difference",
          triggerAnswers: ["2"],
          description: "The learner treated ordinary between-sample variation as an error by default.",
          remediationFocus: "Different results require investigation when warranted, but difference itself is not proof of error.",
        },
      ],
      hints: [
        "Use the two values actually observed: 40% and 55%.",
        "Careful wording tells what these samples show and what they do not settle.",
        "Choose the statement that reports the range and asks for more representative data before a broad estimate.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "sample-proportion",
      prompt:
        "Work unaided: In a sample of 25 park visitors, 10 arrive by bicycle. What proportion of this sample arrived by bicycle? Write a fraction or decimal.",
      answer: { kind: "expression", acceptedForms: ["10/25", "2/5", "0.4", "40%"] },
      solution:
        "The bicycle-arrival count is 10 and the complete sample is 25, so the sample proportion is 10/25 = 2/5 = 0.4. The calculation summarizes this sample of 25 visitors.",
      misconceptions: [
        {
          id: "reports-numerator-only",
          triggerAnswers: ["10"],
          description: "The learner reported the bicycle count without dividing by the sample size.",
          remediationFocus: "Use the total number observed as the denominator of a sample proportion.",
        },
        {
          id: "reverses-ratio",
          triggerAnswers: ["25/10", "2.5"],
          description: "The learner reversed the part-to-whole ratio.",
          remediationFocus: "A subgroup within a sample is the numerator; the full sample is the denominator.",
        },
      ],
      hints: [
        "Identify the count with the feature and the count in the whole sample.",
        "The relevant part is 10; the whole is 25.",
        "Write 10/25 and simplify it to 2/5 or 0.4.",
      ],
    },
    {
      id: "practice-2",
      concept: "sampling-variability",
      prompt:
        "Work unaided: Two equal-size samples of trail users produce 6 helmets out of 15 and 9 helmets out of 15. What is the safest first interpretation?",
      answer: {
        kind: "multipleChoice",
        options: [
          "The observed sample proportions differ, which can happen across samples.",
          "The sample with 6 helmets must be invalid.",
          "The sample with 9 helmets proves the exact helmet rate for all trail users.",
        ],
        correctIndex: 0,
      },
      solution:
        "The first sample has 6/15 and the second has 9/15. Those observed proportions differ. Different samples can vary, so the difference alone neither invalidates one sample nor proves a precise rate for every trail user.",
      misconceptions: [
        {
          id: "invalidates-different-sample",
          triggerAnswers: ["1"],
          description: "The learner assumed a differing sample result is automatically invalid.",
          remediationFocus: "Variation is expected when different people are included; inspect collection quality separately.",
        },
        {
          id: "makes-one-sample-universal",
          triggerAnswers: ["2"],
          description: "The learner treated one observed fraction as an exact fact about a larger population.",
          remediationFocus: "Keep the word ‘sample’ in a conclusion unless broader evidence supports extension.",
        },
      ],
      hints: [
        "Calculate or compare the two fractions: 6/15 and 9/15.",
        "They are not equal, but different groups can give different observed values.",
        "Choose the option that reports variation without declaring a sample false or universal.",
      ],
    },
    {
      id: "practice-3",
      concept: "uncertainty",
      prompt:
        "Near transfer — work unaided: A science club samples two jars of mixed beads and finds 13/30 blue in one jar and 17/30 blue in the other. Which report is most careful?",
      answer: {
        kind: "multipleChoice",
        options: [
          "The two samples had different observed blue proportions; the available samples alone do not establish one exact proportion for every jar.",
          "Every jar has exactly 50% blue beads.",
          "The jar with 13 blue beads was counted incorrectly because it differs from the other jar.",
        ],
        correctIndex: 0,
      },
      solution:
        "The samples show 13/30 and 17/30 blue beads, two different observed proportions. That supports reporting their difference and retaining uncertainty about other jars. It does not establish an exact percentage for every jar or prove either count was mistaken.",
      misconceptions: [
        {
          id: "claims-exact-all-jar-rate",
          triggerAnswers: ["1"],
          description: "The learner asserted an exact universal percentage not established by the two samples.",
          remediationFocus: "Keep conclusions tied to the observed jars and samples unless a broader design justifies more.",
        },
        {
          id: "calls-difference-counting-error",
          triggerAnswers: ["2"],
          description: "The learner interpreted unequal samples as proof of a counting mistake.",
          remediationFocus: "Variation can arise from different samples; check counting separately rather than assuming error from difference.",
        },
      ],
      hints: [
        "The samples are separate jars, each with 30 beads counted.",
        "Two different observed fractions do not automatically create one universal exact value.",
        "Choose the statement that reports the difference and preserves uncertainty about every other jar.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
