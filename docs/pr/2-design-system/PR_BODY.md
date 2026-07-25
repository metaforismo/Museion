<!--
  PR 2 of 4. Open via:
    gh pr create --base v2/sites-runtime --head v2/design-system \
      --title "One design system: merge the landing and the app into a single face" \
      --body-file docs/pr/2-design-system/PR_BODY.md
  Images are raw URLs into the v2/sites branch (GitHub does not resolve
  repo-relative image paths in PR bodies); v2/sites must be pushed and kept.
-->

> **Stack: PR 2 of 4** — base `v2/sites-runtime`. When PR 1 merges and its branch is deleted, GitHub retargets this PR to `main` automatically. See [the stack map](https://github.com/metaforismo/Museion/blob/v2/sites/docs/pr/README.md) for the whole picture.

Museion had two design systems and admitted neither: the landing and the app shell ran two palettes, two inks, two blues, and two heading typefaces. This PR — 47 commits — merges them into one, and re-lays the whole app shell on the result.

Spec: [`docs/superpowers/specs/2026-07-25-museion-visual-unification-design.md`](https://github.com/metaforismo/Museion/blob/v2/sites/docs/superpowers/specs/2026-07-25-museion-visual-unification-design.md)

![Library at 1440 — record-aware course grid on the unified system](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/2-design-system/annotated/library-1440.png)

1. A started course warms to its subject tint — the record leaves the door ajar
2. Real progress ring — 1 of 3 from the learner record, never invented

![Dashboard at 390 — the same system at phone width](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/2-design-system/annotated/dashboard-390.png)

1. Full-accent next move — pressable depth on a real recommendation
2. Real review count — never guilt
3. Journey tiles count up to recorded values only

*A capture honesty note: all annotated captures were taken once, at the tip of the full stack, against a production build — so these two also show PR 3's pressable depth and count-ups on top of this PR's work. They are here for what this PR built: the unified palette, the type scale, the washes, and the re-laid surfaces.*

## Key decisions

- **One face, one scale.** Fraunces is retired entirely; Inter carries display and body. The five-step type scale (`11/12/13/15/17px` + display steps) is enforced by a **shrinking ratchet test** — the allowlists of off-scale files may only get smaller, and within this PR they did (19 → 10). Form fields sit at 17px because iOS zooms a focused field under 16px.
- **Machine-checked colour.** Every subject gets an accent + tint pair, and every accent clears 4.5:1 on its own tint — pinned by `tests/design-palette.test.ts` and by a computed-contrast browser scan (canvas-composited, wash- and gradient-aware) across 9 routes × 2 widths: zero failures. `accentText` was deleted so the contrast rule is pinned to what actually renders.
- **Shared primitives.** `Card`, `Chip`, `ProgressRail`, `SectionHeader`, `StatTile` land under `src/components/ui/`, and dashboard, library, review, evidence, Source Studio, and settings are re-laid on them — so the same object never has two quieter twins. The sidebar is rebuilt with subject colour, visible states, and deterministic path ordering backed by a new progress endpoint.
- **Zone washes** give learn / create / account distinct grounds; an explicit tint keeps the account zone unwashed rather than double-washing it.
- **Maia is state-driven and still by default** — she appears from real state (recommendation, celebration at verified moments), never as page furniture.
- **Illustrated course-detail heroes** put each subject's clay objects on its own tint.

## Verification

- `npm test` at this tip: **537 passed / 17 skipped** (up from 387 / 17 at the base). Lint clean.
- Both ratchets (named off-scale sizes, rem literals) green at every commit; allowlists only ever shrank. Two attempted evasions of the type-scale ratchet were found and closed in-range (`08fced6`).
- The computed-contrast scan ran cold and with a seeded record, at 1440 and 390, across `/dashboard`, `/library`, `/progress`, `/review`, `/create`, `/settings`, two course pages, and a lesson — zero failures. It also caught real defects mid-branch (contrast and overflow, `ca728f5`), which is the point of having it.
- The dev CSP had to learn to run React's dev build (`8bf4741`) — dev-only, the production header set from PR 1 is untouched.
- Product screenshots under `docs/assets/screenshots/` regenerated in-range.

## Known-open (inherited by the rest of the stack)

- Algebra's sky tint nearly matches the learn-zone wash; worked around with a 3px accent edge on the course hero. A neutral learn wash is the real fix.
- The crest wash is invisible for the palest tints (CS violet, algebra sky), and arithmetic's `#fff2ad` is louder than the other five as a full-page wash.
- Ratchet allowlist survivors, by design at this tip: the Judge canvas files and `LandingCoursePreview` (the canvas files are delisted later, in PR 4).
- This PR's Typecheck check in CI is expected red for the two pre-existing causes fixed in PR 4 (dangling `build/sites-vite-plugin` import, `video/` swept into the root tsconfig) — see `docs/pr/EXECUTE.md`.
