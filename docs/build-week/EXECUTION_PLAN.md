# Build Week Execution Plan

Nine future PR-sized goals are proposed. Local work remains uncommitted and is mapped in `UNCOMMITTED_CHANGE_MAP.md`.

## 1. Reproducible and honest baseline

**Priority/status:** P0, locally implemented and verified, submission required.
**Objective:** make the checked-out baseline reproducible and its claims precise before adding the compiler.
**Scope:** CI typecheck, deterministic Next root, status/decision/verification logs, Build Week provenance and claim corrections, session/API risk inventory.
**Non-goals:** product redesign, persistence, compiler code.
**Likely files:** `.github/workflows/ci.yml`, `next.config.ts`, `README.md`, `docs/**`.
**Compatibility:** all authored lessons and existing routes unchanged.
**Security/performance/a11y:** document ownership/input risks; no new runtime surface.
**Tests:** lint, typecheck, all offline tests, production build.
**Acceptance / done:** all four commands pass; CI has explicit typecheck; build has no incorrect workspace-root warning; measured claims only.
**Depends on:** none.

## 2. Provider-neutral, leak-gated GPT-5.6 Maia

**Priority/status:** P0, core locally implemented; live GPT-5.6 eval and richer adversarial suite pending, submission required.
**Objective:** make GPT-5.6 via Responses the primary judged tutor and ensure no unchecked model text reaches the learner.
**Scope:** `TutorProvider`; strict Zod `TutorTurn`; OpenAI provider using `gpt-5.6`/Responses; buffered response; schema, target, and answer-leak gates; one bounded repair; deterministic fallback; timeout/abort; requested/resolved model and usage telemetry; input size bounds; session ownership on tutor routes.
**Non-goals:** compiler stages, arbitrary UI actions, streaming partial prose, Anthropic parity.
**Likely files:** `src/lib/maia/**`, `src/app/api/sessions/**`, `src/lib/server/**`, `.env.example`, package files, tutor tests.
**API/UI:** tutor endpoint returns a validated JSON turn; Maia shows validation/fallback state without exposing internals.
**Edge/security:** refusals, malformed output, prompt injection, concurrent turns, invalid targets, encoded answers, missing key. Source/learner text remains inert data.
**Performance:** one call normally, one repair maximum, capped tokens and input, abort signal.
**Accessibility:** status and fallback messages announced.
**Acceptance / done:** missing key remains usable; unsafe first and repair outputs never deliver; live path names GPT-5.6; frozen adversarial suite has zero delivered leaks.
**Verify:** focused Vitest, lint, typecheck, build, live eval only with configured key.
**Depends on:** 1.

## 3. Browser source ingestion and canonical provenance

**Priority/status:** P0, locally implemented and verified, submission required.
**Objective:** convert pasted text, Markdown, and selectable-text PDF into deterministic pages and canonical spans.
**Scope:** limits, normalization version, UTF-16 offset policy, Web Crypto SHA-256, PDF extraction/preview, exact-unique span resolver, injection fixtures.
**Non-goals:** OCR, URLs, crawling, cloud file storage.
**Likely files:** `src/lib/source/**`, creator route/components, fixtures and tests.
**Models/API/UI:** `SourceDocumentV1`, `SourcePageV1`, `SourceSpanV1`; browser preview before compile.
**Edge/security:** empty/textless/corrupt/oversize/contradictory/instruction-like source; raw bytes never sent to the model.
**Performance:** 10 MB, 30-page, and normalized-character limits; hashing off the render-critical path.
**Accessibility:** labelled drop zone plus keyboard file picker and text alternative.
**Acceptance / done:** span slice and every hash round-trip; page boundaries survive PDF extraction; unsupported input fails recoverably.
**Depends on:** 1.

## 4. Canonical Source Graph and Course Artifact v2 contracts

**Priority/status:** P0, contract core locally implemented and verified; source-grounded golden artifact moves to Goal 5, submission required.
**Objective:** freeze the compiler IR and preserve v1 lessons through an explicit adapter.
**Scope:** strict Zod Source Graph, blueprint, private/public Course Artifact, answer specs, block registry contracts, validation issue model, canonical serialization/hash, v1 adapter.
**Non-goals:** model orchestration or rendering all block kinds.
**Likely files:** `src/lib/compiler/schemas/**`, `src/lib/content/adapters/**`, fixture tests.
**Compatibility:** existing lessons/practice continue unchanged; private truth is stripped from client artifacts.
**Security:** unknown keys/block kinds and unsupported citations fail closed; no code/unsafe URL fields.
**Acceptance / done:** golden artifacts parse; invalid IDs/citations/blocks fail; public serialization contains no answers; all v1 tests pass.
**Depends on:** 3.

## 5. Multi-stage binary-search compiler and replay artifact

**Priority/status:** P0, pending, submission required.
**Objective:** compile the golden source without manual JSON editing and save a deterministic judge replay.
**Scope:** Source Graph candidate, deterministic span resolution, blueprint, misconception/interaction plan, content/answers, transfer candidate, validators, critic, one typed repair, stage telemetry and checked-in golden artifact.
**Non-goals:** arbitrary-domain reliability or database-backed runs.
**Likely files:** `src/lib/compiler/**`, API route, binary-search fixtures/artifact, eval tests.
**Edge/security:** refusal, timeout, invalid citations, prompt injection, repeat compile, partial stage failure; last valid stage is not corrupted.
**Performance:** bounded source/context/output; stable prompts; stage-level cancellation and hashes.
**Acceptance / done:** golden compilation validates repeatedly; failed artifacts never publish; replay loads with no API key and is visibly labelled.
**Depends on:** 2–4.

## 6. Typed deterministic interactive runtime

**Priority/status:** P0, pending, submission required.
**Objective:** execute PredictionChoice, RangeExplorer, StateTrace, and SequenceBuilder through registered pure reducers.
**Scope:** schemas, reducers, reachability/termination validators, answer evaluators, keyboard/text equivalents, public/private state.
**Non-goals:** model-generated React or additional block families.
**Likely files:** `src/lib/runtime/**`, `src/components/blocks/**`, tests.
**Security:** unknown block/action rejected; model cannot mutate correctness or score.
**Performance:** bounded states and transitions; offline-first rendering.
**Accessibility:** keyboard operation, visible focus, instructions, status announcements, reduced motion.
**Acceptance / done:** golden course runs offline; intentional `high = mid` error is detected deterministically; traces replay to identical hashes.
**Depends on:** 4–5.

## 7. Maia environment observation and bounded actions

**Priority/status:** P1, pending, submission required.
**Objective:** let Maia respond to the exact interactive state without owning state transitions.
**Scope:** versioned snapshot, last action, deterministic misconception, allowed target list, highlight/focus/pulse/annotation actions, target/action validation and local counterexample.
**Non-goals:** arbitrary DOM selectors, score changes, answer filling, navigation.
**Likely files:** runtime snapshot/action modules, tutor schema/prompt, block components/tests.
**Security/a11y:** targets are server/runtime issued IDs; invalid actions dropped; visual actions have textual and screen-reader equivalents.
**Acceptance / done:** off-by-one error yields a specific safe intervention; invalid action cannot alter truth; replay remains API-free.
**Depends on:** 2 and 6.

## 8. Locked transfer and evidence ledger

**Priority/status:** P0, pending, submission required.
**Objective:** record one honest unassisted near-transfer observation instead of a mastery percentage.
**Scope:** transfer lockout, unseen case, deterministic score, immutable versioned events/evidence, assistance counters, evidence summary statements and citations.
**Non-goals:** durable psychometrics, delayed scheduler, far-transfer proof.
**Likely files:** `src/lib/evidence/**`, session/runtime routes, completion UI/tests.
**Security:** no Maia, hints, solution, elimination, or privileged source lookup; attempts are idempotent and version-bound.
**Accessibility:** evidence is textual, not color-only; transfer controls meet runtime standards.
**Acceptance / done:** assistance is technically unavailable; replay reconciles every statement to an event; UI says exactly what was observed.
**Depends on:** 4–7.

## 9. Creator review, judge path, E2E, deployment, and submission docs

**Priority/status:** P0, pending, submission required.
**Objective:** make the complete slice understandable and reproducible in under three minutes.
**Scope:** source/sample input, compile progress, concepts/citations/issues review, launch, live/replay badge, reset, no-login sample, Playwright desktop/mobile path, error states, README/evals/Codex usage/build log, deployment verification.
**Non-goals:** auth, dashboards, broad catalog redesign.
**Likely files:** creator/review/judge routes, components, E2E config/tests, README and docs.
**Edge/security:** clean browser, missing key/artifact, refresh, direct routes, slow/error provider, repeated actions, console/network cleanliness.
**Performance:** sample replay loads quickly; compile progress is truthful; no source or secret in logs.
**Accessibility:** keyboard-only and reduced-motion judge path at mobile and desktop widths.
**Acceptance / done:** clean-browser judge flow passes 20/20; replay works keyless; deployed flow matches video; README reproduces setup/test/demo; all claims are measured.
**Depends on:** 1–8.
