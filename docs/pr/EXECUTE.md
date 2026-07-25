# Execution runbook — the v2 stack → main (on or after 2026-08-12)

Everything in this file is **deliberately not executed yet**. The work was prepared during the hackathon judging freeze: nothing reaches `main`, GitHub, Devpost, or Vercel before **2026-08-12**. The 76 commits ship as **four stacked PRs** (see `README.md` in this directory); history is one linear line and must not be rewritten.

## 0. The guard — run first, always

```sh
cd /Users/francescogiannicola/Desktop/YC/museion/Museion
[ "$(date +%Y%m%d)" -ge 20260812 ] || { echo "JUDGING FREEZE — do not push before 2026-08-12"; exit 1; }
git status --porcelain | grep -q . && { echo "Working tree not clean"; exit 1; }
git branch --show-current | grep -qx "v2/sites" || { echo "Not on v2/sites"; exit 1; }
```

## 1. Optional local sanity pass

Both blockers that used to sit in this file are **fixed in the stack itself** (PR 4: `7a4a456` removes the dangling `sites-vite-plugin` import; `dd47c0e` takes `video/` out of the app's typecheck). There is no pre-push decision gate anymore. If you want to re-verify:

```sh
npm test           # expect 591 passed / 17 skipped at this tip
npm run lint
npm run typecheck  # expect 0 errors
```

Per-tip figures, all measured locally during preparation: `main` 381/17 → PR 1 tip 387/17 → PR 2 tip 537/17 → PR 3 tip 587/17 → PR 4 tip 591/17. Lint clean at every tip.

## 2. Push — the four stack branches, plus `v2/sites` for the images

```sh
git push -u origin v2/sites-runtime v2/design-system v2/energy v2/lesson-canvas v2/sites
```

`v2/sites` is not the head of any PR, but every PR body embeds its images as raw URLs into `docs/pr/*/annotated/` **on `v2/sites`** (GitHub does not resolve repo-relative image paths in PR bodies). The images start resolving the moment this push completes, and `v2/sites` must not be deleted afterwards.

## 3. Open the four PRs — each with its own base

```sh
gh pr create --base main --head v2/sites-runtime \
  --title "Sites runtime: run Museion as a private ChatGPT Site" \
  --body-file docs/pr/1-sites-runtime/PR_BODY.md

gh pr create --base v2/sites-runtime --head v2/design-system \
  --title "One design system: merge the landing and the app into a single face" \
  --body-file docs/pr/2-design-system/PR_BODY.md

gh pr create --base v2/design-system --head v2/energy \
  --title "Museion Energy: pressable depth and the course trail, honesty intact" \
  --body-file docs/pr/3-energy/PR_BODY.md

gh pr create --base v2/energy --head v2/lesson-canvas \
  --title "Lesson canvas: the press grammar reaches the canvas, and the loop closes" \
  --body-file docs/pr/4-lesson-canvas/PR_BODY.md
```

The bases matter: they make each PR's diff exactly its own range.

## 4. What to expect from CI, honestly

Nothing here has run in CI (nothing was pushed during the freeze). What was verified locally: tests and lint green at all four tips, typecheck 0 errors at the PR 4 tip — including with `video/node_modules` hidden to reproduce CI's environment.

- **PR 4's checks are expected fully green**, and so is `main` after the final merge — both former blockers are fixed at that tip.
- **PRs 1–3 are expected to fail the Typecheck step**, for exactly the two known causes fixed in PR 4: `video/` swept into the root tsconfig (red on `main` since Build Week — these tips merely inherit it), and the dangling `./build/sites-vite-plugin` import (PRs 1–3 tips predate its removal). Everything else — lint, tests, audit, golden fixtures, build, bundle budgets, the browser job — is expected green on all four.

## 5. Merge — strictly in stack order

The standing rule: **merge autonomously once green; stop and ask rather than merge red.** Applied to this stack:

- The intermediate tips' expected-red Typecheck (step 4) is a *known* red with its fix already in the stack — but it is still red. **Present it to Francesco once, before merging PR 1**: the honest options are (a) merge PRs 1–3 acknowledging that one known-red check, since the stack's final state is verified clean, or (b) whatever arrangement he prefers instead. Do not improvise a third option, and do not silently merge a red check without that ack.
- Any *other* red — a check failing for a reason not named in step 4 — means stop and ask, full stop.

Then, in order, for each PR 1 → 4:

```sh
gh pr checks <n> --watch
gh pr merge <n> --merge --delete-branch   # merge commit: the commit story is the point — do NOT squash or rebase
```

**`--delete-branch` is load-bearing, and nothing to panic about:** when PR *n*'s head branch is deleted on merge, GitHub automatically retargets PR *n+1*'s base from that branch to `main`. That retarget is the mechanism that keeps the stack correct — after it, PR *n+1*'s diff is still exactly its own range (the commits below it are already on `main`). No rebasing, no force-pushing, no pointer surgery is ever needed.

Do **not** delete `v2/sites` at any point — the PR bodies' image URLs point at it, and it carries this PR package (which the four stacked branches deliberately do not contain).

## 6. Post-merge, in this order

1. **Publish the Site** — `npm run verify:sites` passes at the tip; then the usual `build:sites` + deploy flow. Vercel, if used, follows the same gate.
2. **Update docs** — README screenshots are already regenerated on the branch (`docs/assets/screenshots/`, 19 of 20; `course-review-desktop` is stale because its flow needs a ChatGPT Sites account actor — regenerate it from the deployment if it matters for the submission).
3. **Devpost last** — only after the merged, deployed state is live, so every claim and screenshot on the submission page matches what a judge can open.

## Regenerating the annotated screenshots (only if the UI moved since capture)

```sh
# Production server only — the dev badge pollutes captures.
npm run build && npx next start -p 3210 &
MUSEION_BASE_URL=http://localhost:3210 node scripts/annotate-screenshots.mjs
MUSEION_BASE_URL=http://localhost:3210 npm run screenshots
```

The script stages all captures into `docs/pr/annotated/`; redistribute them into the per-PR `annotated/` directories per the map in `README.md`.
