# Build Week Delta

Changes on top of the pre-Build Week baseline (`d52f867`, 2026-07-15).
Each entry is dated and maps to the roadmap in [`TODO.md`](../TODO.md).

## 2026-07-15 — Codex Build Week implementation (published on `main`)

- Added an OpenAI GPT-5.6 Responses provider behind a provider-neutral tutor contract.
- Replaced raw token delivery with a strict Zod tutor turn buffered behind schema, UI-target, and answer-leak checks.
- Added one repair attempt and deterministic fallback; unsafe candidates are not persisted or delivered.
- Marked lesson/learner state as untrusted JSON data in tutor instructions.
- Enforced anonymous-cookie ownership on session read and mutation routes.
- Stripped hints from synthetic practice lessons server-side.
- Added explicit CI typecheck, deterministic Turbopack root, safety/ownership tests, and a repeatable desktop/mobile Chrome smoke.
- Added deterministic browser normalization for pasted text, Markdown, and selectable-text PDFs, with stable page/document hashes, exact UTF-16 spans, limits, and instruction-like-content warnings.
- Added `/create` to inspect canonical pages and hashes before compilation; Source Graph remains deliberately disabled.
- Expanded browser verification using the real six-page golden PDF and fixed the session-creation race, local PDF worker, and 320 px navigation defects it exposed.
- Added strict Source Graph, Course Blueprint, and private/public Course Artifact v2 contracts with canonical hashing, closed block kinds, semantic reference checks, and an explicit legacy-v1 adapter.
- Added fail-closed public serialization that omits answer specifications, solutions, hints, misconception internals, expected traces, and diagnostic rules.

Subsequent work added the checked golden graph/blueprint/artifact, compiler orchestration, interactive runtime, transfer ledger, creator review, complete Judge route, accessibility gates, performance budgets, and compiler truth hardening. These changes are committed and published on `main`. No live GPT-5.6 result, hosted deployment, learning-outcome result, Devpost publication, or final submission is claimed.

## 2026-07-15 — Tutor hardening, self-explanation, full practice coverage

**Learning loop**
- Self-explanation prompt after every correctly solved lesson step
  ("Lock it in: why did that work, in one sentence?") — the learner's
  explanation is sent to Maia for one-line feedback (generation effect).
  Optional, lesson mode only.
- Practice bank added for *Adding Fractions with Unlike Denominators* —
  every lesson now has practice coverage (3 exercises, including the
  "product vs. least common multiple" misconception).

**Maia hardening (roadmap v0.4)**
- Sliding-window rate limiting on the tutor route: 6 requests/minute per
  session with a `Retry-After` header, alongside the existing 30-turn
  session cap. The panel now surfaces the server's explanation instead
  of a generic message.
- Token + prompt-cache instrumentation: every tutor turn records
  input/output/cache-read/cache-write token counts to the session event
  log and to structured server logs — `cacheReadTokens > 0` on
  follow-up turns verifies the persona block rides the prompt cache.

**Engineering**
- Structured JSON logging (`src/lib/server/log.ts`) on session creation,
  run completion, tutor turns, rate limiting, and possible answer leaks.
  Ids and counts only — never learner answers or chat content.
- Programmatic tutor messages unified behind one `MaiaOutbox` interface
  (used by "ask Maia why" and self-explanations).
- Accessibility: the chat is an `aria-live` log, the lesson progress bar
  carries `progressbar` semantics, form controls gained labels.
