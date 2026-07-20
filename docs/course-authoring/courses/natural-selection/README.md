# Natural Selection as Evidence

## Authoring status

A three-lesson **Biology** path authored for Museion's deterministic `Lesson`
contract. It is not a biology credential, an official curriculum alignment,
or evidence that a learner has durable mastery of evolutionary biology.

The course teaches natural selection as a mechanism with testable
consequences, not as a narrative of organisms "trying" or "needing" to
change:

1. `natural-selection-variation` — heritable variation already exists in a
   population before selection acts on it; individuals do not adapt during
   their own lifetime and pass that adaptation on.
2. `natural-selection-differential-survival` — natural selection is
   differential survival and reproduction driven by a trait's match to a
   specific environment, computed as a trait-frequency shift across one
   generation.
3. `natural-selection-transfer` — the same reasoning applied to a fresh case
   (antibiotic resistance in bacteria, with a near-transfer application to
   drought-driven finch beak depth in practice), ending in a falsifiable
   prediction that could distinguish "pre-existing resistant variants
   survived" from "bacteria learned resistance."

## Audience and learner band

Ages 13+, secondary biology (first exposure to natural selection through an
introductory or standards-aligned biology course). The reasoning and
arithmetic (proportions, simple fractions, percent-style comparisons) are
also accessible to adult learners encountering evolutionary biology for the
first time or reviewing it.

## Prerequisites

- Read and compare simple fractions and percentages.
- Whole-number subtraction and multiplication of a whole number by a simple
  fraction (e.g., 3/4 of 24).
- Distinguish an individual organism from a population (ordinary biology
  vocabulary; not assumed to be mastered — Lesson 1 re-establishes it).

The implementation cannot store prerequisite edges for authored lessons yet.
This ordering is authoring guidance, not enforced learner gating.

## Learning objectives

1. Explain that natural selection acts on heritable variation already
   present in a population, and distinguish this from an individual
   organism adapting during its own lifetime and passing that adaptation on.
2. Compute how a population's trait mix shifts across one generation of
   differential survival, using clean fractions, and distinguish fitness
   (survival and reproduction relative to a specific environment) from
   physical strength or toughness.
3. Apply the same reasoning to a fresh case (antibiotic resistance) and
   identify an observation that would genuinely test — and could falsify —
   a claim about how a trait's prevalence increased.

## Lesson objectives and deterministic evidence

| Lesson | Learner objective | Deterministic evidence | Near-transfer task |
| --- | --- | --- | --- |
| Variation and Heritability | Locate the source of heritable variation as pre-existing, not individually acquired or population-willed. | Multiple-choice verifiers across a giraffe neck-length scenario (steps) and a desert-mouse fur-color scenario (practice). | Practice reapplies the same three-way diagnosis (pre-existing variation / acquired trait / population need) to a fresh organism. |
| Differential Survival and Reproduction | Separate environment-relative fitness from physical strength; compute a before/after trait proportion from survivor counts. | Multiple-choice, numeric, and expression (fraction) verifiers over a peppered-moth population with clean removal fractions (1/4, 3/4). | Practice repeats the computation with a beetle population, then reverses the environment to test whether fitness is treated as fixed or context-dependent. |
| Transfer: Antibiotic Resistance | Explain resistance spread as selection among pre-existing resistant variants, not bacterial "learning," and choose an observation that could falsify a claim about its origin. | Multiple-choice, numeric, and multiple-choice (falsifiable-prediction) verifiers over a bacterial population with clean survivor arithmetic. | Practice transfers the same variation-then-selection reasoning and fraction computation to Galápagos finch beak depth under drought. |

Each lesson contains a step-level misconception model, an author-verified
solution, and a least-to-most hint ladder that never states the final
answer. `validateLesson` checks that every misconception trigger fails to
verify as correct — this was run against all three lessons before this
course was reported as ready. The public lesson projection removes answer
specifications, solutions, hints, and misconception records.

Answer kinds used across the course: multiple choice (concept diagnosis and
the falsifiable-prediction step), numeric (before/after trait proportions
and survivor counts, entered as clean decimals or fractions), and
expression (post-selection trait proportions as a fraction, with both the
unreduced and reduced form accepted, e.g. `12/18` and `2/3`).

## Misconception map

**Lesson 1 — Variation and Heritability**

- `lamarckian-use-and-pass-on` — the "use it and pass it on" error: treating
  a trait an individual gains or strengthens during its own lifetime (a
  stretched neck, a temporary stain, tougher use-worn structures) as if it
  is passed to offspring. Triggered in steps 1–3 and all three practice
  items with different organisms (giraffe, mouse) to check it is not
  scenario-specific.
- `directed-need-teleology` — "the species changed because it needed to":
  treating a population as sensing a need and generating a trait on
  purpose, rather than selection filtering variation that already existed.
- `cumulative-acquired-change` — a related but distinct error: treating
  acquired traits as compounding across generations (each generation's
  effort adding to an inherited total), rather than recognizing that
  acquired change is not inherited at all, fully or partially.
- `denies-population-change` — swinging too far the other way: denying that
  any real, population-level change occurs and reframing evolution as
  collective effort.
- `individual-change-as-evolution` — conflating a real, visible change
  within one individual's lifetime (temporary staining, winter coat growth)
  with a genuine evolutionary (population, cross-generation) change.

**Lesson 2 — Differential Survival and Reproduction**

- `fitness-as-physical-strength` — equating fitness with physical strength
  or power rather than reproductive success produced by a trait's match to
  a specific environment.
- `survival-of-the-strongest` — the "survival of the strongest" error:
  applying a fixed, environment-independent toughness ranking instead of
  recognizing that which trait is favored depends on the current
  environment (reinforced in practice by reversing the environment).
- `fixed-fitness-ranking` — a related error surfaced when the environment
  reverses: treating fitness as a permanent property of a trait rather than
  something that can flip when the environment changes.
- Denominator-drift family (`reports-raw-count`, `computes-light-proportion`,
  `uses-whole-population-denominator`, `part-to-part-ratio`,
  `uses-original-population-denominator`): the standard set of proportion
  errors — reporting a raw count instead of a proportion, using the wrong
  subgroup, keeping the original population as the denominator after
  selection has occurred, or comparing two parts to each other instead of a
  part to the whole survivor group.

**Lesson 3 — Transfer: Antibiotic Resistance**

- `bacteria-learn-resistance` — the misconception named in this course's
  brief: treating antibiotic resistance as something bacteria learn through
  exposure, like a behavior, rather than a pre-existing heritable trait that
  survives and spreads through selection. Triggered in both the concept
  step and the falsifiable-prediction step.
- `antibiotic-induces-resistance` — a related directed-mutation error:
  treating the antibiotic as causing or aiming the resistance mutation
  rather than merely selecting among mutations that arose by chance before
  exposure.
- `unfalsifiable-non-differentiating-test` — choosing an observation that is
  consistent with both competing explanations, so it could not actually
  falsify either one (the core research-literacy point of the transfer
  lesson).
- Survivor-arithmetic family (`counts-only-resistant-survivors`,
  `applies-kill-rate-to-resistant`, `computes-removed-not-survivors`,
  `uses-whole-population-denominator`): the same computational errors as
  Lesson 2, re-triggered in a bacterial-population and finch-population
  context to check the reasoning transfers rather than being tied to
  moths specifically.

## Accessibility notes

- All scenarios are text-based with no reliance on color perception, image
  interpretation, or audio; coloring differences (moth, beetle, mouse) are
  always also given as explicit labels ("dark-colored," "light-colored"),
  never conveyed by a color swatch alone.
- Numbers are kept small, round, and evenly divisible by the stated
  fractions (e.g., 16 dark moths losing exactly 1/4 to whole-number
  removal) so no step depends on rounding conventions or a calculator.
- Multiple-choice options are complete sentences rather than single words or
  symbols, so screen-reader users get full context without relying on
  surrounding layout.
- Hints are a strict ladder (orienting question, then concept, then
  procedure) and never state the final answer, so a learner using hints
  extensively is not shown the graded response.
- No scenario in this course involves human genetics, disease severity in
  people, or any protected-characteristic framing; organisms are giraffes,
  moths, beetles, desert mice, bacteria, and finches.

## Evidence boundary

Correct responses on this course are observations on these authored,
finite scenarios and one immediate near-transfer task per lesson (a fresh
organism or case reusing the same reasoning, answered without hints,
solutions, or Maia's involvement). They do not establish durable mastery of
evolutionary biology, retention beyond the session, readiness for a
standards-aligned biology assessment, or general scientific-reasoning
ability. The course also makes no claim about learners' real-world
acceptance of evolutionary theory — it evaluates whether a specific
misconception was diagnosed and whether a specific computation or
falsifiable-prediction judgment was made correctly on the item presented.

## Source basis

This course is independently authored. It uses standard, textbook-level
facts about natural selection (heritable variation, differential survival
and reproduction, the peppered moth industrial-melanism case, Darwin's
finches, and antibiotic resistance as a selection process) that are common
to introductory biology curricula; it is not a redistribution, excerpt, or
paraphrase of any single source's text, figures, or exercises.

| Source | Publisher and status | License / permission checked | How it informed this authored course | Access verified |
| --- | --- | --- | --- | --- |
| [18.1 Understanding Evolution, Biology 2e](https://openstax.org/books/biology-2e/pages/18-1-understanding-evolution) | OpenStax, Rice University; openly accessible introductory biology textbook, chapter on evolution and the origin of species. | OpenStax's standard textbook license is CC BY 4.0 with attribution required, per OpenStax's general licensing policy for all its titles. This session confirmed the page's existence and title via search-result metadata; a direct page fetch to re-confirm the in-page license notice was blocked by this environment's outbound network policy (openstax.org connections were refused at the network layer), so the license statement above is OpenStax's stated general policy rather than a same-session read of this exact page. | Confirms the scope and vocabulary of "understanding evolution" (heritable variation, natural selection as differential survival and reproduction, common student misconceptions about goal-directed change) as standard introductory content. No text, figures, or exercises were copied. | 2026-07-19 (search-confirmed; direct fetch blocked by sandbox network policy) |
| [Biology 2e book details](https://openstax.org/details/books/biology-2e) | OpenStax / Rice University; official book record. | Same as above — OpenStax's standard CC BY 4.0 policy. | Publisher and title verification for the source above. | 2026-07-19 (search-confirmed; direct fetch blocked by sandbox network policy) |
| [Theory of Evolution by Natural Selection, CK-12 Biology FlexBook 2.0](https://flexbooks.ck12.org/cbook/ck-12-biology-flexbook-2.0/section/5.14/primary/lesson/theory-of-evolution-by-natural-selection-bio/) | CK-12 Foundation; openly accessible FlexBook lesson on Darwin's theory of evolution by natural selection. | CK-12 states its FlexBook content is freely available for educational use under CK-12's own attribution license. This session confirmed the page's existence, section number, and title via search-result metadata; a direct fetch to re-confirm the exact license text was blocked by this environment's outbound network policy (ck12.org connections were refused at the network layer). | Confirms the standard framing of natural selection as heritable variation plus differential survival and reproduction, used as the throughline across all three lessons. No text, figures, or exercises were copied. | 2026-07-19 (search-confirmed; direct fetch blocked by sandbox network policy) |

If a future authoring pass has working network access to these hosts, the
license notices on the exact pages above should be independently
re-confirmed and this table updated with a direct-fetch verification date.
