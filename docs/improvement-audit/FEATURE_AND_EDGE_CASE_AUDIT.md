# Feature and edge-case audit

Audit date: 2026-07-17. Findings are source-backed and prioritized; speculative roadmap items are separated from confirmed gaps.

## P0

### Generated courses could compile successfully but never reach transfer

- **Evidence:** the artifact schema permits 1–12 lessons and `guided-response`, while `JudgeExperience` reads only `lessons[0]` and cannot render `guided-response` inside that sequence. A transfer block placed in `lesson.blockIds` also becomes an unrenderable current block.
- **Risk:** publication can succeed even though the learner can never complete the server-side all-block gate.
- **Implemented:** source-graph validation now requires exactly one lesson, blocks `guided-response` and `transfer-challenge` from the guided sequence, and the model instruction places transfer only in `transferBlockIds`. Legacy authored lessons are intentionally unaffected.
- **Acceptance:** invalid structures trigger typed repair and remain unpublished if the repaired artifact is still unrenderable.

### Transfer UI handled only integer answers

- **Evidence:** the schema and deterministic evaluator support numeric, multiple-choice, and expression responses; the UI required a whole-number “Final index.”
- **Risk:** valid generated courses with decimal, choice, or expression transfer could not be completed.
- **Implemented:** response-kind-specific numeric, radio, and expression controls with bounded validation and one-attempt semantics.

### Live runtime-specific Maia is incomplete for generated activities

- **Evidence:** `JudgeExperience` consumes deterministic `RuntimeTutorIntervention`; the authored `MaiaPanel` has a live provider, but the generated runtime does not send the full runtime snapshot through the live GPT-5.6 tutor contract.
- **Risk:** The demo proves deterministic intervention but not the full claimed live, runtime-aware Maia loop.
- **Acceptance:** A wrong runtime action produces a version-bound provider request, validated targets/actions, leak checks across combined UI text, safe fallback, cancellation, and stale-action rejection.

### Non-golden full-pipeline browser evidence is not stable in CI

- **Evidence:** CI mocks provider execution and the golden source drives the browser launch path.
- **Risk:** A valid arbitrary source can still expose provider/schema/runtime incompatibility only in a live manual run.
- **Acceptance:** Add a stable mocked non-golden fixture that normalizes, compiles, validates, reviews, launches, completes, and records transfer without an account.

### Deployment state remains configuration-dependent

- **Evidence:** Durable-state abstraction exists, while local runtime state and in-memory job coordination remain process-local.
- **Risk:** Cold starts or multiple instances can interrupt active compiler jobs and some anonymous session flows.
- **Acceptance:** Explicit fail-closed partial configuration, cross-instance state tests, interrupted-job recovery, TTL/quota cleanup, and deployment documentation.

## P1 confirmed

### Practice is described as unassisted while Maia remains available

- **Reproduction:** Open `/lessons/linear-equations-intro/practice`.
- **Current:** Badge and completion copy say `Unassisted practice`; Maia is visible.
- **Fix:** Use `Hint-free practice`; reserve `independent` for transfer without Maia/hints/solutions.

### Mobile lesson title collides with step count

- **Reproduction:** 390 x 844 on `/lessons/linear-equations-intro`.
- **Current:** `Solving Linear Equations` and `Step 1 of 4` share an unconstrained baseline row.
- **Fix:** Grid header with a non-overlapping status row and overflow regression assertion.

### Maia is visually mandatory on mobile

- **Reproduction:** Open any authored lesson at 390 x 844.
- **Current:** A 36rem tutor panel follows the task before the footer.
- **Fix:** Collapsed coach trigger on mobile; open automatically only after an explicit Maia action or learner request; keep desktop rail.

### Homepage leads with implementation proof

- **Reproduction:** `/` after onboarding.
- **Current:** `Judge`, `artifact v2.0`, test counts, dependency counts, `keyless replay`, and truth-boundary internals precede the catalog.
- **Fix:** Learner goal and next action first; technical proof moves to disclosure/About.

### Generated learner copy exposes internal vocabulary

- **Evidence:** `JudgeExperience` uses `Judge route`, `Verified replay`, `deterministic runtime`, raw span IDs, and `bounded intervention`.
- **Fix:** Learner copy uses `Interactive demo`, `Course check`, `Source`, and `Maia`; preserve exact terms only in technical details.

## P1 reliability backlog

- Judge actions remain read-modify-write operations without a version/idempotency envelope; concurrent action or transfer requests need an atomic backend contract.
- Cancelling authored Maia currently aborts the browser request, but the server/provider cancellation path still needs proof that it cannot consume a hint or persist a fallback mutation after abort.
- A backend outage can be collapsed into a not-found response; clients should not erase recovery keys until absence is authoritative.

- Add timeout and schema validation to `JudgeExperience.jsonRequest`; it currently uses an unbounded fetch and an unsafe generic cast.
- Centralize version/idempotency request envelopes across lesson, judge, and transfer actions.
- Test answer timeout after server acceptance and same-idempotency retry for authored lessons.
- Test compiler cancellation racing with completion and restored active job after expiry.
- Test old creator-draft schema, storage quota failure, and private-mode storage errors in the browser.
- [Implemented] Block unsupported generated lesson structures at publication validation, not only at the launch API.
- Test transfer submit timeout after acceptance and replay of the same attempt ID.

## P2 learning features

- Confidence calibration only on misconception-sensitive tasks.
- Evidence-based mistake notebook with original action, corrected rule, counterexample, and later independent result.
- Compact source/guidebook drawer without solutions.
- Practice queue based on recent misconception, hint depth, missing independent evidence, and recency.
- Worked-example fading expressed through existing typed blocks before adding new block kinds.

## Security and privacy checks retained

- Owner binding, private/public artifact separation, leak gates, idempotency, transfer lockout, and fail-closed publication must remain unchanged.
- Add explicit combined-text leak tests for future Maia annotations/actions.
- Continue verifying no source text, learner messages, credentials, or private answer specifications enter logs or browser payloads.
