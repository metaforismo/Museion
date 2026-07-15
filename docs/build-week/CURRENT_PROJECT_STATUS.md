# Current Project Status

Verified locally on 2026-07-15. This file is the authoritative implementation-status matrix; older delta and change-map documents are historical records.

## Status vocabulary

- **Visible:** connected to a user route and covered by browser verification.
- **Internal:** implemented and unit-tested, but not connected to the visible product path.
- **Golden replay:** works for the checked binary-search source/artifact only.
- **Live:** invokes the configured external provider; requires credentials and a dated live verification.
- **Missing:** not implemented.
- **Post-hackathon:** intentionally outside the current release slice.

## Product matrix

| Capability | Status | Honest boundary |
| --- | --- | --- |
| Text, Markdown, selectable-PDF normalization | Visible | Browser-local; no OCR or URL ingestion. |
| Page/document hashes and exact source spans | Visible | Exact-unique quotes; repeated ambiguous quotes are rejected. |
| Source Graph, Blueprint, Artifact v2 schemas | Internal + golden replay | Arbitrary creator input is not yet compiled from the UI. |
| Multi-stage compiler, critic, one typed repair | Internal + golden replay | Live OpenAI provider exists; no dated live compile result. |
| Compiler truth hardening | Internal + golden replay | Blocking warnings, source/hash binding, citation/transfer gates, server-owned validation/provenance, runtime validators, terminal traces. |
| Typed interactive reducers | Visible in golden replay | Prediction, range, trace, and sequence only; guided response is not rendered by Judge. |
| Maia lesson tutor | Visible in authored lessons | GPT-5.6 live when configured; deterministic fallback otherwise. |
| Session protocol v2 | Visible in authored lessons | Correct answers remain on the solved step until explicit advance; answer, hint, advance, and Maia commands are version/step guarded and idempotent. State is still process-local. |
| Runtime Maia snapshot and bounded actions | Visible in golden replay | Incorrect outcomes produce a public snapshot, schema-validated deterministic turn, allow-listed semantic emphasis, and bounded off-by-one counterexample. Live provider wiring remains open. |
| Locked unassisted transfer | Visible in golden replay | One immediate near-transfer observation, not durable mastery. |
| Evidence ledger | Visible in golden replay | Transfer event only; guided corrections and confidence are not yet included. |
| Creator compile runs, review, and learner launch | Visible API + golden replay | Audience-bound owner-scoped run API, sanitized dynamic review, and compatible generated learner route are implemented. Non-golden live compilation requires provider credentials and has not been live-verified. |
| Persistence | Partial hardening | Process-local stores now have owner quotas and TTL cleanup, but remain unsuitable for multi-instance deployment or cold starts. |
| Hosted deployment | Missing | Requires explicit authorization and deployment configuration. |
| Live GPT-5.6 eval | Missing verification | Eight live tests remain skipped without credentials. |
| Delayed retention/adaptive practice | Post-hackathon | No longitudinal learning claim is made. |

## Verified local gates

- Strict TypeScript, ESLint, production build, bundle budgets, and production dependency audit.
- 137 offline tests; 8 live tests skipped without credentials.
- axe WCAG route scans, keyboard-only Judge, route transfer/CLS budgets, desktop Judge 20/20, and 320 px mobile flow.
- Golden Source Document, Source Graph, Blueprint, Artifact, and replay manifest regenerate without drift.

## P0 work remaining

1. Finish the live creator path: generated learner route plus a dated non-golden provider run.
2. Deployment-safe state: replace bounded process-local stores with a durable adapter and verify cold starts. TTLs, owner quotas, and baseline security headers are implemented.
3. Connect the live provider to the visible runtime Maia snapshot and run the authorized live eval.
4. Authorized hosted smoke.

## Submission claim boundary

Museion currently demonstrates a credible, source-grounded binary-search golden replay. It does not yet demonstrate that an arbitrary uploaded source becomes a course, that Maia acts inside the Judge runtime, that sessions survive serverless instance changes, or that GPT-5.6 passed the live red-team suite. Public copy must preserve those distinctions.
