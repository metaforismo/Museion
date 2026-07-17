# Child safety and age-appropriate design

This is a product boundary and review checklist, not a claim of legal compliance. A qualified legal, safeguarding, privacy, accessibility, and curriculum review is required before deployment to children or schools.

## Current data inventory

Museion uses an anonymous learner cookie; optional local preferences (role, broad age band, goal); process-local authored sessions and mastery estimates; bounded compiler and generated-session records; learner answers, hint events, and Maia conversation turns. It does not ask for a name, exact birth date, school, public profile, contacts, or location.

Authored session records currently expire from process memory after 24 hours. Compiler/generated retention is bounded by the configured durable backend. Browser preferences remain until the browser storage is cleared. The UI must not call all of these records “synced”: the dashboard now distinguishes local lesson records from optionally synced generated work.

## AI requests and logs

Maia receives the authoritative current step, prior attempts, the detected misconception, and a bounded chat history. It does not receive browser cookies or Codex credentials. Logs record safe operational metadata, not source documents, raw answers, tokens, authorization codes, or complete conversations. Offline fallback remains available and paid API use is never automatic.

## Younger learners

- Default to maximum privacy and minimal fields.
- Do not provide public profiles, leaderboards, streak-loss anxiety, or manipulative notifications.
- Keep live tutoring inside a defined lesson; do not expose unrestricted open-domain chat.
- Require a supervised educator/parent mode before enabling live model chat for younger learners. This gate is **not yet implemented**, so hosted youth use is not release-ready.
- Explain when AI is active and when deterministic fallback is used.
- Provide a complete reset/delete control before a school or child deployment. Browser storage can be cleared today, but one product-level deletion action is still planned.
- Maintain age-appropriate content review and clear subject scope.

## Current limitations

There is no identity/guardian system, parental dashboard, content moderation service, crisis escalation, teacher roster, regional consent flow, or formal data-protection impact assessment. These are release blockers for unsupervised youth deployment, not optional polish.
