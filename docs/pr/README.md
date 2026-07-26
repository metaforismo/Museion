# The v2 PR stack

The 86 unpushed commits on `v2/sites` ship as **five stacked PRs** instead of one giant one, so each block can be read — and its diff reviewed — on its own terms. The stacked branches are pointers at existing commits on the one linear history — no cherry-picks, and `v2/last-mile`'s tip is the last product commit, so nothing is orphaned. (The history was rebased once, locally and before any push, to move both CI build fixes to the tip of PR 1 so every tip typechecks clean; the final tree is byte-identical to the pre-rebase tip, kept at `backup/v2-sites-pre-rebase`.)

| # | PR (head → base) | Commits | Diff vs base | Tests at tip | Body |
|---|---|---|---|---|---|
| 1 | `v2/sites-runtime` → `main` | 4 | 67 files, +7481/−2428 | 387 / 17 skipped | [`1-sites-runtime/PR_BODY.md`](1-sites-runtime/PR_BODY.md) |
| 2 | `v2/design-system` → `v2/sites-runtime` | 47 | 106 files, +7071/−911 | 537 / 17 skipped | [`2-design-system/PR_BODY.md`](2-design-system/PR_BODY.md) |
| 3 | `v2/energy` → `v2/design-system` | 10 | 50 files, +1384/−174 | 587 / 17 skipped | [`3-energy/PR_BODY.md`](3-energy/PR_BODY.md) |
| 4 | `v2/lesson-canvas` → `v2/energy` | 14 | 57 files, +1626/−343 | 591 / 17 skipped | [`4-lesson-canvas/PR_BODY.md`](4-lesson-canvas/PR_BODY.md) |
| 5 | `v2/last-mile` → `v2/lesson-canvas` | 11 | 56 files, +932/−361 | 593 / 17 skipped | [`5-last-mile/PR_BODY.md`](5-last-mile/PR_BODY.md) |

(Test figures measured by checking out each tip in a fresh worktree with a clean `npm ci` and running `npm test`; `main` is at 381 / 17. Lint is clean at every tip.)

What each PR is:

1. **Sites runtime** — Museion as a private ChatGPT Site: Worker target via vinext, D1 + R2, per-owner isolation, Sign in with ChatGPT as the account boundary, daily quotas, security headers. No pixels change. Its tip commit clears both long-standing typecheck blockers (the dangling `sites-vite-plugin` import, `video/` swept into the root tsconfig), so CI is expected green from the first PR on.
2. **One design system** — the landing and app shell ran two palettes, two inks, two blues, two heading typefaces. Merged: contrast-verified subject accent+tint pairs, a five-step Inter scale with Fraunces retired, zone washes, shared primitives, rebuilt sidebar and dashboard, six re-laid surfaces, state-driven Maia.
3. **Museion Energy** — Duolingo-grade tactility with the honesty boundary intact: pressable depth, full-saturation moments, the snaking course trail, count-ups on real numbers, honest queue urgency. No streaks, no XP, no badges.
4. **Lesson canvas** — the press grammar inside the canvas (presentation only), the completion loop, the fattened board — plus the two fixes called out individually in its body (the multiple-choice misconception match, the flaky `compiler-runs` test).
5. **Last mile** — the energy language reaches the three untouched zones (judge demo, Source Studio, onboarding) and deliberately stops at one door: the locked transfer gets *more* austere. The studio's horizontal spine, the precondition-is-not-a-verdict rule, the finished-system design doc. Its commit list also carries the three `docs/pr`-only package-restructure commits below it on the line — no product code in them; its body says so.

## Merge order

Strictly 1 → 2 → 3 → 4 → 5, each with a merge commit, each head branch deleted on merge. Deleting a merged head branch makes GitHub retarget the next PR's base to `main` automatically — expected, not an accident. Every tip typechecks at 0 errors under CI conditions, so all five PRs are expected fully green — merge each once its checks pass. The full runbook, including the freeze-date guard, is [`EXECUTE.md`](EXECUTE.md); nothing in this directory executes anything.

## The images

The annotated captures were taken at the tip of the full stack, against a production build, by `scripts/annotate-screenshots.mjs` (real seeded learner records driven through the real UI). They are distributed to the PR whose work they primarily illustrate, each with a sidecar `.md` legend:

- **PR 1** — none, deliberately: runtime work, nothing visual to show.
- **PR 2** — `library-1440`, `dashboard-390` (the unified system at both widths).
- **PR 3** — `dashboard-1440`, `trail-fresh-1440`, `trail-fresh-390`, `review-1440` (pressable depth, the trail, the honest queue).
- **PR 4** — `lesson-wrong-1440`, `completion-1440`, `trail-progress-1440`, `trail-progress-390`, `trail-complete-1440` (the canvas beats and the loop's landing).
- **PR 5** — `judge-demo-1440`, `studio-spine-1440`, `onboarding-tour-1440` (the last three zones, in the grammar).

Because every capture is from the stack tip, shots placed with PR 2 and PR 3 also show later-PR polish (press depth, the fattened board); each body says so where it applies rather than pretending otherwise. PR 5's captures were taken at its own tip, which *is* the stack's product tip.

PR bodies embed these via raw URLs pinned to the **`v2/sites`** branch — GitHub does not resolve repo-relative image paths in PR bodies — so `v2/sites` must be pushed alongside the stack and must not be deleted after the merges (it also carries this package, which the stacked branches below PR 5 deliberately do not contain). To regenerate, run the script (it writes all captures to `docs/pr/annotated/` as a staging area, or set `MUSEION_ANNOTATED_DIR`) and redistribute per the list above.
