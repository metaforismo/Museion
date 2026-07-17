# Implementation plan

## Completed locally in this redesign pass

- [x] Baseline install, lint, typecheck, 159-test suite, and production build
- [x] Read-only visual, learning, and architecture audits
- [x] Separate marketing, app, library, review, evidence, and focus navigation
- [x] Add collapsible persisted sidebar and mobile bottom navigation
- [x] Add strict `DashboardSnapshotSchema`
- [x] Add deterministic next-action and review selectors
- [x] Aggregate authored sessions, generated sessions, compiler runs, misconceptions, evidence, and runtime
- [x] Replace fabricated protocol phases with factual evidence states
- [x] Add `/dashboard`, `/library`, and `/review`
- [x] Keep first-time visitors on the public landing page
- [x] Recompute source identity server-side
- [x] Make Maia cancellation mutation-free
- [x] Strictly validate session creation requests
- [x] Add regression tests for snapshot, source integrity, and Maia cancellation

## Next implementation slices

- [ ] Persist authored session/profile DTOs through the durable backend
- [ ] Persist compiler job state and restart recovery
- [ ] Add Judge cursor, expected version, idempotency ledger, and atomic compare-and-swap
- [ ] Bind source authorization/warning acknowledgement to the source digest server-side
- [ ] Add shared Zod-validated HTTP response helpers
- [ ] Persist safe generated misconception events
- [ ] Decompose Creator, LessonPlayer, Judge, Maia, and Settings controllers
- [ ] Add section-level dashboard unavailable/expired states
- [ ] Add keyboard command search over real available data
- [ ] Add delayed retention only with a genuine scheduler and evidence schema
- [ ] Capture and validate the full screenshot set
- [ ] Complete 320/375/768/1440 and 200% zoom browser gates

No files in this redesign pass are staged, committed, pushed, deployed, or submitted.
