# Current product audit

Updated 2026-07-17 against the live repository, not the README.

## V2 route audit

Before screenshots are preserved in `docs/redesign/before/`.

| Route | Purpose / user / action | Data source | Strengths | Main issue and V2 decision | Priority | Before |
|---|---|---|---|---|---|---|
| `/` | Explain Museion; prospective learner; try/create | Authored page content | Honest thesis and trace | Hero was static and Maia absent. Added a checked micro-interaction and Maia/method section. | P0 | `landing-desktop.png` |
| `/welcome` | Orientation; new learner; personalize/start | Browser storage | Clear philosophy | Added versioned broad preferences; supervised mode remains a blocker. | P1 | n/a |
| `/dashboard` | Resume/inspect; learner; begin next move | Typed server snapshot | Truthful ranking | Fixed oversized dark card, misleading sync and unearned evidence; rebuilt mission/rail/sidebar. | P0 | `dashboard-desktop.png`, `dashboard-mobile.png` |
| `/library` | Browse foundations; learner; open lesson | Lesson registry + curriculum graph | Deterministic lessons | Added validated prerequisites; national coverage remains unclaimed. | P1 | n/a |
| `/review` | Revisit real signals; learner; open review | Dashboard snapshot | No invented urgency | Generated misconception history remains incomplete. | P1 | `review-desktop.png` |
| `/progress` | Inspect evidence; learner/evaluator | Dashboard snapshot | Narrow claim language | Delayed retention does not exist; boundary remains explicit. | P0 | `evidence-desktop.png` |
| `/create` | Ingest; creator; compile | Source/compiler pipeline | Hashes, warnings, templates | Long-job recovery and edge sources need continued browser coverage. | P1 | `creator-desktop.png` |
| `/create/review/*` | Inspect validation; creator; launch | Compiler run | Fail-closed gates | Dense evidence-to-block review remains a refinement. | P1 | n/a |
| `/judge`, `/learn/*` | Generated lesson/transfer; learner/judge | Typed runtime + judge store | Locked transfer | Fixed signed range, stale form, targets and annotations; cross-tab CAS remains open. | P0 | n/a |
| `/lessons/*` | Authored focus lesson; learner; answer | Server lesson session | Checked feedback/recovery | Fixed forced chat scroll and generic Maia identity; authored live targets remain open. | P0 | `learning-desktop.png` |
| `/settings` | Configure AI; owner; connect/check | Server AI settings | No browser API keys | Hosted/local and partial persistence must remain unambiguous. | P1 | `settings-desktop.png` |
| `/about`, `/privacy`, `/terms` | Method/policy; public | Authored content | Clear limits | Needs formal policy/legal review before school launch. | P1 | n/a |

Cross-route strengths: desktop/sidebar, mobile drawer/bottom nav, command-palette focus, 44 px controls and semantic status regions. Remaining gates include production console, responsive/zoom/reduced-motion and screen-reader review.

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
- Youth-safe supervised mode, full deletion, and formal legal/safeguarding review are not implemented.
- External curriculum imports and national-curriculum coverage are not implemented.
