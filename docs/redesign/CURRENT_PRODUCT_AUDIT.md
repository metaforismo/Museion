# Current product audit

Updated 2026-07-17 against the live repository, not the README.

## Product truth

Museion is strongest where it keeps responsibilities separate: sources carry provenance, course artifacts are schema-bound, deterministic code checks answers, Maia can guide only through a leak gate, and the transfer flow records one immediate unassisted observation. It must not claim retained mastery, general learning gains, or far transfer.

The largest product gap was the old `/progress` page. It inferred a four-phase scientific protocol from one completion Boolean and selected the first catalog lesson as the “next useful test.” The redesign replaces that projection with a typed snapshot built from authored session events, generated sessions, compiler runs, registered misconceptions, provider settings, and the actual persistence backend.

## Experience audit

- `/` mixed marketing, onboarding redirection, and the complete lesson library.
- The sidebar linked “Library” back to marketing and remained visible during lessons.
- Dashboard cards were sparse, oversized, and used internal words such as protocol and evidence ledger.
- Review, recent sources, misconceptions, runtime state, and generated learning were absent from the workspace.
- The mobile app had a drawer but no persistent primary navigation.
- Source hashes supplied by the browser were trusted by provider routing.
- Cancelling Maia could fall through to deterministic guidance and mutate the session.

## Changes now represented locally

- Marketing, workspace, library, review, evidence, create, and focus experiences are distinct.
- The sidebar is grouped, collapsible, persisted when storage works, and paired with a mobile bottom bar.
- `/dashboard` uses a strict server-owned snapshot and explains why the next action is ranked first.
- `/review` only schedules work from recorded signals.
- `/progress` is now an evidence page with an explicit ladder and limitations.
- Server-side source integrity is recomputed before runtime selection.
- Maia aborts are mutation-free.

## Remaining high-risk work

- Authored sessions/profiles and compiler jobs remain process-local.
- Judge actions need atomic version/idempotency enforcement.
- Generated misconception history is not yet persisted.
- Delayed retention, spacing, and cross-course concept identity are not implemented.
- Browser response parsing should move from casts to shared Zod wire schemas.
