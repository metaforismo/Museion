# Museion Build Week Master Checklist

This is the execution ledger for the complete binary-search judge slice. A checked item means code and proportionate verification exist locally; it does not imply deployment, a live model run, a commit, or submission.

## A. Baseline and safety boundary

- [x] Reconcile planning documents with the live repository.
- [x] Record baseline commit, branch state, package integrity, and unsupported claims.
- [x] Add explicit CI typecheck and deterministic Turbopack root.
- [x] Enforce anonymous learner ownership on session routes.
- [x] Keep the solved step authoritative until an explicit advance command.
- [x] Guard session mutations with expected step/version and idempotency keys.
- [x] Reject stale asynchronous Maia turns and surface recoverable request errors.
- [x] Remove deterministic hints from practice artifacts server-side.
- [x] Add provider-neutral Maia contracts and GPT-5.6 Responses integration.
- [x] Buffer structured tutor turns before delivery.
- [x] Validate schema, UI targets, and answer leakage before delivery.
- [x] Bound repair to one attempt and fall back deterministically.
- [x] Cover missing-key operation without a live model call.
- [ ] Run and record the live GPT-5.6 red-team suite with explicit user-provided environment credentials.

## B. Source ingestion and provenance

- [x] Ingest pasted plain text and Markdown in the browser.
- [x] Extract selectable text from PDF with a locally bundled worker.
- [x] Enforce 10 MB, 30-page, and 140,000-character limits.
- [x] Normalize Unicode, newlines, control characters, pages, and trailing whitespace deterministically.
- [x] Calculate document, page, and span SHA-256 through Web Crypto.
- [x] Declare UTF-16 offsets and exact-unique quote resolution.
- [x] Preserve instruction-like source prose as inert data and flag it for review.
- [x] Preview normalized pages and hashes before compilation.
- [x] Verify the real six-page golden PDF in Node and Chrome.
- [x] Check in the resolved golden binary-search Source Graph with exact spans.
- [x] Validate every graph citation against the normalized PDF fixture.
- [x] Reject forged, ambiguous, missing, and hash-mismatched graph evidence.

## C. Canonical compiler contracts

- [x] Freeze strict Source Graph schema and semantic validation.
- [x] Freeze strict Course Blueprint schema.
- [x] Freeze private Course Artifact v2 schema.
- [x] Freeze public Course Artifact v2 schema.
- [x] Close the block registry to seven allow-listed data-only kinds.
- [x] Strip answer specs, solutions, hints, misconception internals, expected traces, and evaluator rules from public serialization.
- [x] Add canonical recursive key sorting and artifact hashing.
- [x] Add deterministic non-mutating Lesson v1 compatibility adapter.
- [x] Verify all five authored lessons through the adapter.
- [x] Add checked-in golden Blueprint and Course Artifact v2.
- [x] Validate golden artifact references, citations, private/public separation, and stable hashes.

## D. Multi-stage compiler

- [x] Define versioned stage input/output envelopes and issue model.
- [x] Implement Source Graph, Blueprint, Course Artifact, critic, and bounded repair stages; interaction and transfer are typed inside Artifact v2.
- [x] Add provider-neutral compiler interface and deterministic replay provider.
- [x] Add GPT-5.6 Responses provider with strict structured outputs per stage.
- [x] Treat normalized source and prior-stage artifacts as untrusted JSON data.
- [x] Enforce stage input/output size, timeout, cancellation, and token bounds.
- [x] Record requested/resolved model, prompt/schema versions, usage, duration, input hash, and output hash.
- [x] Permit exactly one typed patch repair after critic/validation failure.
- [x] Re-run the entire validator stack after repair.
- [x] Treat blocking Source Graph warnings as compiler-stopping issues.
- [x] Bind artifact source id, document hash, and Source Graph hash deterministically.
- [x] Require citations and transfer coverage for source-grounded artifacts.
- [x] Make artifact validation and provenance server-owned rather than provider-authored.
- [x] Run interactive runtime validators before critic acceptance and after repair.
- [x] Never publish a partially valid artifact.
- [x] Return stage telemetry and a sanitized fail-closed error instead of a partial artifact.
- [x] Make deterministic golden replay visibly distinct from live compilation.

## E. Deterministic interactive runtime

- [x] Define versioned runtime snapshot, action, transition, and replay-event contracts.
- [x] Implement PredictionChoice pure reducer/evaluator.
- [x] Implement RangeExplorer pure reducer/evaluator.
- [x] Implement StateTrace pure reducer/evaluator.
- [x] Implement SequenceBuilder pure reducer/evaluator.
- [x] Reject unknown blocks and unknown actions.
- [x] Validate state closure, reachability, bounded termination, and terminal correctness.
- [x] Detect `high = mid` and `low = mid` non-progress errors deterministically.
- [x] Replay identical events to identical state hashes.
- [x] Keep answer specs and expected states server-side.
- [x] Provide native keyboard controls, text labels, focus affordances, live status, and reduced-motion CSS.

## F. Maia environment actions

The contracts below are implemented internally. Visible Judge integration remains explicitly open.

- [x] Expose only the versioned public runtime snapshot to Maia.
- [x] Include last learner action and deterministic misconception identifier.
- [x] Issue allowed target IDs from the runtime, never accept arbitrary selectors.
- [x] Allow only highlight, focus, pulse, and bounded annotation actions.
- [x] Validate and drop unknown targets/actions before rendering.
- [x] Prevent Maia from answering, mutating state, changing score, or navigating.
- [x] Pair every visual action contract with a textual or accessible target.
- [x] Add a deterministic local counterexample for the binary-search off-by-one path.
- [x] Build a runtime tutor snapshot after an incorrect Judge outcome.
- [x] Render a schema-validated deterministic tutor turn and allow-listed actions in the Judge.
- [x] Apply semantic highlight/annotation treatment and the bounded off-by-one counterexample.
- [ ] Connect the live provider to this runtime-specific snapshot without weakening the deterministic fallback.

## G. Locked transfer and evidence

- [x] Define immutable versioned event and evidence-observation contracts.
- [x] Add an unseen near-transfer binary-search case.
- [x] Disable Maia, hints, solution, elimination, and privileged source lookup technically.
- [x] Make attempts idempotent and artifact-version-bound.
- [x] Score transfer deterministically.
- [x] Record assistance counters and runtime provenance.
- [x] Reconcile every evidence statement to event IDs.
- [x] Show exactly what was observed, confidence limits, and citations.
- [x] Avoid mastery, durable-learning, far-transfer, and efficacy claims.

## H. Creator and judge experience

- [x] Enable verified replay only after an exact normalized-source hash match.
- [x] Show truthful stage progress and validator state.
- [x] Provide concepts, claims, spans, citations, blocks, validators, and issue review.
- [x] Block launch while any blocking issue exists.
- [x] Support the checked-in keyless golden replay without login.
- [x] Label replay mode prominently; never imply it is a live compile.
- [x] Add reset that clears judge state without destroying source fixtures.
- [x] Render the complete binary-search course from Course Artifact v2.
- [x] Complete interaction, locked transfer, and evidence ledger in one route.
- [x] Preserve useful state across refresh through an owner-bound session.
- [x] Provide missing-key fallback, fail-closed corrupt output/timeout tests, and direct-route recovery.
- [ ] Compile a non-golden normalized source from the Creator into a validated reviewable artifact.
- [x] Add audience-bound owner-scoped compiler run creation and lookup APIs.
- [x] Add a sanitized dynamic run review that excludes private answer truth.
- [x] Fail closed with an explicit provider-not-configured state for arbitrary keyless sources.
- [x] Launch a compatible accepted dynamic artifact into an owner-bound generated learner route.

## I. State and deployment hardening

- [x] Bound lesson, Judge, and compiler-run retention with owner quotas.
- [x] Expire abandoned process-local state with explicit TTL cleanup.
- [x] Add baseline CSP, frame, MIME, referrer, and browser-permission headers.
- [ ] Replace process-local maps with a durable multi-instance storage adapter.
- [ ] Verify resume, ownership, idempotency, and cleanup across a cold start.

## J. Verification and release evidence

- [x] Maintain offline Vitest coverage for existing engine and source boundaries.
- [x] Maintain a repeatable Chrome desktop/mobile smoke.
- [x] Add golden compiler/replay fixture tests.
- [x] Add runtime reducer, reachability, termination, and replay tests.
- [x] Add transfer-lock and evidence reconciliation tests.
- [x] Add prompt-injection, malformed-output, invalid-action, and leak fixtures.
- [x] Add full Playwright judge path at desktop and 320 px.
- [x] Verify native keyboard semantics, labeled controls, focus styles, live status, and reduced-motion handling.
- [x] Verify clean console, page errors, 5xx responses, refresh, and direct routes.
- [x] Run the clean-browser judge path 20/20 times.
- [x] Record `.next/static` size (2.8 MB) and visually inspect desktop/mobile final states.
- [x] Run lint, typecheck, all offline tests, production build, audit, and `git diff --check`.
- [ ] Record live GPT-5.6 latency, usage, cost, repair, refusal, and delivered-leak results only if credentials are explicitly available.

## J. Deployment and submission readiness

- [x] Finalize README setup, architecture, replay, eval, and claim boundaries.
- [x] Finalize build log, Codex usage, eval report, decision log, and exact change map.
- [x] Prepare demo script and shot list around the verified judge path.
- [x] Prepare Devpost copy with measured claims only.
- [ ] Verify deployment environment and hosted judge path after explicit authorization.
- [x] Stop before commit, push, PR, access-control changes, Devpost submit, or other irreversible external action unless explicitly authorized.
