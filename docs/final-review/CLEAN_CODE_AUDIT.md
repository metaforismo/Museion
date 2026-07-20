# Clean Code Audit — Final Review (2026-07-18)

Baseline at commit `29a9152`: lint ✓, typecheck ✓, 288 tests passed / 17 live-gated skipped,
build ✓, bundle budgets ✓ (static 2923.5/3072 KiB, largest JS 492.3/550 KiB).

## Architecture map

- `src/app` — App Router routes. Server components do data loading and render directly; client
  islands are leaf components. Good RSC discipline overall.
- `src/app/api/**` — uniformly thin handlers: `zod.safeParse` → domain call → error-code → status
  mapping. Consistently under ~40 lines.
- `src/lib/engine` — deterministic tutoring core (session state machine, verifier, mastery/fading).
  Pure, no I/O.
- `src/lib/maia` — provider selection, buffered typed turns, leak gate with one bounded repair,
  deterministic fallback.
- `src/lib/compiler` — staged course generation, schema-validated and hash-chained per stage.
- `src/lib/source` — ingestion/normalization, Source Pack manifests, SHA-256 provenance.
- `src/lib/judge` / `runtime` / `evidence` — verified replay runtime, revision-guarded commands,
  locked transfer.
- `src/lib/server/durable-state.ts` — memory/supabase backend abstraction with CAS.
- `src/components` — client islands; three are outsized god components (below).

## Strengths (verified)

- Zod at every trust boundary; contracts are the source of truth.
- Idempotency + optimistic concurrency done seriously (idempotency keys, command fingerprints,
  compareAndPut versions, request dedupe).
- Hash-chained provenance from document → manifest → compiled stages → artifact.
- Tutor safety by construction: schema validation + UI-target allowlist + leak detection before
  delivery, one repair attempt, then deterministic fallback.
- Zero `as any` in the repo; `as unknown as` confined to a repeated globalThis-singleton pattern.

## Problems

### P1 — god components (responsibility mixing, not just size)

| File | Lines | Mixed responsibilities |
|---|---|---|
| `src/components/LessonPlayer.tsx` | 950 | session bootstrap/resume race handling; four near-identical fetch+retry flows; all rendering; inline `CompletionScreen` and `AnswerControl` |
| `src/components/SourceCreator.tsx` | 819 | localStorage draft machine; compiler-run polling; source-mode switching; drag-drop; ~350 lines JSX; 20 `useState` hooks |
| `src/components/AiSettingsPanel.tsx` | 434 | six independent async workflows each with own busy/notice/error state |

### P1 — duplicated client fetch/error logic

Four structurally identical `errorMessage`-mapping functions (`SourceCreator` ×2,
`AiSettingsPanel`, `JudgeExperience`) and a local `jsonRequest` in `JudgeExperience.tsx:34-44`
that bypasses `fetchWithTimeout` entirely — so the judge flow has no client-side timeout while
every other flow does. Copy-drift is already observable.

### P1 — `src/lib/store.ts` bypasses the storage abstraction

The only stateful subsystem not behind `durable-state.ts`; bespoke globalThis map + TTL/prune
logic duplicating what `StateBackend` centralizes.

### P2

- Repeated Tailwind card strings (`border border-ink/10 bg-surface` ×36) instead of component classes.
- Six ad hoc `globalThis as unknown as {…}` singletons instead of one typed helper.
- Supabase auth header branches on the secret's string prefix (`durable-state.ts:125`) instead of config.
- Zero test coverage on client components (4,257 lines combined); vitest has no DOM environment.

## Refactor policy for this pass

Complexity must go down, not move. This pass extracts only along real seams:

1. Shared `postJson` helper + per-domain error dictionaries (kills 4 duplicated mappers, gives the
   judge flow a timeout).
2. `CompletionScreen` and `AnswerControl` out of `LessonPlayer` (clean prop boundaries already).
3. Repeated card/surface strings into `globals.css` component classes as part of the design-token pass.

Deliberately deferred (correct but out of scope for a hackathon-final pass): full LessonPlayer
hook decomposition, moving `store.ts` behind `StateBackend`, DOM test environment. These are
recorded in TODO.md so the roadmap stays honest.
