import type { Lesson } from "../types";

const lesson = {
  id: "claims-to-evidence-operationalize",
  title: "Claims to Evidence: Make a Claim Observable",
  track: "Research Methods",
  description:
    "Turn a broad claim into an observable outcome, a stated group, and a repeatable way to record evidence.",
  concepts: ["operational-definition", "population", "measurement-rule"],
  steps: [
    {
      id: "step-1",
      concept: "operational-definition",
      prompt:
        "A team claims, ‘The new library map helps visitors find a book faster.’ Which outcome makes the word ‘faster’ observable?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Visitors say the map looks modern.",
          "Minutes from receiving a book title to locating that book.",
          "The team feels confident about the map.",
        ],
        correctIndex: 1,
      },
      solution:
        "‘Faster’ is a comparison about time. Recording the minutes from the same starting point (receiving a title) to the same endpoint (locating it) makes the claim observable. Appearance and confidence may matter for other questions, but they do not measure speed.",
      misconceptions: [
        {
          id: "substitutes-opinion-for-outcome",
          triggerAnswers: ["0"],
          description: "The learner selected an opinion about the map rather than a measure of finding time.",
          remediationFocus:
            "Ask what a recorder could see or time in the same way for each attempt.",
        },
        {
          id: "uses-team-belief-as-evidence",
          triggerAnswers: ["2"],
          description: "The learner treated the creators’ confidence as evidence that the outcome changed.",
          remediationFocus:
            "Separate a prediction or belief from an observation collected under a stated rule.",
        },
      ],
      hints: [
        "Look for an option a neutral observer could record on every visit.",
        "The claim uses the comparative word ‘faster.’ What quantity changes when something is faster?",
        "Choose the option that defines a start, an end, and a time measurement.",
      ],
    },
    {
      id: "step-2",
      concept: "population",
      prompt:
        "For that library-map question, which group is the most direct population for the claim?",
      answer: {
        kind: "multipleChoice",
        options: [
          "All people who use the library to find a requested book.",
          "Only the designers who made the map.",
          "Only visitors who already know every shelf location.",
        ],
        correctIndex: 0,
      },
      solution:
        "The claim concerns people using the library map to find requested books, so that is the group the evidence should speak about. Designers and expert visitors could be informative subgroups, but neither alone represents the full claim as stated.",
      misconceptions: [
        {
          id: "selects-interested-designers",
          triggerAnswers: ["1"],
          description: "The learner narrowed the group to people invested in the map’s success.",
          remediationFocus:
            "State who is affected by the claim before deciding who should supply evidence.",
        },
        {
          id: "selects-only-experts",
          triggerAnswers: ["2"],
          description: "The learner chose a subgroup with unusually strong prior knowledge.",
          remediationFocus:
            "Check whether a proposed group leaves out ordinary users covered by the claim.",
        },
      ],
      hints: [
        "Read the claim again: who is supposed to be helped?",
        "A population is the full group a conclusion is intended to describe.",
        "Choose the option that includes ordinary book-finding library users, not a special subgroup.",
      ],
    },
    {
      id: "step-3",
      concept: "measurement-rule",
      prompt:
        "Which recording rule is most repeatable for the map question?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Record whether the visitor seems pleased.",
          "Record the nearest whole number of minutes from giving the title until the visitor points to the book.",
          "Record the researcher’s first impression after each visit.",
        ],
        correctIndex: 1,
      },
      solution:
        "A repeatable rule tells different recorders what to observe and when to stop. Rounding a stated duration from a stated beginning to a stated ending gives a consistent rule. ‘Seems pleased’ and a researcher’s impression depend on unstated judgment.",
      misconceptions: [
        {
          id: "uses-unstated-impression",
          triggerAnswers: ["0", "2"],
          description: "The learner selected a subjective judgment without a shared recording rule.",
          remediationFocus:
            "Specify what is counted or timed, the unit, and the start and stop points.",
        },
      ],
      hints: [
        "Imagine two people collecting the same data on different days.",
        "Would they know exactly when to start, stop, and write a value?",
        "Choose the option with a unit and an explicit observation boundary.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "operational-definition",
      prompt:
        "Work unaided: A school claims its quieter lunch line reduces waiting. Which measure best operationalizes ‘waiting’?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Seconds from joining the line to receiving lunch.",
          "Whether the cafeteria manager likes the new line.",
          "How colourful the lunch signs are.",
        ],
        correctIndex: 0,
      },
      solution:
        "The setting changed from a library to a cafeteria, but the evidence move is the same: define the claimed outcome as a directly recordable duration. The other choices may be opinions or design details, not wait time.",
      misconceptions: [
        {
          id: "uses-manager-opinion",
          triggerAnswers: ["1"],
          description: "The learner substituted a stakeholder’s view for a waiting-time measure.",
          remediationFocus: "Return to the exact outcome word in the claim and ask how to record it.",
        },
        {
          id: "uses-design-detail",
          triggerAnswers: ["2"],
          description: "The learner measured a feature of the setting rather than the claimed outcome.",
          remediationFocus: "Distinguish a possible cause from the outcome the claim says changed.",
        },
      ],
      hints: [
        "The claim is about reducing a duration.",
        "Find the option that begins when a person joins and ends when service is received.",
        "Choose the stated time interval, not an opinion or a visual feature.",
      ],
    },
    {
      id: "practice-2",
      concept: "population",
      prompt:
        "Work unaided: A claim says a bike-parking change helps students who cycle to school. Which group does that claim address?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Students who cycle to school.",
          "Only the person who installed the racks.",
          "Students who never travel to school by bike.",
        ],
        correctIndex: 0,
      },
      solution:
        "The group named by the claim is students who cycle to school. The installer and students who never use a bicycle may offer other perspectives, but they are not the population the stated help claim directly concerns.",
      misconceptions: [
        {
          id: "selects-installer",
          triggerAnswers: ["1"],
          description: "The learner chose a single invested person instead of the affected group.",
          remediationFocus: "Match the population to the people named by the claim.",
        },
        {
          id: "selects-unaffected-group",
          triggerAnswers: ["2"],
          description: "The learner selected people outside the activity the claim describes.",
          remediationFocus: "Check whether each proposed person could experience the stated change.",
        },
      ],
      hints: [
        "Underline who the claim says is helped.",
        "The population is not necessarily everyone in the building.",
        "Choose the group that actually uses the travel mode in the claim.",
      ],
    },
    {
      id: "practice-3",
      concept: "measurement-rule",
      prompt:
        "Near transfer — work unaided: A museum claims a new label helps visitors identify an object. Which rule gives the clearest evidence?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Ask the same identification question, then record whether each visitor answers it correctly before seeing any feedback.",
          "Record whether the guide thinks the label is elegant.",
          "Ask visitors whether they have ever liked museums.",
        ],
        correctIndex: 0,
      },
      solution:
        "The outcome is identifying an object. Giving the same question and recording correctness before feedback creates a clear, repeatable observation. Aesthetic judgments and general museum preferences do not directly measure identification in this setting.",
      misconceptions: [
        {
          id: "uses-aesthetic-judgment",
          triggerAnswers: ["1"],
          description: "The learner chose a judgment about the label rather than evidence of identification.",
          remediationFocus: "Name the learner action the claim says changed, then record that action.",
        },
        {
          id: "uses-unrelated-preference",
          triggerAnswers: ["2"],
          description: "The learner selected a background preference unrelated to the stated outcome.",
          remediationFocus: "Keep the measure aligned with the particular claim being evaluated.",
        },
      ],
      hints: [
        "The outcome is not liking the label; it is identifying an object.",
        "A good rule says what everyone is asked and what is recorded.",
        "Choose the option that checks identification under the same conditions for each visitor.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
