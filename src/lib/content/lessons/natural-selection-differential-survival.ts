import type { Lesson } from "../types";

const lesson = {
  id: "natural-selection-differential-survival",
  title: "Differential Survival and Reproduction",
  track: "Biology",
  description:
    "Compute how a population's trait mix shifts across one generation of selection, and separate fitness — survival and reproduction that matches the environment — from raw physical strength.",
  concepts: ["fitness-and-environment", "trait-frequency", "frequency-shift"],
  steps: [
    {
      id: "step-1",
      concept: "fitness-and-environment",
      prompt:
        "In a peppered moth population, dark-colored moths began surviving predation much better than light-colored moths once soot from nearby factories darkened the tree bark they rest on. Which best explains why dark moths had higher fitness in this particular environment?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Their coloring matched the darker bark, so birds located and ate them less often",
          "Dark moths were physically stronger and more powerful than light moths",
          "Survival always goes to whichever moths are toughest, no matter the environment",
        ],
        correctIndex: 0,
      },
      solution:
        "Fitness here means the combination of survival and reproduction produced by a trait in a specific environment — it is not a measure of strength. Dark coloring increased survival only because it happened to match the darker, soot-covered bark, making dark moths harder for birds to spot. The same dark coloring would not raise fitness against pale, lichen-covered bark; fitness is always relative to the environment a population is actually in, not a fixed ranking of toughness.",
      misconceptions: [
        {
          id: "fitness-as-physical-strength",
          triggerAnswers: ["1"],
          description:
            "The learner equated fitness with physical strength or power rather than reproductive success arising from a match to the local environment.",
          remediationFocus:
            "Fitness in this context means camouflage-driven survival and reproduction in a specific environment, not muscular strength; the same moths could be poorly fit in a different environment.",
        },
        {
          id: "survival-of-the-strongest",
          triggerAnswers: ["2"],
          description:
            "The learner applied a fixed 'strongest wins' rule instead of recognizing that which trait is favored depends on the specific environment.",
          remediationFocus:
            "Ask what specifically increased survival here — camouflage against a particular background — and note that a different environment could favor a different trait.",
        },
      ],
      hints: [
        "Ask specifically what changed the moths' odds of being eaten — was it a physical contest, or something about blending in?",
        "Fitness in evolutionary biology means survival and reproduction that results from a match to a particular environment, not a fixed 'strongest wins' ranking.",
        "Consider whether the same dark coloring would still help if the bark were pale instead of sooty.",
      ],
    },
    {
      id: "step-2",
      concept: "trait-frequency",
      prompt:
        "Before the bark darkened, a moth population had 40 individuals: 16 dark-colored and 24 light-colored, a heritable coloring difference. What proportion of the population was dark? Give your answer as a decimal or a fraction.",
      answer: { kind: "numeric", value: 0.4, tolerance: 0 },
      solution:
        "Proportion dark = number dark ÷ total population = 16/40 = 2/5 = 0.4. This is the starting point before any selection pressure from the darker bark is applied.",
      misconceptions: [
        {
          id: "reports-raw-count",
          triggerAnswers: ["16"],
          description: "The learner reported the raw count of dark moths rather than its proportion of the total population.",
          remediationFocus: "A proportion needs a total in the denominator; divide the count of interest by the whole population.",
        },
        {
          id: "computes-light-proportion",
          triggerAnswers: ["0.6"],
          description: "The learner computed the proportion of light moths instead of dark moths.",
          remediationFocus: "Reread which color the question asks about, then put that count over the total.",
        },
      ],
      hints: [
        "A proportion compares a count of interest to the total population, not to itself.",
        "Divide the number of dark moths by the total number of moths in the population.",
        "16 dark out of 40 total — simplify that fraction or convert it to a decimal.",
      ],
    },
    {
      id: "step-3",
      concept: "frequency-shift",
      prompt:
        "This generation, birds find and remove 1/4 of the dark moths and 3/4 of the light moths, because dark moths are hard to spot against the sooty bark. Of the original 16 dark and 24 light moths, what fraction of the SURVIVORS is dark? Give your answer as a fraction.",
      answer: { kind: "expression", acceptedForms: ["12/18", "2/3"] },
      solution:
        "Dark moths: 16 × 1/4 = 4 removed, so 16 − 4 = 12 survive. Light moths: 24 × 3/4 = 18 removed, so 24 − 18 = 6 survive. Total survivors = 12 + 6 = 18. Fraction of survivors that is dark = 12/18 = 2/3 — up from 2/5 (0.4) before this generation's selection. The population's trait mix shifted because dark moths had higher survival in this environment, not because any moth changed color.",
      misconceptions: [
        {
          id: "uses-whole-population-denominator",
          triggerAnswers: ["12/40"],
          description:
            "The learner divided the dark survivors by the original population of 40 instead of by the total number of survivors.",
          remediationFocus: "Once selection has occurred, the relevant reference group is the survivors, not the starting population.",
        },
        {
          id: "part-to-part-ratio",
          triggerAnswers: ["12/6"],
          description:
            "The learner compared dark survivors to light survivors (a part-to-part ratio) instead of dark survivors to all survivors (a part-to-whole proportion).",
          remediationFocus: "A proportion of survivors needs all survivors in the denominator, not just the other group.",
        },
      ],
      hints: [
        "First find how many dark moths survive, then how many light moths survive.",
        "16 dark moths lose 1/4 of their number; 24 light moths lose 3/4 of their number.",
        "Add the two survivor counts for the new total, then put dark survivors over that new total.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "frequency-shift",
      prompt:
        "A separate beetle population has 50 individuals: 30 green and 20 brown, a heritable color difference. Green beetles are hard to see against new leaf growth this season, so predators remove only 1/5 of the green beetles but 3/5 of the brown beetles. How many green beetles survive?",
      answer: { kind: "numeric", value: 24, tolerance: 0 },
      solution: "30 green beetles lose 1/5 of their number: 30 × 1/5 = 6 removed, so 30 − 6 = 24 survive.",
      misconceptions: [
        {
          id: "computes-removed-not-survivors",
          triggerAnswers: ["6"],
          description: "The learner reported the number of green beetles removed rather than the number that survive.",
          remediationFocus: "Subtract the removed count from the starting count to find survivors.",
        },
      ],
      hints: [
        "Find how many green beetles are removed first, then subtract from the starting count.",
        "30 green beetles lose 1/5 of their number.",
      ],
    },
    {
      id: "practice-2",
      concept: "frequency-shift",
      prompt:
        "Given that 24 green beetles and 8 brown beetles survive this season (30 − 6 green removed; 20 − 12 brown removed), what fraction of the survivors is green?",
      answer: { kind: "expression", acceptedForms: ["24/32", "3/4"] },
      solution:
        "Total survivors = 24 + 8 = 32. Fraction of survivors that is green = 24/32 = 3/4 — up from 30/50 = 3/5 before this season's selection.",
      misconceptions: [
        {
          id: "uses-original-population-denominator",
          triggerAnswers: ["24/50"],
          description: "The learner divided the green survivors by the original population of 50 instead of by the total survivors.",
          remediationFocus: "Once selection has occurred, use the survivor total as the denominator, not the starting population.",
        },
      ],
      hints: [
        "Add both survivor counts to get the new total.",
        "Put green survivors over the total number of survivors, not the original population.",
      ],
    },
    {
      id: "practice-3",
      concept: "fitness-and-environment",
      prompt:
        "Suppose a drought later turns the leaves brown instead of green, and predators can now see green beetles more easily than brown beetles. Which statement is correct?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Fitness would flip — brown beetles would now have higher fitness, because fitness depends on the current environment, not a fixed trait ranking",
          "Green beetles would remain fittest, since they were fittest earlier in the season",
          "Whichever beetle is toughest would survive best, regardless of leaf color",
        ],
        correctIndex: 0,
      },
      solution:
        "Fitness is not a permanent ranking attached to a trait; it is produced by how well a trait matches the current environment. If the environment reverses (leaves turn brown), the trait that previously reduced predation (green camouflage) would no longer do so, and brown coloring could become the more advantageous, higher-fitness trait instead.",
      misconceptions: [
        {
          id: "fixed-fitness-ranking",
          triggerAnswers: ["1"],
          description: "The learner treated fitness as a fixed property of a trait rather than something that depends on the current environment.",
          remediationFocus:
            "Re-ask what specifically caused higher survival before (blending with green leaves) and check whether that same mechanism still applies once the environment changes.",
        },
        {
          id: "survival-of-the-strongest",
          triggerAnswers: ["2"],
          description: "The learner reverted to a fixed 'toughest wins' rule instead of an environment-dependent account of fitness.",
          remediationFocus: "Ask what specifically increased survival in each environment — a match to background color, not toughness.",
        },
      ],
      hints: [
        "Ask what specifically made green beetles fitter earlier: was it the color itself, or the color's match to the leaves?",
        "If the matching environment changes, check whether the same trait would still produce the same survival advantage.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
