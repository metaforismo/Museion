# Functions as Change

## Authoring status

Early-secondary **foundations** sequence authored for Museion's deterministic
`Lesson` contract. It introduces a function as a one-output-per-input rule,
then treats linear functions as compact models of a starting value and a
constant change. It is not calculus instruction, proof that a model is true,
or evidence of durable functional reasoning.

1. `functions-as-change-input-output` — evaluate a named rule and test the
   one-output-per-input condition.
2. `functions-as-change-rate-of-change` — compute constant rate from a table
   and distinguish it from an initial value.
3. `functions-as-change-linear-models` — build a simple linear prediction and
   bound the interpretation to its stated context and range.

## Prerequisites

- Whole-number arithmetic and order of operations.
- Interpreting a simple table with paired values.
- For rate tasks, subtraction and division of small whole-number differences.

The current authored `Lesson` schema has no explicit prerequisite field, so
the order above is authoring guidance rather than enforced progression.

## Lesson objectives and deterministic evidence

| Lesson | Learner objective | Deterministic evidence | Near-transfer task |
| --- | --- | --- | --- |
| Input and output | Evaluate function notation and decide whether one input has more than one output. | Exact numeric and two-option multiple-choice verifiers. | Print-shop charge rule. |
| Rate of change | Compute output change per input unit; distinguish coefficient from initial value. | Exact numeric and multiple-choice verifiers. | Trail-distance constant-rate model. |
| Linear models | Connect rate and initial value to a prediction; state a local model boundary. | Exact numeric and multiple-choice verifiers. | Battery value under a stated short-test rule. |

Each code lesson supplies an author-verified explanation, explicit
misconception triggers, and a hint ladder. The public lesson projection omits
answer specifications, solutions, hints, and misconception data; server-side
verifiers retain correctness authority.

## Misconception model

- **Notation confusion:** reading `f(2)` as multiplication instead of an
  output for input 2.
- **Operation-order drift:** adding before multiplication when evaluating a
  rule.
- **Input/output reversal:** inspecting repeated outputs instead of asking
  whether a single input has multiple outputs.
- **Rate/intercept confusion:** treating the starting value as a change per
  unit, or the rate as the starting value.
- **Model overreach:** reading a local constant-rate rule as a guarantee
  outside its stated input range or context.

## Evidence limits

- Correct responses establish only performance on the registered expression,
  table, or context.
- The final practice task in each lesson changes the surface context but keeps
  the same mathematical structure; it is immediate near transfer, not a
  retention or far-transfer measure.
- A linear rule is presented as a conditional model. Learners are not asked to
  make high-stakes forecasts or to infer real-world certainty from a rule.

## Source ledger

| Source | Publisher and status | License / permission checked | How it informed this authored course | Access verified |
| --- | --- | --- | --- | --- |
| [Precalculus 2e, 1.1 Functions and Function Notation](https://openstax.org/books/precalculus-2e/pages/1-1-functions-and-function-notation) | OpenStax, Rice University; openly accessible textbook section. It presents the one-output-per-input definition, function notation, evaluation, and domain/range framing. | The official page identifies CC BY-NC-SA 4.0 with attribution required. | Sequence motivation for function definition, notation, and evaluating a rule. No text, figures, examples, or artwork were copied. | 2026-07-17 |
| [Precalculus 2e preface](https://openstax.org/books/precalculus-2e/pages/preface) | OpenStax / Rice University; official scope and licensing page. It identifies Chapters 1–4 as functions foundations and describes open access. | Official preface states CC BY-NC-SA 4.0 and that OpenStax marks/logos/covers are excluded from that license. | Publisher, scope, and license verification for the source above. | 2026-07-17 |

The lessons use independently authored contexts and elementary mathematical
facts. They are not a redistribution or adaptation of OpenStax prose,
exercises, figures, or artwork. Future use of expressive OpenStax content
requires attribution and a separate review of the stated non-commercial and
share-alike conditions.
