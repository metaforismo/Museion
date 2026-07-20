# Forces and Motion

## Course contract

- **Learner band:** ages 14+ · secondary physics (first exposure to Newtonian dynamics); the reasoning is equally valid for adult learners meeting mechanics for the first time.
- **Prerequisites:** comfortable arithmetic with whole numbers and simple decimals/fractions; basic algebraic rearrangement of a three-variable equation (e.g. solving `d = rt` for any one variable); reading signed quantities (positive/negative) as direction on a line; no prior physics required.
- **Placement:** a three-lesson introduction to Newtonian dynamics — net force and the first law, the second law (`a = F/m`), and near-transfer application including the third law. It is a conceptual entry point, not a full kinematics or dynamics unit; it does not cover vectors in two dimensions, energy, or momentum.
- **Authorship:** Museion-authored and source-informed. It is not official OpenStax curriculum, and completion is not equivalent to any OpenStax assessment.

## Objectives

By the end of the sequence, a learner should be able to:

1. combine two or more forces acting on an object into a single net force, accounting for direction;
2. apply Newton's first law to predict that balanced forces (including zero net force at constant velocity) produce no change in motion, and diagnose the "motion requires a continuous force" and "heavier objects fall faster" misconceptions;
3. use Newton's second law (`a = F/m`) to compute acceleration, force, or mass from the other two quantities, and reason proportionally about how doubling force or mass changes acceleration;
4. distinguish mass (an invariant amount of matter, in kg) from weight (a location-dependent gravitational force, in N);
5. apply net force and `a = F/m` together in a fresh scenario involving friction (a sled opposed by snow, a crate, an elevator);
6. explain why a Newton's third law action-reaction pair — equal and opposite — never causes an object's own forces to cancel, because the two forces in the pair act on two different objects.

These are instructional objectives, checked against authored, deterministically verified items. They are not claims that one completion proves durable mastery of mechanics.

## Source basis

- OpenStax College Physics 2e — Chapter 4, "Dynamics: Force and Newton's Laws of Motion" (net force, Newton's first, second, and third laws, mass vs. weight, and the "heavier objects fall faster" misconception are all treated in this chapter).
- OpenStax College Physics 2e — Chapter 5, "Further Applications of Newton's Laws: Friction, Drag, and Elasticity" (friction opposing applied force, used as the near-transfer context in lesson 3).

No source text, figure, or exercise is reproduced. All scenarios (tug-of-war ropes, tugboats, sleds, toy cars, elevators, rockets) are newly authored for this course, consistent with the cited standard mechanics treatment.

## Concept and prerequisite graph

```text
whole-number arithmetic + simple equation rearrangement
                         |
                         v
              net force (combine forces by direction)
                         |
                         v
          Newton's first law: balanced forces -> zero acceleration
           (diagnoses: continuous-force myth, heavier-falls-faster)
                         |
                         v
        Newton's second law: a = F/m (compute a, F, or m)
                         |
              +----------+----------+
              v                     v
   proportional reasoning     mass vs. weight
   (double F or m -> a?)    (kg is constant; N depends on gravity)
              +----------+----------+
                         v
        near-transfer: net force + a = F/m with friction
        (sled, crate, elevator) + Newton's third law pairs
                (action-reaction acts on two objects)
```

## Sequence rationale

1. **Net Force and Newton's First Law** (`forces-and-motion-net-force`) establishes that "net force" means combining every force on an object with its direction, and that a first law prediction follows directly: zero net force means zero acceleration, whether the object is at rest or already moving at constant velocity. This lesson directly confronts the Aristotelian "motion requires a continuous force" misconception with a frictionless-ice scenario, and previews (without yet computing) why heavier and lighter objects fall at the same rate.
2. **Newton's Second Law: a = F/m** (`forces-and-motion-acceleration`) makes the force–mass–acceleration relationship computational: clean-integer problems solve for each of the three quantities in turn, an expression step asks the learner to write `F = ma` directly, and two proportional-reasoning items ask what happens to acceleration when force or mass is doubled (opposite-direction proportionalities, deliberately paired). A dedicated step separates mass from weight using the Earth–Moon comparison, closing the loop opened in lesson 1's free-fall preview.
3. **Net Force, Friction, and Newton's Third Law** (`forces-and-motion-transfer`) is the near-transfer lesson: a fresh sled-and-friction scenario requires combining net-force reasoning with `a = F/m` across four connected steps (predict, compute net force, compute acceleration, then solve a two-step "what force is needed" problem), followed by a fresh elevator scenario. Two multiple-choice items (sled-and-child, then wall-push and rocket in practice) require explaining why Newton's third law's equal-and-opposite pair does not cause an object to cancel its own forces — because the two forces in the pair act on two different objects.

Numbers stay integer-clean throughout (with one simple decimal, 1.5, used only as a misconception trigger, never as a correct answer) so working memory stays available for the physical reasoning rather than arithmetic. Units (N, kg, m/s²) are always stated in the prompt.

## Lesson inventory

| Lesson ID | Core steps | Practice items | Primary depth |
| --- | ---: | ---: | --- |
| `forces-and-motion-net-force` | 5 | 5 | net force by direction; first law (balanced forces, rest and constant velocity); gravity independent of mass |
| `forces-and-motion-acceleration` | 6 | 6 | `a = F/m` solved for each variable; the `F = ma` expression; mass vs. weight; proportional reasoning (double F, double m) |
| `forces-and-motion-transfer` | 6 | 6 | net force with friction; two-step second-law application; Newton's third law pairs on different objects |

Core steps carry a two-item hint ladder (orienting question, then a conceptual or procedural nudge); no hint states the final answer. Practice items intentionally have no hint ladder, matching Museion practice-mode semantics (retrieval practice / the testing effect).

## Misconception map

| Lesson | Misconception | Diagnostic evidence | Response focus |
| --- | --- | --- | --- |
| Net force | motion requires a continuous force (Aristotelian) | predicts a frictionless puck slows down on its own | separate the cause of a *change* in velocity from the cause of velocity itself |
| Net force | motion spontaneously speeds up without a force | predicts a frictionless puck speeds up on its own | a change in speed requires a net force in that direction |
| Net force | forces just add regardless of direction | sums opposing forces instead of subtracting | assign signed directions before combining forces |
| Net force | reports only one of several forces | ignores one applied force when finding net force | combine every identified force, not just one |
| Net force | heavier objects fall faster | attributes greater free-fall acceleration to greater weight | larger gravitational force acts on proportionally larger mass; `a = F/m` is unchanged |
| Net force | lighter objects fall faster | attributes greater free-fall acceleration to lower mass alone | compare force and mass together, not mass in isolation |
| Net force | ignores an opposing force (e.g. a table's normal force) | treats weight as unopposed when another force is present | list every force touching the object before summing |
| Net force | balanced forces still cause motion | correctly finds zero net force but predicts movement anyway | zero net force means zero acceleration — no change in velocity, in either direction |
| Second law | force and acceleration are the same quantity | assumes an N value equals the same numeric m/s² value regardless of mass | `a = F/m`: divide by mass, don't assume force and acceleration are numerically equal |
| Second law | inverts or reverses the `F = ma` operation | divides instead of multiplies (or vice versa) when solving for a, F, or m | check the operation against the direction of the relationship, not just the symbols |
| Second law | confuses mass with weight | claims mass changes with location (e.g. on the Moon) | mass (kg) is constant; weight (N) = mass × local gravitational acceleration |
| Second law | treats weight as never changing | claims weight is fixed regardless of gravity | weight depends on local gravitational acceleration and changes when that does |
| Second law | mass and acceleration treated as directly proportional | predicts acceleration increases when mass increases at constant force | for constant force, more mass means less acceleration (`a = F/m`, inverse relationship) |
| Second law | force treated as unrelated to acceleration, or inversely so | predicts acceleration is unchanged, or halved, when force doubles | for constant mass, acceleration is directly proportional to force |
| Transfer | any opposing force is assumed balanced | predicts constant speed whenever *any* backward force exists | balance requires equal magnitude, not just opposing direction — compare the numbers |
| Transfer | friction is assumed to always dominate | predicts slowing down regardless of the applied force's size | compare the actual magnitudes to find the direction of the net force |
| Transfer | forgets that friction must also be overcome | computes only the net force needed and omits friction from the required applied force | the applied force must supply the net force *and* overcome friction |
| Transfer | Newton's third law pair applied to a single object | concludes the equal-and-opposite pair cancels and prevents any acceleration | identify which of the two different objects each force in the pair acts on |
| Transfer | invents a surface- or context-dependent exception to the third law | claims the pair only cancels under specific conditions | the third law holds universally; the resolution is which object each force acts on, not the surface |

## Private answer and rubric verification notes

- Nearly every numeric answer is an integer with tolerance `0`; the one exception (`1.5`) appears only as a misconception trigger for a proportional-reasoning item, never as a correct answer, and parses cleanly as a decimal.
- Multiple-choice options are plain text. Every `correctIndex` was checked against the authored solution text.
- One expression step (`forces-and-motion-acceleration`, "write the equation for F") accepts `f=ma`, `ma`, and `m*a`; its two misconception triggers (`f=m/a`, `f=m+a`) represent genuinely different, incorrect operations (inversion, addition) rather than a merely differently-ordered but mathematically equivalent form — the verifier matches by normalized string, not symbolic equivalence, so no accidentally-correct commutative variant (e.g. `f=am`) was used as a trigger.
- Several multiple-choice misconceptions are triggered by both the option's exact text and its numeric index string (matching the pattern used in the Search by Halving course), since the verifier accepts either form.
- Every misconception trigger was run through the real deterministic verifier (`validateLesson`, backed by `verify()`) in a temporary, non-persisted self-check before this document was written, and confirmed to never verify as correct.
- Private `solution` fields state the complete derivation, including, where relevant, the physical reasoning for why a force effect and a mass effect cancel (free fall) or combine (required pulling force against friction). They are evaluator truth and must not be copied into prompts or hints.
- Public lesson DTOs expose prompts, answer kind, and multiple-choice options only; solutions, hints, and misconceptions are server-only.

## Accessibility notes

- Prompts use short sentences and state units explicitly (N, kg, m/s²) rather than relying on unlabeled numbers.
- Scenarios avoid diagrams and vector arrows as a requirement — every item can be answered from the text description alone; "forward," "backward," "up," and "down" are always named in words.
- No color-only distinctions, timers, or drag interactions are used anywhere in the course.
- Hints begin by orienting attention to the relevant relationship (e.g. "which quantity in F = ma are you solving for?") before naming a procedure; they never state the final numeric or textual answer.
- Multiple-choice options are complete sentences rather than isolated symbols, so a learner using a screen reader hears a full, self-contained claim for each option.
- Contexts (sleds, tugboats, crates, elevators, rockets) were chosen to avoid culture-specific or regionally unfamiliar equipment.

## Final unassisted near-transfer item

This item belongs in course documentation for an instructor or evaluator to administer **without Maia, hints, worked examples, or shown solutions**. It is not included in learner-visible lesson copy and its answer is intentionally not recorded here.

> A cyclist and bicycle together have a mass of 60 kg. The cyclist pedals forward with a force of 200 N; rolling resistance and air drag act backward with a combined 140 N. (a) Find the net force on the cyclist. (b) Find the resulting acceleration. (c) The cyclist now wants to accelerate at 2 m/s² instead, with drag unchanged. What forward force must the cyclist supply? (d) As the cyclist pushes back on the ground through the pedals and tires, the ground pushes forward on the tires by Newton's third law. Explain why this reaction force does not also act on the cyclist in a way that cancels their forward acceleration.

Success evidence: a correctly signed net force with units, a correctly computed acceleration using `a = F/m`, a two-step force calculation that adds drag back in, and an explanation that names the ground and the cyclist as the two distinct objects in the third-law pair. This is a single near-transfer probe, not a test of retention or general mechanics fluency.

## Red-team cases

1. A learner enters a multiple-choice answer by index instead of by text: verifier behavior must remain consistent with the authored `correctIndex`.
2. A learner types the expression answer with different spacing or case (e.g. `F = M*A`): normalization must still accept it if it matches an accepted form.
3. A misconception trigger is numerically equal to the correct numeric answer: `validateLesson` must reject publication (checked directly for every trigger in this course).
4. A learner correctly writes the second-law expression in a valid but differently-ordered form not in `acceptedForms` (e.g. `f=am`): the verifier will mark this incorrect since it matches by string, not symbolic equivalence — this is a known conservative-verifier limitation, not a misconception, and no such form was authored as a misconception trigger.
5. A learner asserts that a heavier object experiences a larger force but reasons this must mean a larger acceleration, stopping short of dividing by the also-larger mass: tutoring should guide toward computing `a = F/m` explicitly rather than reasoning about force alone.
6. A learner confuses the direction of proportionality for mass (inverse) versus force (direct) in the second law: the two proportional-reasoning items in lesson 2 are deliberately paired (double mass vs. double force) so this distinction can be diagnosed directly.
7. A learner claims the sled's required pulling force equals just the net force, silently dropping friction: tutoring must request all forces acting on the object, not only the net result.
8. A learner claims a Newton's third law pair cancels for a single object: tutoring must ask which of the two different objects each paired force acts on, and should not accept "the forces are equal so nothing moves" as resolved reasoning.
9. A public DTO exposes `solution`, `misconceptions`, or `hints`: the existing privacy-boundary test coverage for `toPublicLesson` must catch this; this course introduces no new answer kinds and relies on that existing coverage.
10. A prompt or hint accidentally leaks a final numeric or expression answer: authoring review must catch this even though the automated validator does not check for it.

## Validation checklist

- [x] Three lesson IDs and all step IDs (core and practice) are distinct within this course.
- [x] Each lesson declares every concept used by its core and practice steps.
- [x] Core steps carry two hints, orienting to procedural, with no final answer stated.
- [x] Every step has an author-verified private `solution`.
- [x] Numeric answers use integer values with tolerance `0`, except one documented decimal misconception trigger.
- [x] The one expression step has a non-empty `acceptedForms` list and misconception triggers that are genuinely incorrect, not merely differently-ordered correct forms.
- [x] Multiple-choice `correctIndex` values were checked against authored solution text for all steps.
- [x] Every misconception trigger was run through the real verifier (`validateLesson`) in a temporary, non-persisted check and confirmed not to verify as correct.
- [x] The final unassisted near-transfer item is documented without an answer.
- [x] Learner-visible prompts require no diagram, color distinction, or timed interaction.
- [ ] Catalog/index integration (registering the lessons and course path) is intentionally left to the coordinating workstream.
- [ ] Product-level learning efficacy and retention require future learner evidence.

## Honest evidence boundary

Passing these lessons demonstrates correct responses on the authored items at the time of completion, including one immediate near-transfer observation (the friction-and-sled sequence in lesson 3, and the unassisted cyclist item above if an instructor administers it). It does not establish durable mastery of Newtonian mechanics, transfer to novel problem types beyond the documented near-transfer scenarios, retention over time, or improved performance in a physics course or on any external assessment. Source alignment means the physical content is consistent with standard introductory mechanics as presented in the cited OpenStax chapters; it does not imply OpenStax endorsement or equivalence to a certified physics curriculum.
