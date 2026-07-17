import type { Lesson } from "../types";

const lesson = {
  id: "probability-as-evidence-sample-spaces",
  title: "Probability as Evidence: Name the Possible Outcomes",
  track: "Arithmetic",
  description:
    "Build a probability claim from a stated sample space, then check what the denominator is counting.",
  concepts: ["sample-space", "equally-likely-outcomes", "complement"],
  steps: [
    {
      id: "step-1",
      concept: "sample-space",
      prompt:
        "A bag holds four equally likely tickets: red, blue, green, and yellow. What is the probability of drawing blue? Write a fraction.",
      answer: { kind: "expression", acceptedForms: ["1/4", "0.25"] },
      solution:
        "There is one blue ticket among four equally likely tickets. Probability compares favourable outcomes with all outcomes in the stated sample space, so P(blue) = 1/4.",
      misconceptions: [
        {
          id: "uses-other-colours-as-denominator",
          triggerAnswers: ["1/3"],
          description:
            "The learner counted only the tickets that are not blue in the denominator.",
          remediationFocus:
            "The denominator names the full set of outcomes that could occur before the draw, including the favourable outcome.",
        },
        {
          id: "reports-count-not-probability",
          triggerAnswers: ["4"],
          description: "The learner reported the number of possible tickets rather than a chance.",
          remediationFocus:
            "A probability is a comparison: favourable outcomes divided by all equally likely outcomes.",
        },
      ],
      hints: [
        "List every ticket that could be drawn before choosing the colour you want.",
        "How many of those tickets are blue? How many tickets are there altogether?",
        "Write favourable outcomes over total equally likely outcomes.",
      ],
    },
    {
      id: "step-2",
      concept: "equally-likely-outcomes",
      prompt:
        "A fair six-sided number cube has outcomes 1 through 6. How many outcomes are even?",
      answer: { kind: "numeric", value: 3, tolerance: 0 },
      solution:
        "The even outcomes are 2, 4, and 6. There are three favourable outcomes. Naming them prevents us from guessing from the word ‘even.’",
      misconceptions: [
        {
          id: "counts-even-numbers-below-six",
          triggerAnswers: ["2"],
          description: "The learner omitted 6 or counted only two familiar even numbers.",
          remediationFocus:
            "Enumerate the stated sample space and mark every outcome that satisfies the event.",
        },
        {
          id: "uses-total-as-favourable-count",
          triggerAnswers: ["6"],
          description: "The learner used every possible outcome as if every outcome were even.",
          remediationFocus:
            "Separate the total possible outcomes from the outcomes that meet the event condition.",
        },
      ],
      hints: [
        "Write 1, 2, 3, 4, 5, 6 and circle the values divisible by 2.",
        "Count the circled outcomes, not all six outcomes.",
      ],
    },
    {
      id: "step-3",
      concept: "complement",
      prompt:
        "For the same fair six-sided number cube, what is the probability of NOT rolling an even number?",
      answer: {
        kind: "multipleChoice",
        options: ["1/6", "1/2", "2/3"],
        correctIndex: 1,
      },
      solution:
        "Not even means odd: 1, 3, or 5. Three of the six equally likely outcomes are odd, so the probability is 3/6 = 1/2. A complement describes all outcomes outside the named event.",
      misconceptions: [
        {
          id: "uses-one-outcome",
          triggerAnswers: ["0"],
          description: "The learner treated ‘not even’ as if it named only one face.",
          remediationFocus:
            "List every outcome outside the event; a complement can contain more than one outcome.",
        },
        {
          id: "keeps-event-instead-of-complement",
          triggerAnswers: ["2"],
          description: "The learner named an even outcome instead of switching to the complement event.",
          remediationFocus:
            "Translate NOT rolling even into the opposite event before counting outcomes.",
        },
      ],
      hints: [
        "What numbers on the cube are not divisible by 2?",
        "Count those outcomes over all six faces, then simplify if useful.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "sample-space",
      prompt:
        "Five equally likely cards are numbered 1 through 5. What is the probability of drawing card 1? Write a fraction.",
      answer: { kind: "expression", acceptedForms: ["1/5", "0.2"] },
      solution:
        "One numbered card is favourable and five cards are possible, so P(card 1) = 1/5.",
      misconceptions: [
        {
          id: "uses-remaining-cards",
          triggerAnswers: ["1/4"],
          description: "The learner excluded the favourable card from the total count.",
          remediationFocus: "Keep the full sample space in the denominator.",
        },
      ],
      hints: ["Count all possible cards before the draw, then count the one requested card."],
    },
    {
      id: "practice-2",
      concept: "complement",
      prompt: "For a fair six-sided number cube, what is the probability of NOT rolling 1?",
      answer: {
        kind: "multipleChoice",
        options: ["1/6", "5/6", "1/2"],
        correctIndex: 1,
      },
      solution:
        "Five faces are not 1, out of six equally likely faces, so the probability is 5/6.",
      misconceptions: [
        {
          id: "reports-named-event",
          triggerAnswers: ["0"],
          description: "The learner gave the chance of rolling 1 rather than not rolling 1.",
          remediationFocus: "Use the word NOT to switch from the named event to its complement.",
        },
      ],
      hints: ["How many faces remain after excluding the face labelled 1?"],
    },
    {
      id: "practice-3",
      concept: "equally-likely-outcomes",
      prompt:
        "Near transfer: A fair spinner has eight equal sectors numbered 1 through 8. How many outcomes are greater than 5?",
      answer: { kind: "numeric", value: 3, tolerance: 0 },
      solution:
        "The qualifying sectors are 6, 7, and 8. The sample space changed from a number cube to a spinner, but the evidence move is the same: name the outcomes that meet the condition.",
      misconceptions: [
        {
          id: "starts-counting-at-five",
          triggerAnswers: ["4"],
          description: "The learner included 5 even though the condition is strictly greater than 5.",
          remediationFocus: "Translate comparison language exactly before counting outcomes.",
        },
      ],
      hints: ["Write the sector numbers greater than 5, not greater than or equal to 5."],
    },
  ],
} satisfies Lesson;

export default lesson;
