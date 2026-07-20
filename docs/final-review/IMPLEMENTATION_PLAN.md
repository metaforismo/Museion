# Implementation Plan — Final Review (2026-07-18)

Sources: UI_UX_AUDIT.md, BUG_AND_EDGE_CASE_AUDIT.md, CLEAN_CODE_AUDIT.md, learning-science and
hackathon-readiness reviews. Every item below maps to a verified finding.

Judging areas: technological implementation · design · potential impact · quality of the idea.

## P0 — must ship

### Design system root causes
- [ ] Real typography: display serif + UI sans via `next/font`, mapped to `--font-display` /
      `--font-sans`; three-tier heading scale (marketing hero / app page title / panel title);
      in-app pages capped at the app tier. (V1, V2)
- [ ] Elevation and radius tokens: collapse 41 bespoke shadows to 3 tokens; unify card radii;
      shared card classes in `globals.css`. (V4, V6, V10-radii)
- [ ] Remove learner-facing AI codenames; plain-language runtime states; codenames live in
      Settings advanced disclosure only. (V3)

### Landing page
- [ ] Rebuild hero + interactive learning-trace effect showing the real method: source →
      prediction → wrong answer → Maia question + highlight → correction → independent evidence.
      Step-driven, reduced-motion safe, mobile-first. Unify method vocabulary with the product.
      (X7, memorable-effect requirement)

### Dashboard + sidebar
- [ ] Compact learning-mission next-action card: course, next lesson, reason, progress, evidence
      still needed, one button, small Maia state. Reduce container count above the fold. (V5)
- [ ] Sidebar IA: LEARN (Home, Library, Review) / YOUR WORK (My courses, Source Studio, Evidence)
      / PATHS (active + view all) / bottom (Maia status, Settings, Collapse). Align labels with
      page titles. (X-labels)
- [ ] Method strip reflects real learner state or stops looking live. (X6)

### Learning experience
- [ ] Museion Method phase labels inside the lesson player (Ground/Predict/Interact/Diagnose/
      Explain/Transfer vocabulary, one consistent set across README, landing, product). (X6, X7)
- [ ] Lesson canvas rebalanced: activity is the visual center; step card on-system. (V10, V6)

### Onboarding
- [ ] Mount onboarding for first-time users; short useful questions; preferences actually select
      the first course and personalize the dashboard next-action copy. (X1, X2)

### Keyless demo path
- [ ] `/judge` completion bridges to dashboard/library; `/judge` uses focus chrome like
      `/learn/[runId]`. (X3, X5)
- [ ] Fix sticky mobile CTAs hidden behind the bottom nav. (X4)

### Flagship interaction
- [ ] Function Transformation Lab as a new deterministic `graph` answer kind inside the existing
      engine: target curve rendered from authored params; learner adjusts a/h/k via drag,
      keyboard and numeric inputs; verifier checks parameters; authored misconceptions catch
      wrong-shift-sign, wrong-vertical-shift, wrong-scale; hint ladder + Maia integration come
      free from the existing pipeline. Tested at engine and content level.

### Honesty fixes (learning science)
- [ ] Refresh stale counts: `docs/CURRICULUM_ARCHITECTURE.md` (11/2 → 23/6),
      `docs/EVALS.md` + `docs/build-week/DEVPOST_DRAFT.md` test counts.
- [ ] Reconcile "visible learning protocol" claim by making it actually visible (phase labels).
- [ ] `docs/CODEX_USAGE.md` stale "must be added before submission" line resolved.

### Bugs
- [ ] Fix and test P0/P1 items from BUG_AND_EDGE_CASE_AUDIT.md.

## P1 — should ship

- [ ] Shared `postJson` + error dictionaries; judge flow gets a timeout. (clean code)
- [ ] Extract `CompletionScreen` / `AnswerControl` from LessonPlayer.
- [ ] Settings: plain-language default view; engineering console behind an Advanced disclosure;
      learning-profile section to revisit onboarding answers. (V8)
- [ ] Empty-state upgrade: Maia moment + "why this is empty" micro-explainer. (V9)
- [ ] Mascot upgrade: better-crafted Maia with subtle interactive states (no constant motion).
- [ ] Course Architect chat: agent evaluates whether provided material is sufficient before
      compiling; clear stage progress. (build on existing panel + PR #10 — do not duplicate its
      multi-material editor work)
- [ ] README: thesis, best screenshot early, method, impact section, direct keyless-demo CTA,
      Codex/GPT-5.6 usage, honest limitations, /feedback Session ID instructions.
- [ ] Regenerate all screenshots at final UI.
- [ ] Course-authoring docs list all six courses.

## Later (recorded, not attempted now)

- Recursive coding lab (second wow interaction).
- Spaced revisit scheduler (Revisit stays honestly labelled as not implemented).
- Full LessonPlayer/SourceCreator hook decomposition; `store.ts` behind `StateBackend`.
- DOM test environment for client components.
- Dark mode.
- Supabase-backed learner sessions; deployment.
- Per-client MCP identities, revocable tokens.

## Out of scope guards

- PR #10 (editable multi-material Source Packs) is open — its Source Pack editor work is not
  rebuilt here.
- No fake data anywhere: all dashboard numbers remain real.
- Backend logic is not changed for visual reasons.
