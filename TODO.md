# Museion — Roadmap / TODO

Status legend: `[x]` done · `[ ]` planned

## Current iteration — one Course Architect, one Source Pack, one MCP

- [x] Preserve Museion Originals as the primary learning experience.
- [x] Model YouTube, playlists, books, course pages, transcripts, excerpts, notes, and text as material shapes inside one Source Pack capability.
- [x] Require explicit rights confirmation and a rights basis before a Source Pack is accepted.
- [x] Hash every material and the complete pack; return a raw-content-free public summary.
- [x] Add a stateless Streamable HTTP MCP endpoint for ChatGPT, Codex, Claude Code, Cursor, and other compatible clients.
- [x] Expose Source Pack preparation, Course Architect compilation, and Museion Originals discovery as typed MCP tools.
- [x] Lock model-backed MCP compilation behind an explicit server Bearer token.
- [x] Add protocol, malformed-input, mixed-material, privacy, limit, and burst stress tests.
- [x] Replace separate paste/upload/link product modes with one visible Source Pack intake for text, files, and optional provenance.
- [x] Add a clickable Course Architect companion with a desktop chat rail, mobile sheet, source/goal/file intake, focus return, and a deterministic Museion Method readiness check.
- [ ] Support multiple independently editable references in the Creator Studio Source Pack UI (the MCP contract already supports one reference per material).
- [ ] Add an optional live Codex conversational turn before compilation; keep deterministic intake and method gates available offline.
- [x] Persist a raw-content-free Source Pack manifest with every new compiler run and show per-material span/block citation coverage in Creator review.
- [ ] Add per-client MCP identities, revocable tokens, rate limits, and audit events before public multi-user hosting.
- [ ] Verify the deployed HTTPS MCP endpoint from each target client; do not claim compatibility from local protocol tests alone.
- [ ] Connect the live runtime-specific Maia snapshot to GPT-5.6 and complete the graph/coding flagship vertical slice from the attached submission brief.

### Continuation checklist — evidence ledger and hardening

- [x] Record an explicit Creator Studio rights basis and reject missing rights at the compiler API boundary.
- [x] Bind every manifest to the exact compiler document hash and contiguous compiled-page ranges.
- [x] Preserve multi-material roles, references, warnings, hashes, and page ownership without persisting raw source text in the public run view.
- [x] Compute cited spans, cited learning blocks, extracted-span coverage, uncited materials, and unmapped spans deterministically.
- [x] Show the Source Pack ledger in Creator review with accessible coverage progress and a legacy-run fallback.
- [x] Cover single, mixed, maximum-eight-material, tampered-manifest, privacy, duplicate-citation, uncited, unmapped, draft, API-rights, and owner-bound run cases.
- [ ] Support multiple independently editable references and material roles directly in Creator Studio before normalization.
- [ ] Add per-client MCP identities, revocation, rate limiting, and audit events; then run deployed interoperability checks from each named client.

## v0.2 — Web platform foundation ✅

- [x] Next.js (App Router) + React + Tailwind platform
- [x] Lesson content as type-checked TypeScript data: verified solutions, answer specs, misconception libraries, hint ladders
- [x] Deterministic verifier (numeric / multiple-choice / expression) — correctness never decided by the LLM
- [x] Misconception matcher (exact + numerically equivalent triggers)
- [x] Per-concept mastery model that discounts assisted success
- [x] Contingent fading policy (hint-ladder depth shrinks with mastery)
- [x] Step-based session state machine with full event log
- [x] Session protocol v2: explicit post-solve advance, optimistic step/version guards, idempotent mutations, stale Maia rejection, and visible request recovery
- [x] Client/server truth boundary: browser receives sanitized lessons only (prompts + options), with a regression test
- [x] Maia prompt builder: solution injection + non-revelation guardrail + scaffolding directive, cache-friendly split
- [x] Maia tutor (OpenAI Responses API) with strict buffered turns, a pre-delivery leak gate, and deterministic offline fallback
- [x] Lesson player UI: progress bar, answer controls per step kind, feedback, hint ladder
- [x] Maia side panel: chat, quick suggestions, "ask Maia why" after a wrong answer
- [x] CI workflow with lint, typecheck, tests, production audit, reproducible fixtures, build, bundle budgets, and browser gates

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
- [ ] Database persistence (Supabase/Postgres): compiler/Judge state adapter and migration are implemented; learner sessions, mastery, event logs, and live cold-start verification remain
- [x] Process-local TTL cleanup and per-owner retention quotas as a bounded pre-deployment safeguard
- [ ] Learner accounts and auth (upgrade the anonymous cookie id, start with magic-link email)
- [ ] Migrate localStorage resume to server-backed learner state
- [ ] Session expiry / cleanup policy for abandoned sessions
- [ ] Deploy to Vercel with environment-based config

## v0.4 — Maia hardening & quality

- [x] Answer-leak gate (`src/lib/maia/leak.ts`): schema + target + answer checks before delivery, one repair, then deterministic fallback
- [x] Run and record the 8-case GPT-5.6 Terra live red-team suite through Codex (0 delivered leaks)
- [x] Rate limiting on the Maia route (sliding window per session + Retry-After; per-IP once deployed behind a stable proxy)
- [x] Strict structured Maia JSON response (buffered so safety checks complete before delivery)
- [ ] Conversation summarization for long sessions (keep prompt size bounded)
- [x] Self-explanation prompts after correct answers, checked by Maia (generation effect)
- [ ] Localized tutoring: Maia answers in the learner's language (start with Italian)
- [x] Prompt-cache + token usage instrumentation on every tutor turn (session events + structured logs)

## Build Week — Source-grounded compiler

- [x] Add balanced Luna/Terra/Sol routing with exact requested/resolved models and family-only fallback
- [x] Add server-only local Codex structured execution, official login/status/check/cancel routes, and hosted-runtime denial
- [x] Add Settings provider experience and transparent routing table
- [x] Add Socratic Foundations, Exam Practice, and Teach It Back templates
- [x] Convert compilation to owner-bound asynchronous jobs with progress, cancellation, duplicate protection, retry, and refresh recovery
- [x] Run one non-golden live compilation and three-model conformance check through ChatGPT/Codex

- [x] Browser ingestion for pasted text, Markdown, and selectable-text PDF
- [x] Versioned normalization, page/document SHA-256, hard limits, and instruction-like-content warnings
- [x] Exact unique source spans with UTF-16 offsets and hash/slice round-trip validation
- [x] `/create` canonical preview verified with the six-page golden PDF at desktop and 320 px
- [x] Canonical Source Graph and citation contracts
- [x] Course Blueprint and public/private Course Artifact v2 contract, closed block registry, and v1 adapter
- [x] Multi-stage GPT-5.6 compiler with typed repair and keyless golden replay
- [x] Compiler truth hardening: blocking warnings, provenance binding, server-owned reports, citation/transfer gates, runtime validation
- [x] Typed deterministic interactive blocks and bounded Maia UI-action contracts
- [x] Locked near-transfer task and versioned evidence ledger
- [x] Complete local judge path and 20/20 clean-browser runs
- [x] Deployment and submission drafts with measured claims
- [x] Wire deterministic bounded Maia observations/actions and counterexample guidance into the visible Judge runtime
- [ ] Connect the live provider to the runtime-specific Maia snapshot
- [ ] Compile a non-golden Creator source into a validated reviewable course
- [x] Owner-bound compiler run API, audience brief, sanitized dynamic review, and truthful keyless failure
- [x] Launch a compatible validated compiler run as a generated learner experience
- [ ] Replace process-local session maps with deployment-safe state (compiler and Judge complete; authored lesson/profile stores remain)
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
