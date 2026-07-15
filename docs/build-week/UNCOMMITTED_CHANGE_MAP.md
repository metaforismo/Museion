# Uncommitted Change Map

This file maps local changes to the proposed future PRs. Nothing in this workspace is staged or committed.

## PR 1 — Reproducible and honest baseline

- `.github/workflows/ci.yml` — explicit typecheck gate.
- `next.config.ts` — repository-local Turbopack root.
- `docs/build-week/CURRENT_PROJECT_STATUS.md` — evidence-backed audit.
- `docs/build-week/DOCUMENT_REPOSITORY_COMPARISON.md` — planned/current gap table.
- `docs/build-week/EXECUTION_PLAN.md` — revised nine-goal roadmap.
- `docs/build-week/VERIFICATION_LOG.md` — exact baseline command results.
- `docs/build-week/DECISION_LOG.md` — architectural and claim decisions.
- `docs/build-week/UNCOMMITTED_CHANGE_MAP.md` — separation map.
- `docs/BUILD_LOG.md` — dated work summary.
- `docs/CODEX_USAGE.md` — session activity without private reasoning.
- `docs/EVALS.md` — eval boundary and current measured results.
- `package.json`, `package-lock.json`, `.gitignore`, `scripts/verify-ui.mjs` — repeatable local Chrome smoke and dependencies.
- `src/components/LessonPlayer.tsx` — 320 px overflow fix and accessible answer name/input mode found by the smoke.

## PR 2 — Provider-neutral, leak-gated GPT-5.6 Maia

- `src/lib/maia/contracts.ts` — strict tutor/provider/delivery contracts.
- `src/lib/maia/openai-provider.ts` — GPT-5.6 Responses + Zod Structured Output provider.
- `src/lib/maia/prompt.ts` — untrusted JSON state boundary and repair instructions.
- `src/lib/maia/tutor.ts` — buffer, schema/target/leak gate, one repair, fallback, telemetry.
- `src/lib/server/session-access.ts`, `src/lib/store.ts`, session routes — anonymous learner ownership enforcement.
- `src/lib/api-types.ts`, `src/components/MaiaPanel.tsx` — validated JSON delivery rather than raw token streaming.
- `.env.example` — OpenAI server configuration.
- `src/lib/engine/practice.ts` — server-enforced empty practice hint ladders.
- `tests/tutor.test.ts`, `tests/session-access.test.ts`, and updated prompt/practice/live-redteam tests — safety and compatibility coverage.
- `README.md`, `TODO.md`, `docs/BUILD_WEEK_DELTA.md` — truthful provider and verification status.

## PR 3 — Browser source ingestion and canonical provenance

- `src/lib/source/contracts.ts`, `limits.ts`, `hash.ts`, `normalize.ts` — versioned document/page/span records, normalization, stable Web Crypto hashes, and hard limits.
- `src/lib/source/pdf.ts`, `ingest.ts`, `index.ts` — selectable-text PDF/TXT/Markdown ingestion with a bundled local PDF worker.
- `src/lib/source/spans.ts` — exact-unique UTF-16 quote resolution and hash/slice validation.
- `src/app/create/page.tsx`, `src/components/SourceCreator.tsx`, `src/app/layout.tsx` — source input, normalized preview, page navigation, warnings, and responsive navigation; future graph compilation remains disabled.
- `tests/source.test.ts`, `tests/fixtures/**` — real six-page PDF, malicious source fixture, normalization, limits, hash, page, and span regression coverage.
- `package.json`, `package-lock.json`, `scripts/verify-ui.mjs` — PDF parser dependency and desktop/mobile browser verification of paste and PDF flows.
- `src/components/LessonPlayer.tsx` — idempotent in-flight session creation after the expanded smoke exposed a React development-effect ownership race.
- `README.md`, `TODO.md`, `docs/**` — measured Goal 3 status and boundaries.

## Keep separate

- Do not mix UI polish, persistence, or unrelated refactors into PR 1.

## PR 4 — Canonical compiler contracts

- `src/lib/compiler/schemas/source-graph.ts` — strict cited graph and document/span/concept reference validation.
- `src/lib/compiler/schemas/blueprint.ts` — strict audience, objective, sequence, and evidence-target blueprint.
- `src/lib/compiler/canonical.ts`, `index.ts` — recursively key-sorted canonical JSON and Web Crypto SHA-256.
- `src/lib/compiler/schemas/course-artifact.ts` — private Course Artifact v2, answer specs, closed seven-kind block registry, and semantic reference checks.
- `src/lib/compiler/public-artifact.ts` — allow-listed public artifact transformation that strips restricted truth fields.
- `src/lib/compiler/legacy-adapter.ts` — deterministic, non-mutating authored Lesson v1 compatibility wrapper explicitly labelled `legacy_v1` and `needs-review`.
- `tests/compiler-contracts.test.ts`, `tests/course-artifact.test.ts` — stable serialization, valid/forged citations, all five legacy lessons, private/public leakage, and unknown-block rejection.

## PR 5 — Golden source and bounded compiler

- `scripts/generate-golden-source.mjs`, `scripts/generate-golden-course.mjs`, `tests/fixtures/binary-search-*` — reproducible checked source, graph, blueprint, artifact, and manifest.
- `src/lib/compiler/orchestrator.ts`, `contracts.ts`, `providers/**` — bounded stage runner, replay and GPT-5.6 providers, telemetry, critic, and one typed repair.
- `tests/compiler-orchestrator.test.ts`, `tests/compiler-openai-provider.test.ts` — replay, forged evidence, timeout, repair bound, and local strict-format checks.

## PR 6 — Runtime and Maia environment boundary

- `src/lib/runtime/**`, `src/components/blocks/InteractiveBlock.tsx` — versioned actions/states, four pure reducers, validators, replay hashes, accessible renderer, and tutor snapshots.
- `tests/runtime.test.ts`, `tests/runtime-tutor.test.ts` — transitions, non-progress detection, state closure, replay, target issuance, and action gating.

## PR 7 — Locked transfer and evidence

- `src/lib/evidence/**` — artifact-bound one-attempt transfer, hashed answers, immutable events, assistance invariants, observations, and reconciliation.
- `tests/evidence.test.ts` — correct/duplicate/second-attempt/forged-event coverage.

## PR 8 — Creator review and judge experience

- `src/app/create/review/**`, `src/app/judge/**`, `src/app/api/judge/**`, `src/components/JudgeExperience.tsx`, `src/lib/judge/**` — inspectable compilation, owner-bound replay, lesson, transfer, evidence, refresh, and reset.
- `tests/judge-store.test.ts`, `scripts/verify-ui.mjs` — ownership, no-private-truth payload, transfer gate, and 20/20 browser path.
- `README.md`, `TODO.md`, `docs/**` — final measured state and authorization boundary.
