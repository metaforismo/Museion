# UI / UX Audit — Final Review (2026-07-18)

Method: six parallel read-only reviews (visual design, UX/learning flow, bugs, architecture,
learning science, hackathon readiness), followed by direct verification of every load-bearing
finding and a full browser pass at 390×844, 768×1024, 1280×900 and 1440×1000 against the
production build at commit `29a9152`. Before-screenshots were captured for every primary route.

## Verdict

The information architecture, honesty discipline (no fake XP, no invented streaks) and copy are
already above hackathon bar. The visual layer is let down by a small number of root causes that
cascade everywhere, and two P0 UX breaks hide the product's best work from a first-time judge.

## P0 — visual

| ID | Finding | Evidence | Fix |
|---|---|---|---|
| V1 | No display typeface exists. `--font-display` and `--font-sans` both resolve to the system UI stack, so every "premium" heading renders as default system text. | `src/app/globals.css` (`--font-ui` only; no `next/font` import anywhere in `src/`) | Load a real display face + UI face via `next/font`, map to `--font-display` / `--font-sans`. |
| V2 | In-app utility screens borrow the marketing-hero type scale. Settings, Create, course pages use `text-5xl sm:text-6xl` H1s — a 60px headline on a settings pane. | `src/app/settings/page.tsx:9`, `src/components/SourceCreator.tsx:427`, `src/app/courses/[courseId]/page.tsx:33` | Define 3 heading tiers (marketing / app page / panel); cap in-app pages at the dashboard tier. |
| V3 | Internal AI codenames shown to learners: "GPT-5.6 Terra via Codex" in the Maia chat footer, "Luna/Terra/Sol compiler" in Creator copy, "Codex-backed pipeline" in Course Architect. | `src/components/MaiaPanel.tsx:160,262`, `src/components/SourceCreator.tsx:40-44,435-436`, `src/components/CourseArchitectPanel.tsx:31,66,130` | Learner surfaces show plain state ("Live guidance connected" / "Offline verified guidance"); codenames demoted to Settings-only disclosure. |

## P1 — visual

| ID | Finding | Evidence |
|---|---|---|
| V4 | 41 bespoke arbitrary `shadow-[…]` values, only 2 tokens defined. No elevation system. | repo-wide grep; e.g. `LandingCoursePreview.tsx:17`, `MaiaPanel.tsx:170,243` |
| V5 | Card overuse: 155 rounded-card occurrences; dashboard stacks 9 independently bordered/shadowed containers before fold-2. | `src/app/dashboard/page.tsx` |
| V6 | Lesson step card — the most-used surface — uses off-system `rounded-xl … shadow-sm`, unlike every other card. | `src/components/LessonPlayer.tsx:539` |
| V7 | Dark `bg-ink` panel used as generic wrapper for 4+ unrelated content types in-app (review sidebar, evidence ladder, course hero, settings). | `review/page.tsx:14`, `progress/page.tsx:25`, `courses/[courseId]/page.tsx:29` |
| V8 | Settings is an engineering console: raw stage→model routing table plus OAuth device-code UI dominating a consumer page. | `src/components/AiSettingsPanel.tsx:353-431` |
| V9 | Empty states under-designed relative to frequency: one identical 40×40 icon-tile pattern reused for every zero state, on a product whose pitch is "the record stays honestly empty". | `src/components/DashboardEmptyState.tsx` |
| V10 | Lesson canvas is mostly empty white space below a small step card; the learner activity does not read as the main focus. | before-screenshot `lesson-desktop.png` |

## P2 — visual

- Six distinct arbitrary card radii for one card concept; `--radius-card`/`--radius-control` tokens defined but ignored (`globals.css:5-6`).
- Mono-uppercase micro-labels are the sole hierarchy motif (52 `font-mono`, 26 uppercase-tracking labels) — reads as engineering dashboard.
- Landing preview's selected-answer style (`border-ink bg-ink`) doesn't match the real product's (`border-lapis bg-lapis-soft`) — `LandingCoursePreview.tsx:39` vs `LessonPlayer.tsx:882-886`.
- Decorative rotated-squircle course hero with no content meaning (`courses/[courseId]/page.tsx:38-40`).
- Course numbering duplicated with divergent order between sidebar and catalog.
- Ad hoc skeleton loaders; no shared primitive.
- No dark mode and no stated light-only decision.

## P0 — UX (verified directly)

| ID | Finding | Evidence |
|---|---|---|
| X1 | Onboarding is unreachable. `OnboardingRedirect` is exported but imported nowhere; the only inbound link to `/welcome` is at the bottom of `/about`. Every primary CTA bypasses the tour. | grep: `OnboardingRedirect` has zero importers |
| X2 | Onboarding preferences are captured and never used. `readLearningPreferences` has zero call sites; role/age/goal answers are a no-op. | grep: `readLearningPreferences` zero call sites |
| X3 | The keyless demo (`/judge`) dead-ends after transfer: only "Run again" and "Inspect provenance" — no path to dashboard or library for exactly the user the landing CTA converts. | `src/components/JudgeDeferredPanels.tsx:42` |

## P1 — UX (verified directly)

| ID | Finding | Evidence |
|---|---|---|
| X4 | Sticky mobile CTAs (`sticky bottom-3`) sit behind the fixed `bottom-0 z-30` mobile nav on the compile and judge-continue buttons; the Course Architect trigger already uses `bottom-20`, proving the collision was known. | `SourceCreator.tsx:770`, `JudgeExperience.tsx:282`, `SiteShell.tsx:26` |
| X5 | The same `JudgeExperience` component renders with full app chrome on `/judge` but focus chrome on `/learn/[runId]`. | `SiteShell.tsx:13-14` |
| X6 | The Museion Method is marketing-visible but not experience-visible: no phase label inside the lesson; the dashboard method strip hardcodes step 1 as active (`index === 0`), a live-looking tracker that never moves. | `LessonPlayer.tsx`, `dashboard/page.tsx:53` |
| X7 | README's method vocabulary (Ground→Predict→Interact→Diagnose→Explain→Transfer→Revisit) appears nowhere in `src/`; the landing diagram shows a different 5-step cycle with different names. | grep across `src/` |

## P2 — UX

- Sidebar labels diverge from page titles ("Evidence record" vs "Evidence", "Source studio" vs "Create a course").
- Two parallel lesson-player experiences (authored vs generated) with different tutor models and different visual languages.
- `/settings` has no learning-profile section; onboarding answers cannot be revisited.
- Review queue may read as spaced revisit; it is misconception-triggered only (Revisit is 0% implemented — keep the honest caveat visible).

## What must be preserved

- The honesty discipline: no fake statistics, no streaks, evidence boundaries stated everywhere.
- The next-action cascade in `src/lib/dashboard/snapshot.ts:147-161` — genuinely good logic.
- One-task-at-a-time lesson flow with retry/recovery affordances.
- Maia as secondary, non-blocking, leak-gated.
- The restrained editorial register of the landing copy.
