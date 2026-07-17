# Clean-code audit

> Historical snapshot from the pre-V2 audit. Current conclusions and remaining boundaries live in `docs/redesign/CLEAN_CODE_AUDIT.md`.

Audit date: 2026-07-17.

## P1 component boundaries

### `SourceCreator.tsx`

- Owns draft hydration/save, source normalization, file drop state, document review, learning brief, templates, compiler start/poll/cancel/recovery, and all presentation.
- This makes race reasoning and isolated tests expensive.
- Extract behavior first: `useCreatorDraft`, `useSourceNormalization`, `useCompilerJob`; then presentational `SourceInput`, `SourceReview`, `LearningBrief`, `CompilerProgress`.
- Do not introduce global state or a form library.

### `LessonPlayer.tsx`

- Owns session boot/recovery, three mutations, retry protocol, feedback focus, hint state, completion, answer controls, and layout.
- Extract `useLessonSession` and a shared versioned mutation helper only after characterization tests.
- Immediate low-risk split: `LessonHeader`, `StepFeedback`, and `CompletionSummary`.

### `JudgeExperience.tsx`

- Owns boot/resume, runtime actions, transfer, reset, every UI state, and networking.
- `jsonRequest<T>` casts unvalidated payloads and has no timeout.
- Extract request protocol and `useJudgeSession`; keep correctness in server/runtime modules.

### `MaiaPanel.tsx`

- Networking and transcript rendering are coupled, but the scope is still coherent.
- Extract a request hook only when generated-runtime Maia shares the same protocol.
- Immediate need is a responsive coach shell and diagnostics disclosure, not a broad abstraction.

## Repeated implementation patterns

- Request timeout, JSON parsing, safe error codes, busy locks, idempotency keys, and stale-version recovery recur across creator, lessons, judge, and Maia.
- Button, alert, badge, progress, and surface class strings recur without a small shared visual contract.
- Several pages contain entire regions as single-line JSX, particularly `JudgeExperience` and the static golden review.

## Recommended primitives

Create only primitives with multiple real consumers:

- `PageHeader`: restrained responsive title, optional eyebrow and action.
- `InlineAlert`: semantic error/status layout.
- `ProgressSteps`: creator and learning path.
- `StatusBadge`: neutral/valid/warning/error states.
- `StickyActionBar`: review launch and mobile activity continuation.
- `TechnicalDisclosure`: hashes, models, timing, diagnostics.

Avoid one-div wrappers, new UI libraries, global stores, or speculative generic form systems.

## Naming and honesty

- [Resolved] The misleading `--font-geist-sans` and Fraunces display aliases were replaced with one honest local `--font-ui` stack.
- [Partially resolved] `Judge` was removed from primary navigation and homepage calls to action; remaining generated-player internals belong in a later copy pass.
- [Resolved] Authored practice now says `Hint-free practice`; `independent` is reserved for locked transfer.
- `mastery` remains an internal heuristic name; learner surfaces should say `support estimate` or evidence state.

## Refactor acceptance tests

For every split:

1. Existing behavior and API shapes remain unchanged.
2. No new source of truth is introduced.
3. Race and stale-response behavior stays covered.
4. The extracted unit can be tested without rendering the full page.
5. Total complexity decreases; line-count movement alone is not success.
