<!--
  PR 5 of 5 — the stack's tip. Open via:
    gh pr create --base v2/lesson-canvas --head v2/last-mile \
      --title "Last mile: the energy language reaches every surface, and stops at one door" \
      --body-file docs/pr/5-last-mile/PR_BODY.md
  Images are raw URLs into the v2/sites branch (GitHub does not resolve
  repo-relative image paths in PR bodies); v2/sites must be pushed and kept.
-->

> **Stack: PR 5 of 5** — base `v2/lesson-canvas`. When PR 4 merges and its branch is deleted, GitHub retargets this PR to `main` automatically. See [the stack map](https://github.com/metaforismo/Museion/blob/v2/sites/docs/pr/README.md) for the whole picture.

This PR ends the design programme. Three zones had never received the energy language — the public judge demo, the Source Studio, and the onboarding tour — which left the product's *first-seen* surfaces as its flattest. Eight product commits close that gap, and the close is asymmetric on purpose: the demo a judge opens first gets the full grammar, while the one room where the product measures unassisted work gets *less* styling than it had before. Presentation only throughout: engine modules, session semantics, evidence recording, and leak gates are untouched — the only `src/lib` changes are a new dependency-free constant (`judge/subject.ts`) and accent/zone exports in `design/zones.ts`.

Spec: [`docs/superpowers/specs/2026-07-26-last-mile-energy-design.md`](https://github.com/metaforismo/Museion/blob/v2/sites/docs/superpowers/specs/2026-07-26-last-mile-energy-design.md)

*Range note, stated rather than hidden: the history is one linear line, so this PR's commit list also carries three earlier `docs/pr`-only commits (the package restructure into a stacked-PR set). They touch no product code; the product diff is the eight commits above them.*

## The judge canvas

![Judge demo mid-flow](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/5-last-mile/annotated/judge-demo-1440.png)

1. The sample's subject supplies the accent — CS violet, derived, not decorative
2. Progress carries the subject accent; the counter sits on the type scale
3. Check is a subject-accent press — the same key grammar as the app behind the gate

The public demo ("no account needed · answers checked by code") now speaks the product's grammar: `/judge` and `/learn` join the learn zone deliberately, the sample lesson washes in its own subject tint, Continue and every Check are subject-accent presses, and checked outcomes follow the canvas rules exactly — correct blooms reserved green, wrong shakes with the key deflated through the beat, and rejected/invalid actions stay a neutral note because reserved colours mark engine verdicts only. Maia appears exactly once, beside the deterministic tutor's live intervention, named and posed from the same state.

**The locked transfer got *more* austere, not less.** During the one-attempt unassisted check there is no Pressable, no Maia, no subject accent, no animation — and the old bespoke blur shadow was deleted, because a flat card should not claim to float. The energy language stops at the gate on purpose: an unassisted check that *feels* assisted would corrupt the strongest measurement the product records. This constraint was verified end-to-end during review, twice — once in phase A, once in the round's final adversarial pass.

## The Source Studio and the tour

![The studio spine](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/5-last-mile/annotated/studio-spine-1440.png)

1. The gating action is a real press, not a bare text link
2. A satisfied stage speaks the studio accent — a precondition never wears correct-green
3. The current stage stands in the licensed halo — the trail's node grammar at pipeline scale

The studio's three compiler stages become a **horizontal** spine — the vertical trail's documented sibling. The trail draws places on a learning path; the spine draws stages of a machine, reading left to right the way the compiler runs, so it borrows the trail's node grammar (44px settled checks, 56px current stage in the licensed halo, ground-thick rail filling only behind satisfied stages) without borrowing its shape. Compile takes the studio's one full-fill press and holds `.pressable-held` while the compiler runs; Normalize steps down to the secondary key once a document exists; `Check connection` stops being a text link where it is in fact the gating action.

Two honesty fixes surfaced here and became a documented rule (**a satisfied precondition is not a verdict**): the old rail marked complete form steps in correct-green, and this PR's review pass swept the same pattern out of the draft-status dot and the attached-file card — green now enters the studio only with engine-checked results, and Compile is never drawn "done" because a finished compile navigates away before the claim could be true.

![The onboarding tour](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/5-last-mile/annotated/onboarding-tour-1440.png)

1. A chosen posture holds lapis-dark on lapis-soft above the deep edge
2. The tour's forward key presses in lapis — the first minute speaks the product's grammar

The tour — the product's first minute, previously its flattest screen — adopts the press grammar: Next in lapis on its deep edge, choice chips as pressable keys, Skip deliberately kept a quiet text action so leaving is not weighted like advancing. Copy untouched, including the "does not certify mastery" line.

## Close-out

- `DESIGN_SYSTEM_V2.md` now reads as the finished system: complete press-grammar coverage, the spine as the trail's sibling, the judge austerity rule and its reasoning, the precondition-is-not-a-verdict rule, and the one remaining type-scale allowlist entry (`LandingCoursePreview`, the landing's miniature of the product) explained as a content decision rather than debt. Both ratchet allowlists are down to that single shared entry.
- A final adversarial review of the whole round found **no defects** against the binding constraints; its three loose threads (a hand-written Maia accessible name, the two green-precondition stragglers) are fixed in-range.
- Product screenshots regenerated against a production build; the judge demo joins the canonical capture set.

## Verification

- `npm test` at this tip: **593 passed / 17 skipped** (up from 591 / 17 at the base). Lint clean. Typecheck 0 errors. Verified in a fresh worktree with a clean `npm ci` — the same discipline as the other four tips.
- All new colour pairs recomputed with the repo's WCAG math: white/CS 7.10, CS on violet tint 6.42, white/correct 5.71, wrong on wrong-soft 5.75, white/studio accent 6.13, studio accent on peach 5.51, lapis-dark on lapis-soft 8.63 — plus the unclaimed pairs (spine labels on the wash, ink-soft on tints) all above 4.5:1.
- Reduced motion honoured on every new animation (bloom, shake, halo, progress transition); the wrong-beat key release is timer-driven precisely so reduced motion cannot leave the key stuck down. 44px floors on every new interactive element.
- CI has not run on any of this (nothing is pushed during the freeze); expected green like the rest of the stack — see `docs/pr/EXECUTE.md`.
