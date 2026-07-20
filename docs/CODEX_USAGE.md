# Codex Usage

## Session scope

Codex was used as the primary engineering agent on 2026-07-15 to organize planning material, obtain and inspect the repository, run the baseline, synthesize the plan, implement local changes, and verify results. Focused read-only subagents audited non-overlapping planning and repository areas; the primary agent verified important claims and made final decisions.

## Inspected

- Build Week product, architecture, learning science, eval, safety, execution, positioning, validation, and example-schema documents.
- Git history and baseline/delta commits.
- Next.js routes, content types and validators, verifier, mastery/session engine, stores, Maia prompt/provider/leak detector, learner UI, tests, CI, environment and documentation.
- Current official OpenAI Codex authentication, subscription and GPT-5.6 family guidance.

## Designed

- A nine-goal implementation order that freezes contracts before compiler/runtime consumers.
- A buffered pre-delivery tutor safety boundary.
- A narrow, honest evidence claim and a deterministic replay requirement.

## Implemented in this local session

- Planning/status/comparison/execution/verification/decision/change-map documentation.
- Explicit CI typecheck and deterministic Turbopack root.
- Provider-neutral strict tutor contracts and GPT-5.6 Responses provider.
- Buffered pre-delivery schema, UI-target, and answer-leak gate with one repair and deterministic fallback.
- Anonymous session ownership enforcement and server-side practice hint removal.
- Repeatable Chrome UI smoke and the mobile overflow/accessibility fix it exposed.
- Canonical browser source ingestion, provenance contracts, exact span validation, real PDF fixtures, and the `/create` inspection UI.
- Regression fixes for concurrent session creation, local PDF worker packaging, and narrow navigation found by the expanded browser run.
- Compiler contracts for Source Graph, Course Blueprint, private/public Course Artifact v2, canonical hashes, and legacy lesson compatibility.
- Deterministic golden Source Document, Source Graph, Blueprint, Artifact v2, and replay manifest generated from the real six-page PDF.
- Provider-neutral multi-stage compiler orchestration, keyless replay, and strict GPT-5.6 Structured Outputs provider.
- Pure interactive reducers, runtime validation/replay, bounded Maia environment targets, locked transfer, and evidence reconciliation.
- Creator review and no-login `/judge` experience with owner-bound refresh/resume and reset.
- Offline font stacks and a patched transitive PostCSS override for reproducible builds and a zero-advisory audit.
- A targeted redesign of the existing Tailwind/Next.js interface: active navigation, accessibility skip path, asymmetric homepage, product-route polish, legal routes, social preview, and responsive verification.
- Server-only Codex discovery, structured execution, device login, cancellation, sanitized status, local-only request guards and Settings UX.
- Balanced Luna/Terra/Sol routing, three pedagogical templates, asynchronous compiler jobs, refresh recovery, visible model stages and Codex-powered Maia.
- Strict-output compatibility adapters that expose arrays to models and reconstruct private keyed records deterministically.
- See `docs/build-week/UNCOMMITTED_CHANGE_MAP.md` only as a historical pre-publication file map; current state is recorded in Git history and `CURRENT_PROJECT_STATUS.md`.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 147 passed; 17 live cases skip without explicit environment opt-in.
- `npm run build`: passed fully offline without the prior workspace-root or font-fetch dependency.
- `npm run verify:ui`: legacy smoke plus complete judge flow passed 20× at 1440×1000 and once at 320×700.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities after the scoped PostCSS override.

## Limitations

- No API key was requested or used. Live checks used the official authenticated Codex runtime and ChatGPT plan quota.
- Luna, Terra and Sol conformance passed; one non-golden full compilation passed in 76.9 seconds; eight Terra Maia red-team cases delivered zero leaks.
- No deployed route or learning-outcome result has been verified; external deployment and submission remain behind explicit authorization.
- This document records actions and decisions, not private chain-of-thought.

The `/feedback` Session ID is not recorded in this document. It is captured at submission time via the required-fields checklist in [`docs/build-week/DEVPOST_DRAFT.md`](build-week/DEVPOST_DRAFT.md), which lists it alongside Submitter Type, Country, Category, and repository URL.
