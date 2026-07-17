# Samples to Conclusions

## Authoring status

Early-secondary research-literacy sequence authored for Museion's deterministic
`Lesson` contract. It supports modest reasoning about samples; it is not a
statistics qualification, a population survey, or a tool for high-stakes
decisions.

1. `samples-to-conclusions-sampling-frame` — separate the intended population
   from the group a collection method can actually reach.
2. `samples-to-conclusions-variability` — calculate a sample proportion and
   interpret different repeated samples without declaring one automatically
   wrong.
3. `samples-to-conclusions-bounded-estimates` — express an estimate with its
   group and collection limits instead of overclaiming.

## Learner band and prerequisites

- Intended band: ages 12–16 / early secondary, with educator adaptation for
  accessibility and language needs.
- Prerequisites: part–whole fractions, decimal or percent conversion, reading
  short scenarios, and comparing two counts.
- Boundary: all scenarios use fictional, low-stakes public settings. They ask
  for no personal, protected, health, financial, disciplinary, or identity data.

The current lesson schema does not represent age limits or prerequisite edges.
The constraints above guide authors and facilitators; they are not yet enforced
by a runtime gate.

## Pedagogical and safety model

Each lesson has exactly three guided deterministic steps and three practice
steps. Every step includes a complete answer specification, author-verified
solution, explicit misconception triggers, and a three-level least-to-most hint
ladder. Each final practice prompt is a context-shifted, immediate, unassisted
near-transfer observation.

Correctness, scoring, and publication privacy remain deterministic. Public
lesson payloads contain prompts and allowed multiple-choice options only; they
exclude answers, worked solutions, hints, and tutor-facing misconception data.
An immediate correct response does not prove durable mastery, general learning
gains, long-term statistical judgment, or far transfer.

## Misconception model

- **Target/frame confusion:** naming the desired population instead of people
  reachable through the actual invitation or list.
- **Coverage dismissal:** treating a missed subgroup as proof that included
  respondents are dishonest or useless.
- **Count-only answer:** reporting a numerator without a part–whole estimate.
- **Reversed proportion:** placing the full sample above the subgroup count.
- **Variation-as-error:** assuming different samples prove fabrication or a
  counting mistake.
- **Sample-to-certainty jump:** turning one estimate into an exact, universal,
  permanent, individual, or causal claim.

## Source ledger

| Source | Publisher and status | License / permission checked | How it informed this independently authored course | Access verified |
| --- | --- | --- | --- | --- |
| [NIST/SEMATECH e-Handbook: Sampling](https://www.itl.nist.gov/div898/handbook/ppc/section3/ppc33.htm) | National Institute of Standards and Technology (NIST), U.S. government; openly accessible primary institutional guidance. | [NIST Copyrights and Disclaimers](https://www.nist.gov/copyrights-disclaimers) states that NIST website information is public unless marked otherwise and requests appropriate source credit. | Informed the framing of a sampling plan, intended population, and the limits of an invitation route. No prose, figures, tables, exercises, or examples were copied. | 2026-07-17 |
| [NIST/SEMATECH e-Handbook: Assumptions](https://www.itl.nist.gov/div898/handbook/ppc/section1/ppc134.htm) | NIST, U.S. government; openly accessible statistical-quality guidance. | Same NIST public-information and source-credit boundary above; no marked third-party content was reused. | Informed the principle that sample facts are not automatically population facts and that representativeness, size, variability, and desired precision affect conclusions. All lesson scenarios and wording are original Museion authorship. | 2026-07-17 |
| [NIST/SEMATECH e-Handbook: Random Sampling](https://www.itl.nist.gov/div898/handbook/pmd/section2/pmd215.htm) | NIST, U.S. government; openly accessible data-analysis guidance. | Same NIST public-information and source-credit boundary above. | Informed the note that random sampling helps avoid systematic sampling bias on average but does not by itself guarantee representativeness in every realised sample. | 2026-07-17 |

The course is independently authored and does not redistribute NIST prose,
diagrams, trademarks, datasets, or exercises. Any future use of third-party
expressive material needs separate rights, attribution, and accessibility review.

## Evidence limits

- Every correct result concerns a small, stated fictional scenario only.
- The practice tasks do not estimate a learner's real-world statistical
  competence, durable mastery, general learning gains, or far transfer.
- Sample estimates shown here are not forecasts, risk scores, or decisions about
  people.
- The sequence is intentionally introductory: it does not replace formal
  sampling design, uncertainty quantification, ethics review, or domain advice.
