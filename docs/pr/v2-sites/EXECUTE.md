# Execution runbook — v2/sites → main (on or after 2026-08-12)

Everything in this file is **deliberately not executed yet**. The branch was
prepared during the hackathon judging freeze: nothing reaches `main`, GitHub,
Devpost or Vercel before **2026-08-12**. History is a single linear line (69 commits of
product work plus the PR-package commits) and must not be rewritten — this ships as **one PR** whose body
(`PR_BODY.md`, in this directory) presents the work as its three blocks.

## 0. The guard — run first, always

```sh
cd /Users/francescogiannicola/Desktop/YC/museion/Museion
[ "$(date +%Y%m%d)" -ge 20260812 ] || { echo "JUDGING FREEZE — do not push before 2026-08-12"; exit 1; }
git status --porcelain | grep -q . && { echo "Working tree not clean"; exit 1; }
git branch --show-current | grep -qx "v2/sites" || { echo "Not on v2/sites"; exit 1; }
```

## 1. Pre-push decision gate (needs Francesco once, before anything moves)

CI (`.github/workflows/ci.yml`) runs Lint → Typecheck → Test → audit → golden
fixtures → Build → bundle budgets, then the browser gates. Two **pre-existing**
problems mean the PR cannot go green without a decision — the standing rule is
merge-when-green, so resolve these first (both are additive commits on
`v2/sites`; no history rewriting):

1. ~~`build/sites-vite-plugin`~~ — **resolved** (7a4a456): the dangling import is gone, builds and `verify:sites` pass, typecheck is at 0 errors.
2. **CI Typecheck has been red on `main` since Build Week**: the root
   `tsconfig.json` includes `video/**`, whose dependencies are never installed
   in CI. Candidate one-liner: exclude `video` from the root tsconfig (it has
   its own toolchain), or install its deps in the workflow.

If the decision is to merge with known-red checks instead, that contradicts the
standing "autonomously once green" instruction — stop and ask, do not improvise.

Optional sanity pass locally:

```sh
npm test && npm run lint && npm run typecheck   # expect 591 passed / 17 skipped; 0 typecheck errors
```

## 2. Push

```sh
git push -u origin v2/sites
```

## 3. Open the PR

```sh
gh pr create \
  --base main --head v2/sites \
  --title "Museion v2: one design system, honest energy, and a lesson canvas that presses back" \
  --body-file docs/pr/v2-sites/PR_BODY.md
```

The body's images are raw URLs into `docs/pr/v2-sites/annotated/` **on the
v2/sites branch** (GitHub does not resolve repo-relative image paths in PR
bodies. They start resolving the moment step 2 completes).

## 4. Merge — autonomously, once green

```sh
gh pr checks --watch          # every check green, including the browser job
gh pr merge --merge           # merge commit: the 69-commit story is the point — do NOT squash or rebase
```

Do **not** delete the branch on merge (`--delete-branch` stays off): the PR
body's image URLs point at it. If you want to retire the branch later, first
edit the PR body replacing `/v2/sites/` with `/main/` in the raw URLs.

## 5. Post-merge, in this order (from the original plan)

1. **Publish the Site** — the ChatGPT Sites deployment (`npm run verify:sites`
   must pass first, which requires the plugin decision from step 1; then the
   usual `build:sites` + deploy flow). Vercel, if used, follows the same gate.
2. **Update docs** — README screenshots are already regenerated on this branch
   (`docs/assets/screenshots/`, 19 of 20; `course-review-desktop` is stale
   because the flow needs a ChatGPT Sites actor — regenerate it from the
   deployment if it matters for the submission).
3. **Devpost last** — only after the merged, deployed state is live, so every
   claim and screenshot on the submission page matches what a judge can open.

## Regenerating the annotated screenshots (if the UI moved since capture)

```sh
# Production server only — the dev badge pollutes captures. Plugin workaround
# documented in the header of scripts/annotate-screenshots.mjs.
npm run build && npx next start -p 3210 &
MUSEION_BASE_URL=http://localhost:3210 node scripts/annotate-screenshots.mjs
MUSEION_BASE_URL=http://localhost:3210 npm run screenshots
```
