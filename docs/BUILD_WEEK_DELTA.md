# Build Week Delta

Changes on top of the pre-Build Week baseline (`d52f867`, 2026-07-15).
Each entry is dated and maps to the roadmap in [`TODO.md`](../TODO.md).

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
