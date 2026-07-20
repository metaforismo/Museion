# The Museion Method

**High standards. Patient guidance. Independent evidence.**

Museion treats learning as an observable cycle rather than a content-completion score.

| Move | Product meaning | Status |
|---|---|---|
| Ground | Attach factual claims to an authorized source or an authored curriculum concept. | Implemented for compiled courses; authored lessons are internally reviewed but not externally cited. |
| Predict | Require a learner commitment before the full explanation. | Implemented in authored and generated activities. |
| Interact | Manipulate, order, trace, compare, or test a representation. | Partially implemented through four typed generated-runtime blocks, plus a manipulable graph transformation lab in the authored core (learners adjust vertex-form parameters against a target curve; verification and misconception matching are deterministic). |
| Diagnose | Match checked responses to registered misconceptions. | Implemented for authored lessons and selected generated-runtime rules. |
| Explain | Ask the learner to state why corrected reasoning works. | Partially implemented through Maia and self-explanation prompts. |
| Transfer | Attempt a nearby case without Maia, hints, or solution access. | Implemented once per generated replay as an immediate near-transfer observation. |
| Revisit | Return after time using evidence-ranked review. | Partially implemented; delayed retention scheduling is planned and not evaluated. |

The deterministic engine owns correctness, state transitions, leak blocking, and evidence labels. Models propose source graphs, pedagogy, and bounded coaching. A completed cycle does not prove mastery, retention, far transfer, or general learning gain.

## Where the vocabulary is visible

The seven moves are no longer only an internal framing; the same names now appear in-product: the landing page's method section describes each move (including telling learners plainly that Revisit is on the roadmap, not shipped), the dashboard's method strip highlights whichever move the learner's actual recommended next action exercises, and the lesson player shows a phase chip (Predict, Diagnose, Explain, or Revisit) alongside the relevant step. None of this changes the implementation status in the table above — Revisit in particular still has no spaced-review scheduler; only misconception-triggered review exists at runtime.
