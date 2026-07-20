import type { Lesson } from "../types";

const lesson = {
  id: "natural-selection-variation",
  title: "Variation and Heritability",
  track: "Biology",
  description:
    "Natural selection acts on heritable variation that already exists in a population — individuals do not adapt during their own lifetime and pass that change on.",
  concepts: ["heritable-variation", "acquired-traits", "population-vs-individual"],
  steps: [
    {
      id: "step-1",
      concept: "heritable-variation",
      prompt:
        "A giraffe population has long included individuals with somewhat longer necks and somewhat shorter necks — a difference that calves inherit from their parents. During a drought, low leaves become scarce, and long-necked giraffes reach more food and survive better. Before the drought ever began, where did this variation in neck length come from?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Heritable variation already present among individual giraffes, independent of the drought",
          "The whole population growing longer necks together once the drought began, because it needed more food",
          "Individual giraffes stretching their necks a little further each day the drought continued",
        ],
        correctIndex: 0,
      },
      solution:
        "Natural selection cannot manufacture a new trait to order — it can only act on variation that already exists in a population. Before the drought, the giraffe population already contained a range of neck lengths because of ordinary heritable variation (differences in the genes calves inherit from their parents). The drought did not create this variation; it changed which existing variants survived and reproduced better. A population does not act with intention ('needed more food'), and an individual's own stretching during its lifetime does not rewrite the genes it passes to its calves.",
      misconceptions: [
        {
          id: "directed-need-teleology",
          triggerAnswers: ["1"],
          description:
            "The learner treated the population as sensing a need and adjusting on purpose, rather than selection acting on variation that already existed before the environmental change.",
          remediationFocus:
            "Natural selection has no foresight or goal. It filters variation that is already present after the fact; it does not generate a trait because a population needs it.",
        },
        {
          id: "lamarckian-use-and-pass-on",
          triggerAnswers: ["2"],
          description:
            "The learner attributed the heritable variation to individual giraffes stretching their necks during their own lifetime (an acquired trait), rather than pre-existing heritable variation.",
          remediationFocus:
            "Distinguish a trait an individual develops through use during its life from a heritable trait already present in the gene pool before selection acts on it.",
        },
      ],
      hints: [
        "Notice the timing: the variation in neck length existed before the drought started. Ask where variation that predates an environmental change could come from.",
        "Selection can only act on variation that is already present in a population — it does not manufacture a new trait on demand.",
        "Check each option: does it describe something present BEFORE the drought (heritable variation), or something that happens only DURING an individual's life, or by the population 'deciding'?",
      ],
    },
    {
      id: "step-2",
      concept: "acquired-traits",
      prompt:
        "Suppose one giraffe strains to stretch its neck a little further every day during its life and gains some extra reach. Under the modern understanding of heredity, what happens to that extra stretched reach in that giraffe's own calves?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Nothing directly — the calves inherit the genes the giraffe was born with, not changes the giraffe gained by stretching during its life",
          "The calves are born with the same extra stretched reach their parent gained",
          "The calves inherit slightly more reach than their parent had at birth, since the stretching adds up generation after generation",
        ],
        correctIndex: 0,
      },
      solution:
        "A calf inherits the DNA present in its parent's reproductive cells at conception. Stretching a neck during life does not rewrite that DNA, so any extra reach a giraffe gains through effort is not passed to its calves — this is exactly the claim (inheritance of acquired characteristics) that the modern understanding of heredity rejects. If it were true, effort could compound endlessly across generations, which is not what heredity does.",
      misconceptions: [
        {
          id: "lamarckian-use-and-pass-on",
          triggerAnswers: ["1"],
          description:
            "The learner had the giraffe pass its own lifetime gains directly to its calves — the classic 'use it and pass it on' (Lamarckian) error.",
          remediationFocus:
            "Ask what physically gets copied into a calf: the parent's existing DNA at conception, not events that happen to the parent's body afterward.",
        },
        {
          id: "cumulative-acquired-change",
          triggerAnswers: ["2"],
          description:
            "The learner treated acquired traits as compounding across generations, as if each generation's effort adds to an inherited total.",
          remediationFocus:
            "Separate what a body does during its life from what its reproductive cells carry; effort does not accumulate in the gene pool across generations.",
        },
      ],
      hints: [
        "Think about what actually gets copied into a calf: the parent's DNA at conception, not events that happen to the parent's body afterward.",
        "A trait 'acquired' during an organism's lifetime, like a stretched muscle or a suntan, does not rewrite the DNA in its reproductive cells.",
        "Ask: did the giraffe's genes change because it stretched? If not, its calves start from the same genetic starting point it did.",
      ],
    },
    {
      id: "step-3",
      concept: "population-vs-individual",
      prompt:
        "Across many generations, the giraffe population's mix of neck lengths does shift toward longer necks. Which statement correctly distinguishes this population-level change from what happens inside one giraffe's lifetime?",
      answer: {
        kind: "multipleChoice",
        options: [
          "A population's trait mix can shift across generations through differential survival and reproduction of existing variants; an individual giraffe's own genes do not change by stretching or effort",
          "An individual giraffe's neck-length genes are updated during its lifetime and then passed on to its calves",
          "Populations do not really change either — 'evolution' just describes giraffes trying harder collectively",
        ],
        correctIndex: 0,
      },
      solution:
        "The population-level shift happens because, generation after generation, giraffes with longer necks (already-existing heritable variation) survive and reproduce somewhat more than shorter-necked giraffes. That statistical shift in the population's trait mix is real and measurable. It does not require, and is not caused by, any individual giraffe's genes changing through use or effort during its own life.",
      misconceptions: [
        {
          id: "lamarckian-use-and-pass-on",
          triggerAnswers: ["1"],
          description:
            "The learner again located the change inside a single giraffe's genes updating during its lifetime, rather than in the population's trait mix shifting across generations.",
          remediationFocus:
            "Keep the two levels separate: an individual's genome is fixed at birth; a population's trait frequencies can shift generation to generation.",
        },
        {
          id: "denies-population-change",
          triggerAnswers: ["2"],
          description:
            "The learner denied that any real, measurable change happens, reframing evolution as collective effort rather than a genuine shift in trait frequencies.",
          remediationFocus:
            "Point to what is actually being measured: the proportion of longer-necked individuals in the population across generations, not any individual's motivation or effort.",
        },
      ],
      hints: [
        "Compare what can change at the population level over many generations to what can and cannot change within one giraffe's life.",
        "A population's trait mix shifts through differential survival and reproduction of variants that already existed — no single individual's genes are edited by effort or need.",
        "Rule out any option that has an individual's genes changing after birth, or the population acting through a collective decision.",
      ],
    },
  ],
  practice: [
    {
      id: "practice-1",
      concept: "heritable-variation",
      prompt:
        "A population of desert mice has long included both light-tan and dark-brown individuals, a color difference pups inherit from their parents. Before any change in the color of the local soil, where did this fur-color variation come from?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Heritable variation already present among individual mice, independent of the soil color",
          "Mice darkening their fur during their lifetime once they started living on darker soil",
          "The population needing a fur color that would match the soil",
        ],
        correctIndex: 0,
      },
      solution:
        "Just as with the giraffe population, the fur-color variation already existed in the mouse population before any environmental change — it is ordinary heritable variation, not a response mice develop during their lives or a trait the population manufactures because it is needed.",
      misconceptions: [
        {
          id: "lamarckian-use-and-pass-on",
          triggerAnswers: ["1"],
          description:
            "The learner had mice darkening their own fur during life and passing that darkening on, rather than recognizing pre-existing heritable variation.",
          remediationFocus:
            "Ask whether this difference existed before or only after any change in the mice's environment.",
        },
        {
          id: "directed-need-teleology",
          triggerAnswers: ["2"],
          description:
            "The learner treated the population as generating a needed trait on purpose rather than selection acting on pre-existing variation.",
          remediationFocus: "Selection can only act on variation a population already has.",
        },
      ],
      hints: [
        "Ask whether this difference existed before or only after any change in the mice's environment.",
        "Selection can only act on variation that a population already has.",
      ],
    },
    {
      id: "practice-2",
      concept: "acquired-traits",
      prompt:
        "One mouse rolls repeatedly in dark soil and looks noticeably darker for a while, though its fur is naturally light-tan underneath. Does this temporary darkening get passed on to its pups?",
      answer: {
        kind: "multipleChoice",
        options: [
          "No — temporary staining or darkening is not a genetic change, so it is not inherited",
          "Yes — the pups are born looking as dark as their stained parent",
          "Partly — the pups inherit some, but not all, of the extra darkness",
        ],
        correctIndex: 0,
      },
      solution:
        "Rolling in soil changes only the outside of the mouse's fur temporarily; it does not alter the DNA in the mouse's reproductive cells. Because inheritance passes on genes, not a parent's temporary appearance, none of that staining is passed to the pups — not fully, and not partially.",
      misconceptions: [
        {
          id: "lamarckian-use-and-pass-on",
          triggerAnswers: ["1"],
          description: "The learner had the stained parent's temporary appearance passed directly to its pups.",
          remediationFocus: "Ask what is actually different about this mouse: its DNA, or just the outside of its fur.",
        },
        {
          id: "cumulative-acquired-change",
          triggerAnswers: ["2"],
          description:
            "The learner treated the acquired darkening as partially heritable, as if acquired change graded smoothly into inherited change.",
          remediationFocus: "Only changes to the genes in reproductive cells can be inherited — there is no partial passing-on of an acquired trait.",
        },
      ],
      hints: [
        "Ask what is actually different about this mouse: its DNA, or just the outside of its fur.",
        "Only changes to the genes in reproductive cells can be inherited.",
      ],
    },
    {
      id: "practice-3",
      concept: "population-vs-individual",
      prompt:
        "Which of these is a genuine population-level evolutionary change, rather than something that happens within a single individual's lifetime?",
      answer: {
        kind: "multipleChoice",
        options: [
          "Over 20 generations, the proportion of dark-furred mice in a population rises because dark mice survive predation better on dark soil",
          "A single mouse's fur looks darker after it rolls in soil",
          "A single mouse grows noticeably thicker fur after living through one cold winter",
        ],
        correctIndex: 0,
      },
      solution:
        "Only the first statement describes an evolutionary change: a shift, across generations, in the proportion of a heritable trait in a population. Both other statements describe something happening to a single individual within its own lifetime, which is not evolution, even when the change is real (like thicker winter fur) or highly visible (like soil staining).",
      misconceptions: [
        {
          id: "individual-change-as-evolution",
          triggerAnswers: ["1", "2"],
          description:
            "The learner selected an individual's temporary or lifetime change as an example of evolution, rather than a shift in a population's trait frequencies across generations.",
          remediationFocus:
            "Evolution is a change in a population across generations, not a change within one individual's lifetime — even a real physiological change like thicker winter fur is not evolution unless it reflects a heritable, population-level shift.",
        },
      ],
      hints: [
        "Ask: is the change happening to one individual, or is it a shift across many generations in the population's trait mix?",
        "A real, visible change in one animal's body during its life is still not evolution unless it is a heritable, population-level shift.",
      ],
    },
  ],
} satisfies Lesson;

export default lesson;
