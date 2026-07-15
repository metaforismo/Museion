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
| Multi-stage compiler, critic, one typed repair | Visible + live verified | Codex job UI routes Luna/Terra/Sol; non-golden water-cycle compile passed on 2026-07-15. |
| Compiler truth hardening | Internal + golden replay | Blocking warnings, source/hash binding, citation/transfer gates, server-owned validation/provenance, runtime validators, terminal traces. |
| Typed interactive reducers | Visible in golden replay | Prediction, range, trace, and sequence only; guided response is not rendered by Judge. |
| Maia lesson tutor | Visible + live verified | Terra via Codex passed eight adversarial requests with zero delivered leaks; deterministic fallback remains explicit. |
| Session protocol v2 | Visible in authored lessons | Correct answers remain on the solved step until explicit advance; answer, hint, advance, and Maia commands are version/step guarded and idempotent. State is still process-local. |
| Runtime Maia snapshot and bounded actions | Visible in golden replay | Incorrect outcomes produce a public snapshot, schema-validated deterministic turn, allow-listed semantic emphasis, and bounded off-by-one counterexample. Live provider wiring remains open. |
| Locked unassisted transfer | Visible in golden replay | One immediate near-transfer observation, not durable mastery. |
| Evidence ledger | Visible in golden replay | Transfer event only; guided corrections and confidence are not yet included. |
| Creator compile runs, review, and learner launch | Visible API + golden replay | Audience-bound owner-scoped run API, sanitized dynamic review, and compatible generated learner route are implemented. Non-golden live compilation requires provider credentials and has not been live-verified. |
| Persistence | Partial durable adapter | Compiler runs and Judge sessions use an explicit memory/Supabase backend with TTLs, ownership filters, quotas, RLS migration, and server-only secrets. Authored lesson sessions/profiles remain process-local; no live database or cold-start verification is claimed. |
| Hosted deployment | Missing | Requires explicit authorization and deployment configuration. |
| Live GPT-5.6 eval | Locally verified | Luna/Terra/Sol conformance, full non-golden compilation, and eight-case Terra red-team recorded. |
| Delayed retention/adaptive practice | Post-hackathon | No longitudinal learning claim is made. |

## Verified local gates

- Strict TypeScript, ESLint, production build, bundle budgets, and production dependency audit.
- 147 offline tests; 17 live tests intentionally gated without opt-in.
- axe WCAG route scans, keyboard-only Judge, route transfer/CLS budgets, desktop Judge 20/20, and 320 px mobile flow.
- Golden Source Document, Source Graph, Blueprint, Artifact, and replay manifest regenerate without drift.

## P0 work remaining

1. Finish the live creator path: generated learner route plus a dated non-golden provider run.
2. Deployment-safe state: migrate authored lesson sessions/profiles to the durable adapter, apply the Supabase migration, and verify cold starts. Compiler/Judge persistence, TTLs, owner quotas, and baseline security headers are implemented locally.
3. Connect the live provider to the visible runtime Maia snapshot and run the authorized live eval.
4. Authorized hosted smoke.

## Submission claim boundary

Museion demonstrates a source-grounded golden replay and a dated live non-golden compilation through the Codex subscription runtime. It does not yet prove that every process-local job survives a serverless instance change, provide a hosted live-Codex mode, or establish learning outcomes. Public copy must preserve those distinctions.
