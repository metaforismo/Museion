import type { Lesson } from "../types";

const lesson = {
  id: "probability-as-evidence-conditional-evidence",
  title: "Probability as Evidence: Condition on What You Know",
  track: "Arithmetic",
  description:
    "Use a stated subgroup as the denominator when evidence tells you where to look.",
  concepts: ["conditional-probability", "evidence-subgroup", "contingency-counts"],
  steps: [
    {
      id: "step-1",
      concept: "evidence-subgroup",
      prompt:
        "A library tracks 100 books. Forty have a review slip, and 10 of those 40 are science books. If you already know a selected book has a review slip, what number belongs in the denominator?",
      answer: { kind: "numeric", value: 40, tolerance: 0 },
      solution:
        "The phrase ‘given that it has a review slip’ restricts the comparison to the 40 books with slips. Conditional probability changes the reference group before we count favourable cases.",
      misconceptions: [
        {
          id: "uses-whole-library",
          triggerAnswers: ["100"],
          description: "The learner kept the whole library as the reference group after new evidence was given.",
          remediationFocus: "Circle the group named after ‘given that’; it becomes the new denominator.",
        },
        {
          id: "uses-favourable-count",
          triggerAnswers: ["10"],
          description: "The learner used only the science-with-slip count as the whole group.",
          remediationFocus: "The numerator is the overlap; the denominator is the full evidence subgroup.",
        },
      ],
      hints: [
        "Read the condition after ‘already know’: which books are still possible?",
        "How many books have review slips, regardless of subject?",
        "That restricted group is the denominator.",
      ],
    },
    {
      id: "step-2",
      concept: "conditional-probability",
      prompt:
        "Using the same library record, what is P(science | review slip)?",
      answer: {
        kind: "multipleChoice",
        options: ["1/10", "1/4", "2/5"],
        correctIndex: 1,
      },
      solution:
        "Within the 40 books with review slips, 10 are science books. So P(science | review slip) = 10/40 = 1/4. The vertical bar means the evidence on the right has already restricted the group.",
      misconceptions: [
        {
          id: "uses-overlap-as-denominator",
          triggerAnswers: ["0"],
          description: "The learner treated the overlap count as both numerator and denominator.",
          remediationFocus: "Keep the overlap in the numerator and the known-evidence group in the denominator.",
        },
        {
          id: "reverses-condition",
          triggerAnswers: ["2"],
          description: "The learner reasoned about review slips among science books rather than science books among review slips.",
          remediationFocus: "Read from right to left after the bar: first choose from the evidence subgroup, then ask what fraction has the event.",
        },
      ],
      hints: [
        "Start inside the 40 books with review slips.",
        "Of those 40, how many are science books? Form that fraction and simplify.",
      ],
    },
    {
      id: "step-3",
      concept: "contingency-counts",
      prompt:
        "The library has 20 science books in all, and 10 of them have review slips. For P(review slip | science), which denominator should you use?",
      answer: { kind: "numeric", value: 20, tolerance: 0 },
      solution:
        "Now the condition is science, so the comparison happens inside the 20 science books. Reversing the condition can change the denominator and therefore can change the probability.",
      misconceptions: [
        {
          id: "keeps-previous-condition",
          triggerAnswers: ["40"],
          description: "The learner reused the earlier review-slip group after the condition changed.",
          remediationFocus: "The denominator is determined afresh by the evidence named after the vertical bar.",
        },
        {
          id: "uses-whole-library-again",
          triggerAnswers: ["100"],
          description: "The learner ignored the condition and returned to the whole library.",
          remediationFocus: "Conditional probability is not a whole-population probability once a condition is supplied.",
        },
      ],
      hints: [
        "What word appears after the vertical bar this time?",
        "Count every book in that group, whether or not it has a review slip.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "evidence-subgroup",
      prompt:
        "Thirty project folders are recorded. Twelve carry a tested tag, and three of those 12 are visual-design folders. Given that a folder has a tested tag, what denominator should you use?",
      answer: { kind: "numeric", value: 12, tolerance: 0 },
      solution:
        "The evidence is ‘has a tested tag,’ so all 12 tagged folders form the comparison group.",
      misconceptions: [
        {
          id: "uses-all-folders",
          triggerAnswers: ["30"],
          description: "The learner used the original collection instead of the evidence subgroup.",
          remediationFocus: "Restrict the denominator to folders satisfying the condition.",
        },
      ],
      hints: ["The condition tells you which folders are still in play."],
    },
    {
      id: "practice-2",
      concept: "conditional-probability",
      prompt: "For those folders, what is P(visual design | tested tag)?",
      answer: {
        kind: "multipleChoice",
        options: ["1/10", "1/4", "2/5"],
        correctIndex: 1,
      },
      solution:
        "Three of the 12 tested folders are visual-design folders, so the conditional probability is 3/12 = 1/4.",
      misconceptions: [
        {
          id: "uses-total-projects",
          triggerAnswers: ["0"],
          description: "The learner treated the chance as three out of all 30 folders.",
          remediationFocus: "The tag is given, so the comparison is only among tagged folders.",
        },
      ],
      hints: ["Use the three visual-design tagged folders over all twelve tagged folders."],
    },
    {
      id: "practice-3",
      concept: "conditional-probability",
      prompt:
        "Near transfer: A quality check flags 9 of 15 weather reports with a photo. Six of the flagged reports are later confirmed relevant. What is P(relevant | flagged)? Write a fraction.",
      answer: { kind: "expression", acceptedForms: ["2/3", "6/9"] },
      solution:
        "Once a report is known to be flagged, there are 9 possible reports in the reference group and 6 relevant ones. The probability is 6/9 = 2/3. This describes this recorded check, not a guarantee about every future check.",
      misconceptions: [
        {
          id: "uses-all-reports",
          triggerAnswers: ["2/5"],
          description: "The learner divided confirmed relevant reports by all 15 reports instead of the flagged subgroup.",
          remediationFocus: "Let the condition define the denominator before doing any division.",
        },
      ],
      hints: ["The word flagged appears after the condition: how many reports were flagged?"],
    },
  ],
} satisfies Lesson;

export default lesson;
