# Museion — Roadmap / TODO

Status legend: `[x]` done · `[ ]` planned

## v0.2 — Web platform foundation ✅

- [x] Next.js (App Router) + React + Tailwind platform
- [x] Lesson content as type-checked TypeScript data: verified solutions, answer specs, misconception libraries, hint ladders
- [x] Deterministic verifier (numeric / multiple-choice / expression) — correctness never decided by the LLM
- [x] Misconception matcher (exact + numerically equivalent triggers)
- [x] Per-concept mastery model that discounts assisted success
- [x] Contingent fading policy (hint-ladder depth shrinks with mastery)
- [x] Step-based session state machine with full event log
- [x] Client/server truth boundary: browser receives sanitized lessons only (prompts + options), with a regression test
- [x] Maia prompt builder: solution injection + non-revelation guardrail + scaffolding directive, cache-friendly split
- [x] Maia tutor (OpenAI Responses API) with strict buffered turns, a pre-delivery leak gate, and deterministic offline fallback
- [x] Lesson player UI: progress bar, answer controls per step kind, feedback, hint ladder
- [x] Maia side panel: chat, quick suggestions, "ask Maia why" after a wrong answer
- [x] CI workflow (lint + test + build) with manual dispatch

## v0.2.x — Content, learning loop, story ✅

- [x] Five lessons across three tracks (Algebra, Arithmetic, Computer Science)
- [x] Lesson resume: sessions restorable after reload (localStorage + resume endpoint)
- [x] Post-solve solution reveal ("see why it works" — worked example after the reasoning, never before)
- [x] Completion screen with per-concept mastery bars and session stats
- [x] Content authoring validation: structural checks + every misconception trigger proven NOT to verify as correct
- [x] Maia conversation cap per session (bounds avoidance and API spend)
- [x] **Practice mode**: per-lesson exercise banks, shuffled and served without the hint ladder (retrieval practice); practice banks for 4 lessons
- [x] **About page**: the Mouseion of Alexandria, Maia and maieutics, the five design principles
- [x] **Onboarding tour**: 4-slide first-visit walkthrough (auto-shown once, skippable, replayable from About)
- [x] Shared wire contracts (`src/lib/api-types.ts`) used by both API routes and client components
- [x] Header navigation (Lessons / About), practice badges on lesson cards

## v0.3 — Accounts & persistence

- [x] Anonymous learner identity (httpOnly cookie) — database-ready profile shape
- [x] Per-learner mastery profile that persists across sessions and lessons (sessions share the profile's mastery model, so fading carries over)
- [x] "My progress" page: per-concept mastery bars grouped by lesson, completion + practice-run badges, scaffolding labels
- [ ] Database persistence (Supabase/Postgres): sessions, mastery, event logs — replace the in-memory store
- [ ] Learner accounts and auth (upgrade the anonymous cookie id, start with magic-link email)
- [ ] Migrate localStorage resume to server-backed learner state
- [ ] Session expiry / cleanup policy for abandoned sessions
- [ ] Deploy to Vercel with environment-based config

## v0.4 — Maia hardening & quality

- [x] Answer-leak gate (`src/lib/maia/leak.ts`): schema + target + answer checks before delivery, one repair, then deterministic fallback
- [ ] Run and record the 8-case GPT-5.6 live red-team suite (auto-skipped without an API key)
- [x] Rate limiting on the Maia route (sliding window per session + Retry-After; per-IP once deployed behind a stable proxy)
- [x] Strict structured Maia JSON response (buffered so safety checks complete before delivery)
- [ ] Conversation summarization for long sessions (keep prompt size bounded)
- [x] Self-explanation prompts after correct answers, checked by Maia (generation effect)
- [ ] Localized tutoring: Maia answers in the learner's language (start with Italian)
- [x] Prompt-cache + token usage instrumentation on every tutor turn (session events + structured logs)

## Build Week — Source-grounded compiler

- [x] Browser ingestion for pasted text, Markdown, and selectable-text PDF
- [x] Versioned normalization, page/document SHA-256, hard limits, and instruction-like-content warnings
- [x] Exact unique source spans with UTF-16 offsets and hash/slice round-trip validation
- [x] `/create` canonical preview verified with the six-page golden PDF at desktop and 320 px
- [x] Canonical Source Graph and citation contracts
- [x] Course Blueprint and public/private Course Artifact v2 contract, closed block registry, and v1 adapter
- [x] Multi-stage GPT-5.6 compiler with typed repair and keyless golden replay
- [x] Typed deterministic interactive blocks and bounded Maia UI actions
- [x] Locked near-transfer task and versioned evidence ledger
- [x] Complete local judge path and 20/20 clean-browser runs
- [x] Deployment and submission drafts with measured claims
- [ ] Hosted deployment verification and final submission (explicit authorization required)

## v0.5 — Content & exercise depth

- [x] Practice banks for every lesson
- [ ] More lessons per track: Algebra (two-step inequalities, systems intro), Arithmetic (percentages, ratios), CS (hexadecimal, logic gates, Big-O intuition)
- [ ] New step kinds: multi-input (e.g. "give both solutions"), ordering, drag-to-match pairs
- [ ] Adaptive practice composition: pick the next exercise targeting the learner's weakest concept (the "optimal problem X for target Y" pattern)
- [ ] Symbolic expression verifier (accept `x=3` and `3` and `6/2`; real equivalence, not string normalization)
- [ ] Authoring CLI: `npm run validate-content` standalone + lesson scaffolding generator
- [ ] Difficulty tagging per step; mastery thresholds tuned per difficulty

## v0.6 — The interactive moat

- [ ] Interactive lesson widgets: manipulable components (number line, balance scale, fraction bars, binary bit-flipper) whose state is code-owned ground truth
- [ ] Feed widget state into Maia's snapshot ("the learner set the slider to 2.3 and stopped")
- [ ] Let Maia act on the environment: highlight a region, annotate, pose an intermediate micro-question
- [ ] Lesson illustrations / diagrams per step

## v0.7 — Prove it works (the honest metric)

- [ ] Retention probes: scheduled, Maia-free re-tests of concepts days after the lesson
- [ ] Delayed-transfer dashboard: in-session mastery vs. retention without assistance (the anti-crutch metric)
- [ ] A/B harness: guardrailed Maia vs. hint-ladder-only vs. no help, measured on delayed transfer
- [ ] Per-misconception analytics: which wrong paths are most common, which remediations work
- [ ] Event-log export pipeline for analysis

## v0.8 — Scale the experience

- [ ] Voice interaction for Maia (speech in/out)
- [ ] Multilingual content (lesson translations with verified solutions per locale)
- [ ] Mobile layout polish; PWA install
- [ ] Safety hardening for minors: topic confinement audits, conversation flagging, data retention configuration
- [ ] Teacher/parent dashboards

## Engineering hygiene (ongoing)

- [x] Repeatable Playwright smoke: onboarding → lesson → practice/progress plus text/PDF source ingestion
- [x] Full Playwright judge-path E2E with review/replay/transfer and 20/20 release run
- [x] Typecheck script (`npm run typecheck`)
- [x] Structured JSON logging on API routes (session_created, run_completed, maia_* events)
- [x] Error boundary + not-found page with friendly copy
- [x] Reduced-motion support (animations disabled under `prefers-reduced-motion`)
- [x] Accessibility: aria-live chat log, progressbar semantics, labeled controls
- [x] Accessibility: full keyboard-navigation audit
- [x] Bundle/Lighthouse audit with route payload, CLS, and static-asset budgets
