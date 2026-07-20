import type { Lesson } from "../types";

const lesson = {
  id: "natural-selection-transfer",
  title: "Transfer: Antibiotic Resistance",
  track: "Biology",
  description:
    "Apply differential survival to a fresh case — antibiotic resistance in bacteria — and design an observation that could actually falsify a claim about how the resistance arose.",
  concepts: ["pre-existing-resistance", "selection-not-learning", "falsifiable-prediction"],
  steps: [
    {
      id: "step-1",
      concept: "pre-existing-resistance",
      prompt:
        "Before an antibiotic is ever used against it, a bacterial population already includes a tiny number of cells carrying a mutation that happens to make them resistant to that antibiotic. Where did that resistant mutation come from?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Random mutation that occurred before the antibiotic was ever present, independent of the antibiotic",
          "The antibiotic caused those particular bacteria to mutate so that they could survive it",
          "The bacteria learned to resist the antibiotic through repeated exposure to small amounts of it",
        ],
        correctIndex: 0,
      },
      solution:
        "Mutations arise randomly during DNA replication, independent of whether they will later turn out to be useful. A resistance mutation can therefore already be present in a few cells of a bacterial population before that population is ever exposed to the antibiotic. The antibiotic does not cause or direct the mutation, and bacteria do not 'learn' resistance the way an organism learns a behavior — the antibiotic only determines which already-existing variants survive and reproduce.",
      misconceptions: [
        {
          id: "antibiotic-induces-resistance",
          triggerAnswers: ["1"],
          description:
            "The learner treated the antibiotic as causing or directing the resistance mutation, rather than merely selecting among mutations that already existed by chance.",
          remediationFocus:
            "Separate the source of variation (random mutation, independent of the antibiotic) from the selection pressure (the antibiotic, which determines who survives).",
        },
        {
          id: "bacteria-learn-resistance",
          triggerAnswers: ["2"],
          description:
            "The learner described resistance as something bacteria learn through exposure, treating it like a behavior an individual organism acquires, rather than a pre-existing heritable trait that is selected for.",
          remediationFocus:
            "Resistance is a heritable trait some cells already carry before exposure; exposure does not teach resistance, it reveals which cells already had it.",
        },
      ],
      hints: [
        "Ask when the resistance mutation most likely arose relative to when the antibiotic was first used.",
        "Mutation is random and happens during DNA replication, independent of whether a chemical is present that will later make that mutation useful.",
        "Distinguish where variation comes from (mutation) from what determines who survives it (the antibiotic).",
      ],
    },
    {
      id: "step-2",
      concept: "selection-not-learning",
      prompt:
        "A population of 200 bacteria includes 8 cells that already carry a resistance mutation (4% of the population) before any antibiotic is used. When the antibiotic is applied, it kills 7/8 of the non-resistant bacteria, while every resistant bacterium survives. How many bacteria survive in total?",
      answer: { kind: "numeric", value: 32, tolerance: 0 },
      solution:
        "Non-resistant bacteria: 200 − 8 = 192. The antibiotic kills 7/8 of them: 192 × 7/8 = 168 killed, so 192 − 168 = 24 survive. Every one of the 8 resistant bacteria survives. Total survivors = 24 + 8 = 32. None of these bacteria changed during the antibiotic exposure — the antibiotic simply removed most of the non-resistant cells, leaving a population where resistant cells make up a much larger share (8/32 = 1/4, up from 8/200 = 1/25 before treatment).",
      misconceptions: [
        {
          id: "counts-only-resistant-survivors",
          triggerAnswers: ["8"],
          description: "The learner reported only the resistant survivors and ignored the non-resistant bacteria that also survived the antibiotic.",
          remediationFocus: "The antibiotic kills most, not all, non-resistant bacteria; include their survivors in the total.",
        },
        {
          id: "applies-kill-rate-to-resistant",
          triggerAnswers: ["25"],
          description: "The learner mistakenly applied the 7/8 kill rate meant for non-resistant bacteria to the resistant bacteria as well.",
          remediationFocus: "Resistant bacteria survive the antibiotic by definition in this scenario; the 7/8 kill rate applies only to the non-resistant group.",
        },
      ],
      hints: [
        "Work out the non-resistant survivors and the resistant survivors separately before adding them.",
        "192 non-resistant bacteria lose 7/8 of their number; all 8 resistant bacteria survive.",
        "Add the two survivor counts for the total.",
      ],
    },
    {
      id: "step-3",
      concept: "falsifiable-prediction",
      prompt:
        "A claim states: 'These bacteria survived because they learned to resist the antibiotic during exposure.' An alternative explanation is that resistant mutants already existed before exposure and were simply the ones that survived and reproduced. Which observation would most directly test between these two explanations — and could show the pre-existing-mutation explanation is wrong if it turned out to be false?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Test bacterial samples that were frozen and stored BEFORE the antibiotic was ever introduced; if no resistant cells are found in those stored samples, the pre-existing-mutation explanation is in trouble",
          "Confirm that the surviving bacteria are able to grow in the presence of the antibiotic",
          "Show that resistance only appeared after the bacteria were exposed to the antibiotic, and count that as proof the bacteria learned it",
        ],
        correctIndex: 0,
      },
      solution:
        "A genuine test needs an observation that the two explanations predict differently. If resistance was already present before exposure (pre-existing mutation), it should be detectable in samples taken and frozen before the antibiotic was ever used. If bacteria only 'learned' resistance during exposure, those pre-exposure samples should show none — this is the logic behind fluctuation-test style experiments. Confirming that survivors can grow with the antibiotic present (option 2) is true under both explanations, so it cannot distinguish them. Treating post-exposure resistance as proof of learning (option 3) assumes the very question at issue — it does not rule out the alternative that exposure simply revealed pre-existing resistant cells rather than causing them.",
      misconceptions: [
        {
          id: "unfalsifiable-non-differentiating-test",
          triggerAnswers: ["1"],
          description: "The learner chose an observation that is consistent with both competing explanations, so it could not falsify either one.",
          remediationFocus:
            "A useful test must produce different predicted outcomes under each explanation; ask what each hypothesis predicts differently before selecting an observation.",
        },
        {
          id: "bacteria-learn-resistance",
          triggerAnswers: ["2"],
          description:
            "The learner treated resistance appearing after exposure as proof that bacteria learned or acquired it, rather than as evidence consistent with survival of pre-existing resistant variants.",
          remediationFocus:
            "Exposure reveals which pre-existing variants survive; it does not by itself prove the antibiotic taught or caused resistance. Check for resistant cells before exposure too.",
        },
      ],
      hints: [
        "Ask what each explanation would predict about bacteria sampled BEFORE any antibiotic exposure.",
        "A good test needs an observation where the two explanations predict different results, not one both explanations agree on.",
        "Rule out any option that only confirms the claim without giving it a real chance to fail.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "pre-existing-resistance",
      prompt:
        "In a finch population on a small island, individuals vary in beak depth — some slightly deeper, some slightly shallower — a difference chicks inherit from their parents. During a severe drought, only large, tough seeds remain, and finches with deeper, stronger beaks crack them more easily and survive better. Where did the original variation in beak depth come from?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Heritable variation already present among individual finches, independent of the drought",
          "Finches' beaks growing tougher from cracking hard seeds during the drought, then passing that toughness to their chicks",
          "The population needing tougher beaks to survive the drought",
        ],
        correctIndex: 0,
      },
      solution:
        "As with the giraffe and moth populations, the variation in beak depth already existed in the finch population before the drought — it is ordinary heritable variation. The drought did not cause finches' beaks to grow tougher through use, and the population did not generate this variation because it was needed; the drought simply changed which pre-existing variants survived and reproduced better.",
      misconceptions: [
        {
          id: "lamarckian-use-and-pass-on",
          triggerAnswers: ["1"],
          description: "The learner had finches' beaks toughening through use during the drought and passing that toughening on to chicks.",
          remediationFocus: "Ask whether this beak-depth difference existed before or only after the drought began.",
        },
        {
          id: "directed-need-teleology",
          triggerAnswers: ["2"],
          description: "The learner treated the population as generating tougher beaks because it needed them, rather than selection acting on pre-existing variation.",
          remediationFocus: "Selection can only act on variation a population already has.",
        },
      ],
      hints: [
        "Ask whether this beak-depth difference existed before or only after the drought began.",
        "Selection can only act on variation a population already has.",
      ],
    },
    {
      id: "practice-2",
      concept: "selection-not-learning",
      prompt:
        "A finch population has 90 individuals: 30 deep-beaked and 60 shallow-beaked, a heritable difference. During a drought, deep-beaked finches crack the remaining tough seeds well, so the drought removes only 1/3 of the deep-beaked finches but 5/6 of the shallow-beaked finches. How many deep-beaked finches survive?",
      answer: { kind: "numeric", value: 20, tolerance: 0 },
      solution: "30 deep-beaked finches lose 1/3 of their number: 30 × 1/3 = 10 removed, so 30 − 10 = 20 survive the drought.",
      misconceptions: [
        {
          id: "computes-removed-not-survivors",
          triggerAnswers: ["10"],
          description: "The learner reported the number of deep-beaked finches removed rather than the number that survive.",
          remediationFocus: "Subtract the removed count from the starting count to find survivors.",
        },
      ],
      hints: [
        "Find how many deep-beaked finches are removed, then subtract from the starting count.",
        "30 deep-beaked finches lose 1/3 of their number.",
      ],
    },
    {
      id: "practice-3",
      concept: "selection-not-learning",
      prompt:
        "The drought also removes 5/6 of the 60 shallow-beaked finches, leaving 10 shallow-beaked survivors. Combined with the 20 deep-beaked survivors, what fraction of the surviving finches is deep-beaked?",
      answer: { kind: "expression", acceptedForms: ["20/30", "2/3"] },
      solution:
        "Total survivors = 20 deep-beaked + 10 shallow-beaked = 30. Fraction deep-beaked = 20/30 = 2/3 — up from 30/90 = 1/3 before the drought. None of the finches changed their own beak depth during the drought; the population's trait mix shifted because deep-beaked finches survived at a higher rate in this environment.",
      misconceptions: [
        {
          id: "uses-whole-population-denominator",
          triggerAnswers: ["20/90"],
          description: "The learner divided the deep-beaked survivors by the original population of 90 instead of by the total survivors.",
          remediationFocus: "Once selection has occurred, use the survivor total as the denominator, not the original population.",
        },
      ],
      hints: [
        "Add both survivor counts to find the new total.",
        "Put deep-beaked survivors over the total number of survivors, not the original population of 90.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
