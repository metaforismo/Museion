# Improvement implementation plan

> Historical snapshot from the pre-V2 audit. Use `docs/redesign/IMPLEMENTATION_PLAN.md` for the current execution state.

Status legend: `[ ]` pending, `[-]` active, `[x]` verified, `[~]` deferred.

## P1-A — Learner-first visual system

- **Status:** `[x]`
- **Reason:** Serif-heavy, oversized, over-carded screens obscure the learning action.
- **Scope:** Honest font tokens, sans-first display, restrained type/radius/shadow tokens, a separate public shell, persistent learning-laboratory sidebar, and a focus-managed mobile drawer.
- **Non-goals:** New design dependency, remote fonts, brand replacement.
- **Files:** `globals.css`, `SiteHeader.tsx`, `app/page.tsx`, shared primitives if repeated use is proven.
- **Acceptance:** Primary CTA above fold at 320px; no `Judge` in primary navigation; no horizontal overflow; technical proof is secondary; reduced-motion behavior preserved.
- **Tests:** Existing axe/keyboard/browser suite plus 320/390/768/1280 screenshots.

## P1-B — Activity-first authored lessons

- **Status:** `[x]`
- **Reason:** Mobile title collision and always-expanded Maia weaken the main learning task.
- **Scope:** Compact lesson header, 70/30 desktop canvas, collapsed mobile coach, accurate practice wording, focused feedback hierarchy.
- **Non-goals:** Change grading, answers, hints, session protocol, or tutor safety.
- **Files:** `LessonPlayer.tsx`, `MaiaPanel.tsx`, UI verification.
- **Acceptance:** No title/step collision at 320/390; Maia is closed initially on mobile and available in one action; explicit outbox opens it; desktop keeps coach rail; focus and stale-response tests pass.
- **Tests:** Lesson E2E, wrong/correct focus, stale Maia, queued outbox, keyboard, axe, mobile screenshots.

## P1-C — Generated learner shell and copy

- **Status:** `[-]`
- **Reason:** Current surface reads as a technical judge dashboard.
- **Scope:** Compact header/path, learner language, source disclosure, stronger misconception lab, bounded coach hierarchy.
- **Non-goals:** Runtime algorithm changes or new activity kinds.
- **Files:** `JudgeExperience.tsx`, `InteractiveBlock.tsx`, tests.
- **Acceptance:** One obvious task/next action; internal terms hidden by default; transfer remains fully locked; no hidden truth reaches the client.

### P0-C1 — Generated-course renderability and transfer controls

- **Status:** `[x]`
- **Reason:** Accepted artifacts could contain multiple lessons or unsupported guided blocks, and transfer only accepted integer input.
- **Scope:** Fail-closed source-graph structure validation, corrected model instruction, numeric/choice/expression transfer controls, duplicate-checkpoint removal.
- **Acceptance:** Legacy authored content remains valid; incompatible generated artifacts cannot publish; all three transfer response kinds have usable controls.
- **Tests:** Artifact reference tests, full compiler/runtime suite, browser transfer regression.
- **Verification:** 159 unit/integration tests, production build, bundle budgets, and the complete browser suite pass.

## P1-D — Creator progressive disclosure and hooks

- **Status:** `[ ]`
- **Reason:** Workflow is robust but monolithic and visually long.
- **Scope:** Extract draft/normalization/job hooks, five-step presentation, compact readiness summary, technical source details disclosure.
- **Non-goals:** New persistence backend or source formats.
- **Acceptance:** Current draft, warning, authorization, stale normalization, idempotency, cancellation, retry and refresh behaviors remain covered.

## P1-E — Review density

- **Status:** `[ ]`
- **Reason:** Review is trustworthy but too long and technical on mobile.
- **Scope:** First-viewport coverage summary, sticky launch, advanced provenance disclosure, align golden and run-specific pages.
- **Acceptance:** Launch visible without scanning the full page; citations remain block-linked; advanced table does not dominate mobile.

## P0-F — Runtime-specific live Maia

- **Status:** `[ ]`
- **Reason:** Required to complete the claimed generated-learning loop.
- **Scope:** Version-bound runtime snapshot provider, target validation, combined action leak checks, safe fallback.
- **Non-goals:** Letting the model score, mutate runtime state, or navigate.
- **Acceptance:** Eight red-team cases and stale/cancel/fallback tests pass with zero delivered leaks.

## P0-G — Non-golden and deployment evidence

- **Status:** `[ ]`
- **Reason:** Demo credibility depends on arbitrary sources and state recovery.
- **Scope:** Mocked non-golden E2E fixture, live evidence when quota allows, cold-start/cross-instance persistence checks.
- **Acceptance:** Normalize-to-evidence flow passes without golden special casing; partial configuration fails closed.

## P2-H — Progress and evidence

- **Status:** `[x]`
- **Reason:** Support percentages do not tell learners what evidence exists or what to do next.
- **Scope:** Evidence ladder, recent misconceptions, practice recommendation, retention-not-observed state.
- **Acceptance:** No unsupported mastery claim; next action is explicit.
- **Verification:** Active and empty dashboard states pass axe and responsive browser gates; exact adaptive percentages remain available to assistive technology but are not presented as grades.
- **Product distinction:** The dashboard now replaces generic XP, streak, and leaderboard patterns with a current protocol, evidence ledger, lowest-evidence-first observation map, and explicit inference boundary.

## P1-I — Landing and repository presentation

- **Status:** `[x]`
- **Reason:** The landing page explained the workflow but did not show the product interaction; the README had no current product imagery.
- **Scope:** Concrete learning preview, animated observable-method diagram, research and evidence-boundary sections, reproducible landing/dashboard screenshots, README product tour.
- **Acceptance:** Product value is visible above the fold; screenshots come from the production browser suite and regenerate deterministically.
- **Verification:** The landing and application workspace now use separate shells; the README captures both real production states.

## P1-J — Global product search

- **Status:** `[x]`
- **Reason:** The application header advertised search and `Command-K`, but the control was non-interactive.
- **Scope:** Server-sanitized lesson index, global command palette, page/lesson/concept matching, desktop and mobile triggers, keyboard navigation, focus restoration, and an honest empty state.
- **Privacy boundary:** Only lesson IDs, titles, tracks, descriptions, and concept labels cross the server/client boundary; answer specifications, solutions, hints, and misconceptions remain server-owned.
- **Acceptance:** `Command/Ctrl-K` opens search; Arrow keys and Enter navigate; Escape restores focus; mobile has an equivalent trigger; no static runtime-readiness claim appears in the shell.
- **Verification:** Browser flow covers desktop and mobile search, concept matching, empty/reset state, shortcut opening, route navigation, Escape close, and trigger focus restoration.
