<!--
  PR 4 of 4 — the stack's tip. Open via:
    gh pr create --base v2/energy --head v2/lesson-canvas \
      --title "Lesson canvas: the press grammar reaches the canvas, and the loop closes" \
      --body-file docs/pr/4-lesson-canvas/PR_BODY.md
  Images are raw URLs into the v2/sites branch (GitHub does not resolve
  repo-relative image paths in PR bodies); v2/sites must be pushed and kept.
-->

> **Stack: PR 4 of 4** — base `v2/energy`. When PR 3 merges and its branch is deleted, GitHub retargets this PR to `main` automatically. This tip is where the whole stack goes green: it carries the fixes for both long-standing CI blockers. See [the stack map](https://github.com/metaforismo/Museion/blob/v2/sites/docs/pr/README.md) for the whole picture.

The canvas is where Museion's claims are enforced — deterministic checks, misconception surfacing, leak gates, the locked transfer. This PR — 16 commits — brings the energy language (PR 3) inside it as **presentation only**: engine modules, session semantics, evidence recording, and gating logic are untouched, and the diff shows zero changes to the Judge canvas files. It also closes the learning loop (finish a lesson, watch the trail fill), ships the PR tooling behind these bodies, and lands four fixes that deserve to be read on their own.

Spec: [`docs/superpowers/specs/2026-07-25-lesson-canvas-energy-design.md`](https://github.com/metaforismo/Museion/blob/v2/sites/docs/superpowers/specs/2026-07-25-lesson-canvas-energy-design.md)

## Four fixes worth naming

**Multiple-choice answers could never name their misconception (`57b5e4f`).** The UI submits the option *index*; `verify()` accepts an index for correctness on purpose; but `matchMisconception` compared that raw index against the authored trigger *text*. All 63 authored multiple-choice steps carry misconceptions — not one could ever fire. The engine checked the move and then had nothing to name: half of the product's central claim, silently off. The fix resolves the index back to its option text before matching; correctness is untouched; 4 regression tests pin it. Found while seeding the screenshots below — the wrong-answer captures in earlier rounds had to use numeric steps, and now you can see why.

**The dangling `sites-vite-plugin` import (`7a4a456`).** `vite.config.ts` imported `./build/sites-vite-plugin` — gitignored, never committed, contents unrecoverable. Rather than reconstructing it and passing that off as the original, the fix *proves* nothing depended on it: a no-op stand-in build and an import-removed build produce an identical 146-file `dist`. Every job it plausibly held is owned elsewhere (security headers in `worker/index.ts`, OG image as a static asset, D1/R2 bindings from `cloudflare()`, Codex stubbing inline in the same config). Typecheck: 1 error → 0.

**CI Typecheck red on `main` since Build Week (`dd47c0e`).** The root tsconfig swept `video/` into the app project; CI never installs its dependencies, so every run failed on three missing-module errors — invisible locally only because `video/node_modules` happens to exist here. `video/` is a finished deliverable (the Build Week demo, already produced for the submission and YouTube), so it is excluded from the app's type gate. Verified by hiding `video/node_modules` to reproduce CI: 0 errors.

**The flaky `compiler-runs` test (`3c73289`).** Root-caused, not retried into submission: the bounded-jobs test runs 220 sequential golden compiles inside a 30s budget sized for an idle machine; under full-suite CPU contention it cannot fit. Reproduced deterministically with an 8-way load harness (failed on run 1), fixed with condition-based waits and generous backstops, then verified 4/4 under the same harness.

## The canvas work

![Checked-wrong beat](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/4-lesson-canvas/annotated/lesson-wrong-1440.png)

1. Check is a subject-accent press — the key the engine answers
2. Checked by code, not by a model — wrong keeps its honest copy
3. Warm gold retry press; help stays quieter

![Completion beat](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/4-lesson-canvas/annotated/completion-1440.png)

1. The observation leads: the exact session counts the engine recorded
2. Completion is not mastery — the caveat ships with the beat
3. One full-accent press back to the trail, carrying the arrival
4. Maia celebrating — live only at verified moments

![The trail after one completion — the loop's landing](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/4-lesson-canvas/annotated/trail-progress-1440.png)

1. Done node and accent rail — walked ground from the real record
2. The current lesson keeps the full card and the one loud press
3. Maia at the frontier of the record

![The board at 390](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/4-lesson-canvas/annotated/trail-progress-390.png)

![Course complete — the crown](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/4-lesson-canvas/annotated/trail-complete-1440.png)

1. The crown — course completion is an engine-checked fact
2. Every node filled, the whole rail accent: all walked ground

Key decisions:

- **Correct-green is reserved for engine-checked outcomes.** The checked-correct surface blooms full green; every decorative green in the canvas was removed — Maia's idle status dots, the code lab's traffic-light window chrome, a trace line that printed green regardless of correctness, because a run that stops says nothing about being right.
- **The key stays down while the engine decides** (`pressable-held`), and checked-wrong keeps it deflated through the shake beat — released by a timer, not `animationend`, because reduced motion suppresses the animation and an event-driven release would leave the key stuck down forever.
- **Completion leads with the observation** — the exact session counts (first-try/steps, attempts, hints), then the word-for-word caveat that completion is not mastery. Zero copy changes.
- **The primary press returns to the trail, and the old "continue to next lesson" shortcut was removed** — the loop's payoff is watching the ground move. The course page validates `?completed=` **server-side against the real record** (a hand-typed URL for an uncompleted lesson animates nothing), plays the arrival in record order — arriving segment draws, node fills, departing segment traces on toward the new current node — then strips the param after one read. The next lesson is one press away at the node the animation just drew the eye toward.
- **The board:** 64px current / 52px other nodes inside the same 72px cells (centres unchanged, so connector geometry needs no measuring), 8–9px rail, done/ahead rows title-only, and exactly one tab stop per lesson row — the circle went presentational; the press carries `aria-current="step"` and the sr-only position.
- **The locked transfer stays stripped** — walked end-to-end and screenshotted during review: no Maia, no press grammar, no celebration during the attempt.
- **The PR tooling** (`scripts/annotate-screenshots.mjs`) drives real seeded learner states through the real UI — lessons completed by answering the authored steps, misconceptions registered by answering wrongly — then stamps production captures with numbered badges and legends anchored to live bounding boxes. Every image in these four PR bodies came from it.

## Verification

- `npm test` at this tip: **591 passed / 17 skipped** (up from 587 / 17 at the base; the misconception fix alone added 4 regression tests). Lint clean. **Typecheck: 0 errors** — verified both as-is and with `video/node_modules` hidden to reproduce CI.
- The arrival choreography was verified live: mid-flight frames at 0.12× playback show quiet circle, bloom, then the tracing curve; a hand-typed `?completed=` for an uncompleted lesson renders zero arrival classes; the param strips after one read; reduced-motion computed `animation-name` is `none` on all three.
- The canvas files leave both type-scale ratchet allowlists in-range; the allowlists now hold only the Judge canvas and `LandingCoursePreview`.
- Product screenshots regenerated against a production build (19 of 20 — see known-open).
- CI has not run on any of this (nothing is pushed during the freeze); with both blockers fixed at this tip, CI is *expected* green here, and that expectation is exactly what `docs/pr/EXECUTE.md` gates the merges on.

## Known-open items

- The `course-review-desktop` screenshot stays stale rather than faked: `/api/compiler/runs` serves only a ChatGPT Sites account actor, so that flow cannot complete locally. Regenerate from the deployment if it matters for the submission.
- Canvas minors, deferred on purpose: the multiple-choice *option* selection is lapis on every subject (only Check was specced subject-accent), and "Take a hint" remains a quiet gold outline — hints should not be the loudest thing on the card.
- Inherited from PR 2: algebra's sky tint vs the learn wash (3px-edge workaround in place), and the near-invisible crest wash on the palest tints.
