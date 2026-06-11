# Museion — Roadmap / TODO

Status legend: `[x]` done · `[ ]` planned

## v0.2 — Web platform (this release)

- [x] Next.js (App Router) + React + Tailwind platform
- [x] Lesson content as type-checked TypeScript data: verified solutions, answer specs, misconception libraries, hint ladders
- [x] Deterministic verifier (numeric / multiple-choice / expression) — correctness never decided by the LLM
- [x] Misconception matcher (exact + numerically equivalent triggers)
- [x] Per-concept mastery model that discounts assisted success
- [x] Contingent fading policy (hint-ladder depth shrinks with mastery)
- [x] Step-based session state machine with full event log
- [x] Client/server truth boundary: browser receives sanitized lessons only (prompts + options), with a regression test
- [x] Maia prompt builder: solution injection + non-revelation guardrail + scaffolding directive, cache-friendly split
- [x] Maia tutor (Claude API) streaming token-by-token to the panel, with deterministic offline fallback
- [x] Lesson player UI: progress bar, answer controls per step kind, feedback, hint ladder
- [x] Maia side panel: chat, quick suggestions, "ask Maia why" after a wrong answer
- [x] Vitest suite (engine, prompt, sanitization)
- [x] Two bundled lessons (linear equations, fractions with unlike denominators)

## v0.3 — Make it real

- [ ] Persistence: sessions, mastery, and event logs in a database (Supabase/Postgres); replace the in-memory store
- [ ] Learner accounts and auth
- [ ] Resume in-progress lessons; mastery persists across sessions
- [ ] Maia red-team test harness: adversarial "just tell me the answer" prompts, automated leak detection on outputs
- [ ] Expression verifier upgrade: real symbolic equivalence instead of normalized string match
- [ ] Content authoring validation: hints must not contain the answer, misconception triggers must not equal the correct answer
- [ ] Deploy (Vercel) with rate limiting on the Maia route

## v0.4 — The interactive moat

- [ ] Interactive lesson widgets: manipulable components (number line, balance scale, tangent slider) whose state is code-owned ground truth
- [ ] Feed widget state into Maia's snapshot ("the learner dragged the slope to 2.3 and stopped")
- [ ] Let Maia act on the environment: highlight a region, annotate, pose an intermediate micro-question
- [ ] Lesson illustrations and richer step types (multi-input, ordering, drag-to-match)

## v0.5 — Prove it works (the honest metric)

- [ ] Retention probes: scheduled, Maia-free re-tests of concepts days after the lesson
- [ ] Delayed-transfer dashboard: mastery in session vs. retention without assistance (the anti-crutch metric)
- [ ] A/B harness: guardrailed Maia vs. hint-ladder-only vs. no help, measured on delayed transfer
- [ ] Per-misconception analytics: which wrong paths are most common, which remediations work

## v0.6 — Scale the experience

- [ ] Voice interaction for Maia
- [ ] Personalized practice composition: pick the next problem X that best prepares the learner for target Y
- [ ] Multilingual content and tutoring
- [ ] Safety hardening for minors: topic confinement audits, conversation flagging, zero-retention configuration

## Engineering hygiene (ongoing)

- [ ] CI: vitest + lint + build on every push (GitHub Actions)
- [ ] E2E tests (Playwright) for the lesson player flow
- [ ] Structured logging and request tracing on API routes
- [ ] Prompt-cache hit-rate instrumentation (verify the persona block actually caches)
