# Proportional Reasoning

## Authoring status

A three-lesson **Arithmetic** foundations path authored for Museion's
deterministic `Lesson` contract. It is Museion-authored and source-informed;
it is not official Illustrative Mathematics or OpenStax curriculum, and it is
not evidence of durable mastery.

The course teaches learners to find the invariant inside a ratio (the unit
rate), scale two quantities together without breaking that invariant, and
finally decide — in a fresh context — whether a relationship is proportional
at all before computing with it.

1. `proportional-reasoning-unit-rate` — find a unit rate from a table of
   values; recognize a proportional relationship by its constant ratio and
   its `(0, 0)` starting point; diagnose additive thinking and an inverted
   rate.
2. `proportional-reasoning-scaling` — scale a recipe, mixture, or map up or
   down, keeping both quantities matched to the same factor; solve for a
   missing value with correspondence-checked reasoning.
3. `proportional-reasoning-transfer` — decide whether a fresh context
   (currency exchange, constant speed, density) is proportional, including a
   deliberate trap where a fixed fee is mistaken for a proportional plan, then
   compute within the relationship.

## Audience / learner band

Ages 11–14, upper-primary through early-secondary learners meeting formal
proportional relationships for the first time (typically following ratio and
fraction work). The course is also suitable for adults refreshing arithmetic
fundamentals — the contexts (recipes, currency, maps, fuel economy) assume no
specialized background beyond the stated prerequisites.

## Prerequisites

- Whole-number multiplication and division facts.
- Comparing and simplifying simple fractions (including recognizing that
  `6/8` and `3/4` are the same value).
- Reading paired values in a table.

The implementation does not yet gate a learner's access by prerequisite
completion; this list is authoring guidance for sequencing, not enforced
gating. Lessons 2 and 3 assume the prior lesson in this course as their
immediate prerequisite.

## Learning objectives

By the end of the sequence, a learner should be able to:

1. Find a unit rate from a table or short scenario and use it to decide
   whether a relationship is proportional (constant ratio, passes through the
   origin).
2. Scale two related quantities by the same factor — up or down — to keep a
   recipe, mixture, or scale drawing in the same proportion, and solve for a
   missing value by matching the correct pairs of numbers.
3. In an unfamiliar context, decide whether a relationship is proportional
   before computing, and correctly identify when a fixed fee or flat charge
   breaks proportionality even though a per-unit rate is still present.

These are instructional objectives for the authored items in this course, not
a claim of general mathematical mastery.

## Source basis

- Illustrative Mathematics, Grade 7, Unit 2: *Introducing Proportional
  Relationships* — tables of equivalent ratios, unit rate as the constant of
  proportionality, and scaling reasoning informed the sequencing and framing
  of Lessons 1 and 2.
- Illustrative Mathematics, Grade 6, Unit 2: *Introducing Ratios* — ratio and
  rate language and the recipe/mixture scaling framing informed Lesson 2.
- OpenStax *Prealgebra 2e*, Section 5.6, *Ratios and Rate* — unit rate and
  unit price framing informed Lesson 1.
- OpenStax *Prealgebra 2e*, Section 6.5, *Solve Proportions and Their
  Applications* — proportion set-up and distance/rate/time and similar-figure
  applications informed Lesson 2's correspondence work and Lesson 3's
  transfer contexts.

No source text, figures, or exercises are reproduced; all prompts, numbers,
and contexts in this course are newly authored. Citations are given as labels
per the authoring spec; no source URLs are asserted here.

## Misconception map

| Lesson | Misconception id (steps) | Diagnostic trigger | Response focus |
| --- | --- | --- | --- |
| Unit rate | `additive-pattern-as-proportional` (step-1) | Picks the table that grows by a constant added amount, not a constant ratio | A proportional relationship needs a constant ratio and must pass through `(0, 0)`; a constant added amount is additive, not multiplicative |
| Unit rate | `both-look-steady` (step-1) | Calls any regular-looking table proportional without dividing | Divide each pair before deciding; "regular" is not the same as "constant ratio" |
| Unit rate | `inverts-the-rate` (step-2, practice-2) | Computes the reciprocal unit rate (e.g. gallons-per-mile instead of miles-per-gallon) | Confirm which quantity the question puts "per one" of |
| Unit rate | `reports-a-total-not-a-rate` (step-2) | Reports a total instead of dividing down to one unit | A unit rate is a division reduced to "for one unit" |
| Unit rate | `adds-the-same-amount` (step-3) | Adds the same absolute increase to both quantities instead of multiplying by the scale factor | Scaling multiplies both quantities by the same factor; it never adds a fixed amount to both |
| Unit rate | `flips-the-ratio-multiplier` (step-3) | Multiplies by a piece of the original ratio instead of the actual scale factor | Find the single factor that produced the known change, then apply exactly that factor |
| Unit rate | `doubts-general-validity` / `misjudges-constant-ratio` (practice-1) | Treats proportionality as tied to the rows shown, or assumes a changing ratio without dividing | The constant ratio applies to any amount, not just the rows listed; always divide each row to check |
| Unit rate | `adds-the-scale-factor` (practice-3) | Adds the scale factor itself to the original value instead of multiplying by it | A scale factor multiplies; it is never added to one of the original values |
| Scaling | `scales-one-quantity-only` (step-1) | Leaves the second quantity unchanged after scaling the first | Both quantities must be scaled by the same factor |
| Scaling | `uses-wrong-multiplier` (step-1) | Multiplies by an original quantity in the ratio instead of the scale factor | Identify the scale factor first; don't reuse an original amount as if it were the factor |
| Scaling | `wrong-correspondence` (step-2, practice-2) | Crosses the pairing — matches an original value with a new value from the other quantity | Match "original with original" and "new with new" before dividing |
| Scaling | `leaves-value-unscaled` (step-2, practice-1, practice-2) | Keeps one quantity at its original value while the other is scaled | Find the factor connecting the known change, and apply it to the other quantity too |
| Scaling | `inverts-the-correspondence` (step-3) | Reports the reciprocal rate (e.g. gravel-per-cement instead of cement-per-gravel) | The requested "per one" quantity belongs in the numerator |
| Scaling | `adds-the-same-amount` (practice-1) | Adds the same absolute increase to both quantities instead of multiplying by the scale factor | Scaling multiplies both quantities by the same factor, not addition |
| Scaling | `uses-wrong-drawings-scale` / `mismatches-units-within-ratio` (practice-3) | Uses a scale from the wrong object, or puts mismatched units in each side of the equation | Identify which numbers describe the same object; keep the same unit in the same position on both sides |
| Transfer | `fixed-fee-still-looks-proportional` (step-1, practice-1) | Calls a flat-fee-plus-rate plan proportional because the per-unit rate looks constant | Check the cost at zero units; a flat fee means the relationship does not pass through `(0, 0)` |
| Transfer | `adds-instead-of-scales` (step-2, practice-2) | Adds the given numbers, or the change in one quantity, instead of applying a scale factor | Find the unit rate, then multiply by the new amount |
| Transfer | `inverts-the-rate` (step-2, step-3, practice-2) | Computes and applies the reciprocal rate | Confirm which quantity the rate is "per one" of before multiplying |
| Transfer | `leaves-value-unscaled` (step-3, practice-3) | Reports an original value unchanged instead of scaling it | For a fixed rate (density, exchange rate, ratio), both quantities scale together |
| Transfer | `inverts-the-ratio-direction` (practice-3) | Multiplies instead of dividing (or vice versa) when applying a "larger quantity is `n` times the smaller" ratio | Identify which quantity is larger before deciding whether to multiply or divide |

## Answer kinds and verification notes

- Numeric answers use `tolerance: 0`; results are integers or, where the
  concrete context genuinely produces one (Lesson 2's cement-per-gravel
  step), a value expressed through the `expression` kind as a simplified
  fraction or its decimal equivalent.
- Multiple-choice options are short factual statements; distractors
  correspond to the named misconceptions above.
- One `expression` step (Lesson 2, "correspondence-check") accepts a
  fraction and its decimal equivalent (`2/5`, `0.4`) — following the existing
  house convention for fraction-valued answers rather than free-form
  equation matching, since the verifier matches by exact normalized text.
- Every misconception trigger was checked with the real deterministic
  verifier (`validateLesson`, backed by `verify()`), including the fraction
  case explicitly called out in the authoring spec: no trigger is a
  numerically-equivalent fraction of the correct numeric answer (for
  example, Lesson 1's unit-rate step accepts `3` as correct and never treats
  an equivalent form of `3` as a misconception trigger).
- Every step has an author-verified `solution` that states the full
  derivation; these are server-only and are not shown to learners before
  they solve the step.

## Accessibility notes

- Prompts use short sentences and state units explicitly (cups, cm, grams,
  dollars, euros, miles, hours) rather than relying on symbols alone.
- Multiplication and division are written in words or with `×` / `÷`; no
  step requires interpreting an unlabelled symbol.
- Contexts (recipes, maps, currency, vehicles, paint, concrete) avoid
  culture-specific or high-stakes content and use small, mentally-trackable
  numbers.
- No step depends on color alone, a drag interaction, a timer, or an
  unavailable visual widget; every table referenced in a prompt is also
  described in words within the prompt text.
- Hints follow an orienting-question-first ladder (what to check, then a
  conceptual nudge, then a procedural nudge) and never state the final
  numeric or textual answer.
- Multiple-choice options are complete, meaningful phrases rather than bare
  letters, so they read sensibly with a screen reader.

## Evidence boundary

Correct responses on this course's steps are an immediate, in-context
observation: the learner produced the specified correct answer (or its
accepted equivalent form) on these authored items at the time of attempt, and
one designed near-transfer prompt per lesson (marked "near transfer" in the
prompt text) checks whether that response generalizes to a structurally
similar but unpracticed scenario. This does **not** establish durable
mastery, retention beyond the session, transfer to contexts materially
different from those authored here (for example, multi-step or non-linear
rate problems), or general "proportional reasoning ability" as a trait. The
fixed-fee trap in Lesson 3 checks one specific, well-documented confusion; it
is not a comprehensive test of a learner's ability to classify arbitrary
real-world relationships.
