# Local change map

All work in this audit remains local and uncommitted. This map groups files into coherent future review units; it does not authorize staging, commits, pushes, pull requests, deployment, or submission.

## Future review unit 1 — Visual system and learner navigation

- `src/app/globals.css`
- `src/components/SiteHeader.tsx`
- `src/components/SiteShell.tsx`
- `src/components/AppSidebar.tsx`
- `src/app/page.tsx`
- `src/components/LandingCoursePreview.tsx`
- `src/components/ScientificMethodDiagram.tsx`
- Related browser assertions and before/after screenshots

## Future review unit 2 — Activity-first lesson and Maia shell

- `src/components/LessonPlayer.tsx`
- `src/components/MaiaPanel.tsx`
- Lesson/Maia browser tests

## Future review unit 3 — Generated learner experience

- `src/components/JudgeExperience.tsx`
- `src/lib/compiler/schemas/course-artifact.ts`
- `src/lib/compiler/providers/openai.ts`
- `tests/course-artifact.test.ts`
- Response-kind controls, duplicate checkpoint fix, and publication renderability gates

## Future review unit 4 — Creator architecture

- `src/components/SourceCreator.tsx`
- Future creator hooks and focused components
- Creator draft/compiler tests

## Future review unit 5 — Review and evidence

- `src/app/progress/page.tsx`
- `src/app/progress/loading.tsx`
- Scientific learning protocol, evidence ledger, and observation-map states
- `src/app/create/review/page.tsx`
- `src/app/create/review/[runId]/page.tsx`
- Review browser tests

## Future review unit 6 — Audit documentation

- `docs/improvement-audit/VISUAL_AUDIT.md`
- `docs/improvement-audit/FEATURE_AND_EDGE_CASE_AUDIT.md`
- `docs/improvement-audit/CLEAN_CODE_AUDIT.md`
- `docs/improvement-audit/IMPLEMENTATION_PLAN.md`
- `docs/improvement-audit/VERIFICATION_LOG.md`
- `docs/improvement-audit/CHANGE_MAP.md`

## Future review unit 7 — Repository product tour

- `README.md`
- `docs/assets/screenshots/landing-desktop.png`
- `docs/assets/screenshots/dashboard-desktop.png`
- `scripts/verify-ui.mjs` screenshot generation and regression assertions
