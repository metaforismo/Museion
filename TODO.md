# Museion — Roadmap / TODO

Status legend: `[x]` done · `[ ]` planned

## v0.1 — Core architecture (this release)

- [x] Lesson content schema with verified solutions, answer specs, misconception libraries, hint ladders
- [x] Deterministic verifier (numeric / multiple-choice / expression) — correctness never decided by the LLM
- [x] Misconception matcher (exact + numerically equivalent triggers)
- [x] Per-concept mastery model that discounts assisted success
- [x] Contingent fading policy (hint-ladder depth shrinks with mastery)
- [x] Step-based session state machine with full event log
- [x] Maia prompt builder: solution injection + non-revelation guardrail + scaffolding directive, cache-friendly split
- [x] Maia tutor client (Claude API, streaming) with deterministic offline fallback
- [x] FastAPI surface (lessons, sessions, answers, hints, chat)
- [x] Interactive CLI demo
- [x] Test suite (engine, prompt, API — no network required)
- [x] Two bundled lessons (linear equations, fractions with unlike denominators)

## v0.2 — Make it real

- [ ] Persistence: store sessions, mastery, and event logs (SQLite first, Postgres-ready)
- [ ] Learner accounts and auth on the API
- [ ] Streaming endpoint for Maia (SSE) so the frontend can render token-by-token
- [ ] Maia red-team test harness: adversarial "just tell me the answer" prompts, automated leak detection on outputs
- [ ] Expression verifier upgrade: real symbolic equivalence (sympy) instead of normalized string match
- [ ] Lesson authoring validation CLI (`museion validate <lesson.json>`): hints must not contain the answer, misconception triggers must not equal the correct answer

## v0.3 — The interactive moat

- [ ] Interactive lesson blocks: manipulable widgets (number line, balance scale, tangent slider) whose state is code-owned ground truth
- [ ] Feed widget state into Maia's snapshot ("the learner dragged the slope to 2.3 and stopped")
- [ ] Let Maia act on the environment: highlight a region, annotate, pose an intermediate micro-question
- [ ] Web frontend (lesson player + Maia side panel)

## v0.4 — Prove it works (the honest metric)

- [ ] Retention probes: scheduled, Maia-free re-tests of concepts days after the lesson
- [ ] Delayed-transfer dashboard: mastery in session vs. retention without assistance (the anti-crutch metric)
- [ ] A/B harness: guardrailed Maia vs. hint-ladder-only vs. no help, measured on delayed transfer
- [ ] Per-misconception analytics: which wrong paths are most common, which remediations work

## v0.5 — Scale the experience

- [ ] Voice interaction for Maia
- [ ] Personalized practice composition: pick the next problem X that best prepares the learner for target Y
- [ ] Multilingual content and tutoring
- [ ] Safety hardening for minors: topic confinement audits, conversation flagging, zero-retention configuration

## Engineering hygiene (ongoing)

- [ ] CI: pytest + lint on every push (GitHub Actions)
- [ ] Type checking (mypy) and lint (ruff) configs
- [ ] Structured logging and request tracing in the API
- [ ] Prompt-cache hit-rate instrumentation (verify the persona block actually caches)
