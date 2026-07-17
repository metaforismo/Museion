# Algebra as Balance

## Course contract

- **Learner band:** ages 12–15; early secondary learners beginning formal one-variable equations.
- **Prerequisites:** whole-number arithmetic; signed-number addition and subtraction; multiplication and division facts; operation precedence; interpreting a letter as a number.
- **Placement:** a three-lesson conceptual bridge into or alongside `linear-equations-intro`. It emphasizes what an equation means and why legal moves work; it does not repeat combining-like-terms instruction.
- **Authorship:** Museion-authored and source-informed. It is not official OpenStax or Illustrative Mathematics curriculum.

## Objectives

By the end of the sequence, a learner should be able to:

1. distinguish an expression from an equation and read `=` as a relation between equal values;
2. decide whether a proposed transformation preserves equality;
3. select an inverse operation, apply it to both sides, and distinguish coefficients from constants;
4. plan reversible steps for simple two-step equations;
5. verify a proposed solution by substitution;
6. compare two valid solution paths and translate a nearby context into a two-step equation.

These are instructional objectives, not claims that one completion proves durable mastery.

## Concept and prerequisite graph

```text
signed arithmetic + multiplication facts + operation precedence
                         |
                         v
        expression vs equation -> equality as relation
                                      |
                                      v
                         equality-preserving moves
                                      |
                   +------------------+------------------+
                   v                                     v
          additive inverses                    multiplicative inverses
                   +------------------+------------------+
                                      v
                         coefficient vs constant
                                      |
                                      v
                         reversible two-step plan
                           /          |          \
                          v           v           v
                substitution check  path comparison  context modeling
```

## Sequence rationale

1. **Equality as an Invariant** repairs the common reading of `=` as a command to calculate. Learners evaluate both sides and audit moves before solving.
2. **Inverse Operations and Isolation** connects a legal equal change to the operation it reverses. It deliberately contrasts a coefficient with a standalone constant.
3. **Two-Step Equations and Transfer** makes planning explicit, requires substitution checks, and shows that different valid paths can reach the same solution. A short context asks the learner to interpret the coefficient and constant rather than merely follow a template.

The numbers stay mental-arithmetic friendly so working memory is available for relational reasoning. Balance language is used as a metaphor, not as a required interactive widget. Number-line language is available for additive inverses, but no diagram must be seen to answer an item.

## Lesson inventory

| Lesson ID | Core steps | Practice items | Primary depth |
| --- | ---: | ---: | --- |
| `algebra-balance-equality-as-invariant` | 5 | 6 | expressions/equations, truth, invariant-preserving moves |
| `algebra-balance-inverse-operations-and-isolation` | 5 | 6 | additive and multiplicative inverses, coefficient/constant distinction |
| `algebra-balance-two-step-equations-and-transfer` | 5 | 6 | planning, substitution, path comparison, contextual near transfer |

Core steps have two orienting-to-procedural hints. Practice items intentionally have no hint ladder, matching Museion practice-mode semantics.

## Misconception map

| Misconception | Diagnostic evidence | Response focus |
| --- | --- | --- |
| `=` means “write the answer next” | selects an expression or compares surface symbols instead of both values | name the two complete expressions and evaluate each side |
| cancellation means erasing a term | accepts a one-sided removal | write the same operation on both sides before simplifying |
| opposite changes across `=` balance out | adds on one side and subtracts on the other | identical operation and quantity must be applied to equal sides |
| visible operation should be repeated | adds 7 to undo `+7`, or divides again to undo `÷3` | pair each operation with its inverse |
| coefficient is an added constant | subtracts 5 from `5x`, or divides by an added 8 | read algebra aloud: “five times x” versus “plus eight” |
| first intermediate value is x | reports 15 from `3x = 15` | check whether the variable is actually isolated |
| division can ignore part of a sum | divides the right side by a coefficient before removing an added constant | operate on the complete side or reverse the operation sequence |
| substitution changes notation | reads `3x` as `3 + x` or substitutes into a constant | replace only the variable and preserve all operations |
| only one path can be valid | rejects a correct distributed or divide-first path | test equivalence at every line; separate validity from efficiency |
| context total can be divided immediately | divides a total before removing a fixed amount | identify fixed amount, per-unit rate, and unknown count/size |

## Private answer and rubric verification notes

- Every numeric answer is an integer and uses tolerance `0`; no approximation is pedagogically intended or mathematically needed.
- Multiple-choice options are plain text. Correct indices were checked against the authored solutions.
- No algebraic-equivalence engine is assumed. Expression answer specs are avoided in this course because the current verifier matches a conservative explicit list rather than symbolic equivalence.
- Each misconception trigger is deliberately wrong under the same deterministic verifier used at runtime. Equivalent numeric forms are included where a likely wrong path yields a fraction or decimal.
- Private `solution` fields state the complete derivation and, for solved equations, a substitution check. They are evaluator truth and must not be copied into prompts or hints.
- Public lesson DTOs may expose prompts, answer kind, and multiple-choice options only. Tests assert that answers, solutions, hints, and misconception data are absent.

## Accessibility notes

- Prompts use short sentences, one question at a time, and familiar words before technical vocabulary.
- Multiplication is written with words, `×`, or parentheses when ambiguity is possible; descriptions explicitly explain that `3x` means `3 × x`.
- Balance imagery is described in words and is not required to complete any item. There are no color-only distinctions, drag interactions, timers, or unavailable widgets.
- Contexts state units and avoid culture-specific knowledge. Arithmetic values are small enough for mental calculation.
- Hints begin by orienting attention, then name a procedure. They do not state the final answer.
- Screen-reader order follows the equation from left to right. Choice labels are meaningful sentences rather than isolated letters.

## Final unassisted near-transfer item

This item belongs in course documentation for an instructor or evaluator to administer **without Maia, hints, worked examples, or shown solutions**. It is not included in learner-visible lesson copy and its answer is intentionally not recorded here.

> A community garden buys 5 identical bags of soil and pays a fixed 6-euro delivery charge. The total is 41 euros. Write an equation for the cost of one bag, solve it using equality-preserving moves, and verify the result in the original situation. Then describe one different valid solution path, if you can find one.

Success evidence: a coherent variable definition, an equation matching the context, reversible operations applied to complete sides, a value with units, and a substitution check. This single item is a near-transfer probe only; it does not establish retention, general fluency, or mastery.

## Red-team cases

1. A learner enters the correct multiple-choice option text with different case or spaces: normalization should accept it.
2. A learner enters an option index: verifier behavior should remain consistent with the authored correct index.
3. A misconception trigger is numerically equivalent to the correct answer: `validateLesson` must reject publication.
4. A learner enters `7/4` for a misconception authored as `1.75`: numeric misconception matching should diagnose it.
5. A learner says a valid but inefficient transformation is invalid: feedback must separate preservation from efficiency.
6. A learner uses “move it across and change the sign”: tutoring should request the actual operation on both sides rather than endorse an unexplained shortcut.
7. A learner divides by zero in an invented path: tutoring must reject the move; the division property requires a nonzero divisor.
8. A prompt or hint accidentally contains `x = ...`: privacy review must catch final-answer leakage even if the runtime DTO omits answer fields.
9. A public DTO contains `solution`, `answer`, `hints`, or `misconceptions`: the focused privacy test must fail.
10. A context answer has no unit or fails the original total: treat the reasoning as incomplete even if the bare number matches.

## Validation checklist

- [x] Three lesson IDs and all step IDs are distinctive within this workstream.
- [x] Each lesson declares every concept used by its core and practice steps.
- [x] Each lesson has 5 coherent core steps and 6 retrieval-practice items.
- [x] Core steps have 2 hints ordered from orienting to procedural, with no final answer.
- [x] Every answer has an author-worked private solution.
- [x] Numeric answers use exact tolerance `0`, justified above.
- [x] Multiple-choice distractors correspond to named plausible misconceptions.
- [x] Misconception triggers are tested with the real verifier and cannot count as correct.
- [x] Learner-visible prompts use no unavailable widget or hidden visual dependency.
- [x] Source URLs, publishers, permission status, and access dates are recorded in `SOURCES.md`.
- [x] No source passage or exercise is reproduced; examples and contexts are newly authored.
- [x] The public DTO privacy boundary has focused test coverage.
- [x] The final unassisted near-transfer item is documented without an answer.
- [ ] Catalog/index integration is intentionally left to the coordinating workstream.
- [ ] Product-level learning efficacy and retention require future learner evidence.

## Honest claim boundaries

The authored artifacts can support and deterministically check the narrow responses encoded in their answer specifications. Passing the lessons shows success on these items at that time. It does not prove durable mastery, independent transfer beyond the documented probe, improved school performance, or the effectiveness of AI tutoring. The balance metaphor is a conceptual support, not a proof model for every future equation type. Source alignment means the mathematical ideas are consistent with the cited OER; Museion does not claim endorsement, certification, or official curriculum status.

