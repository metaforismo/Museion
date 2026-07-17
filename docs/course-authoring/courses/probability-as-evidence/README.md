# Probability as Evidence

## Authoring status

Sixth-grade-to-early-secondary **foundations** sequence authored for Museion's
deterministic `Lesson` contract. It is not a statistics credential, a risk
assessment tool, or evidence that a learner has durable probability mastery.

The course is intentionally count-based. It teaches learners to state the
reference group before interpreting a probability claim:

1. `probability-as-evidence-sample-spaces` — enumerate equally likely
   outcomes and complements.
2. `probability-as-evidence-conditional-evidence` — condition on the supplied
   evidence subgroup.
3. `probability-as-evidence-base-rates` — distinguish a base rate, a flag,
   and a conditional conclusion from a complete count table.

## Prerequisites

- Whole-number counting and comparison.
- Reading simple fractions as part of a whole.
- For the final lesson, addition of two whole-number counts and fraction
  simplification.

The implementation cannot store prerequisite edges for authored lessons yet.
This ordering is therefore authoring guidance, not enforced learner gating.

## Lesson objectives and deterministic evidence

| Lesson | Learner objective | Deterministic evidence | Near-transfer task |
| --- | --- | --- | --- |
| Sample spaces | Name possible outcomes; distinguish a favourable count from the full sample space; identify a complement. | Numeric, expression, and multiple-choice verifiers for explicit finite sets. | Eight-sector spinner with a strict comparison condition. |
| Conditional evidence | Select the evidence subgroup as the denominator and preserve the direction of the condition. | Numeric and multiple-choice verifiers over supplied count tables. | Weather-report record with `relevant | flagged`. |
| Base rates | Keep a starting rate separate from a screen-conditioned claim and avoid treating a flag as certainty. | Numeric, expression, and multiple-choice verifiers over a fully specified product-check table. | Interpret the supported claim rather than overgeneralizing it. |

Each code lesson contains a step-level misconception model, author-verified
solution, and least-to-most hint ladder. `validateLesson` checks that a
misconception trigger never verifies as correct. The public lesson projection
removes answer specifications, solutions, hints, and misconception records.

## Misconception model

- **Denominator drift:** retaining the whole population after evidence narrows
  the reference group.
- **Direction reversal:** confusing `P(A | B)` with `P(B | A)`.
- **Flag certainty:** treating an observed signal as proof instead of a
  proportion within the signalled group.
- **Base-rate replacement:** applying a conditional proportion to the whole
  population.
- **Comparison-language error:** including a boundary case when the condition
  is strictly greater than or strictly less than.

## Evidence limits

- Correct answers are observations on these finite, stated scenarios only.
- No task estimates a learner's real-world judgment, risk, or decision quality.
- The final practice prompt is a near transfer of the same count-table
  structure, not delayed retention or far transfer.
- The examples avoid medical, personal, and high-stakes classification claims.

## Source ledger

| Source | Publisher and status | License / permission checked | How it informed this authored course | Access verified |
| --- | --- | --- | --- | --- |
| [Introductory Statistics 2e, Chapter 3 introduction](https://openstax.org/books/introductory-statistics-2e/pages/3-introduction) | OpenStax, Rice University; openly accessible textbook. The chapter states objectives for probability terminology, independence, count tables, Venn diagrams, and tree diagrams. | The official page states CC BY-NC-SA 4.0 with attribution required; OpenStax marks its name, logos, and covers as excluded. | Sequence motivation for probability terminology, conditional counts, and interpreting a stated reference group. No text, figures, exercises, or artwork were copied. | 2026-07-17 |
| [Introductory Statistics 2e book details](https://openstax.org/details/books/introductory-statistics-2e) | OpenStax / Rice University; official book record, published 2023-12-13. | Official book record identifies CC BY-NC-SA 4.0. | Publisher, date, and license verification for the source above. | 2026-07-17 |

The course uses independently authored finite examples and mathematical facts;
it is not a redistribution or adaptation of OpenStax prose or illustrations.
If future work incorporates protected expressive content, its attribution,
non-commercial, share-alike, and OpenStax permission constraints must be
reviewed before publication.
