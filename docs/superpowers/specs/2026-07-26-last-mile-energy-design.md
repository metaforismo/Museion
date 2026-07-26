# Last mile — energy reaches the whole product

Date: 2026-07-26
Branch: `v2/sites`
Status: approved (Francesco chose the full scope in one round).
Sequel to the visual-unification, energy and lesson-canvas rounds.

## Why this round exists

The energy vocabulary — pressable depth, subject accent+tint, zone washes, honest
juice — now covers the app shell, the course trail and the lesson canvas. Three
zones never received it, and a grep is unambiguous: `JudgeExperience`,
`JudgeDeferredPanels`, `SourceCreator`, `CourseArchitectPanel`, `SourcePackEditor`
and `OnboardingTour` contain **zero** `Pressable` and **zero** subject-colour calls.

The result is inverted from where we started. The app used to trail the landing;
now the demo trails the app. Judge Mode is a flat blue slab on plain paper while
the course behind it has a snaking trail with depth.

## Scope: everything left, executed in constraint order

One round, three phases, deliberately sequenced so the most constrained surface is
never touched by the same pass as the freest.

### Phase A — Judge Mode (most constrained)

`src/components/JudgeExperience.tsx`, `src/components/JudgeDeferredPanels.tsx`.

This is the public demo: "SAMPLE LESSON · No account needed · answers checked by
code", reached from the landing's *Try a lesson*. It is very likely the first thing
a hackathon judge opens.

- `Continue` / `Check` become subject-accent `Pressable`s. The sample lesson is
  binary search — Computer Science — so the surface earns violet, not generic lapis.
- The progress bar takes the subject accent; the block counter joins the type scale.
- Zone wash for the judge route, consistent with `zoneForPath`.
- Checked-correct and checked-wrong follow the canvas grammar exactly: correct-green
  bloom, wrong shake with the edge collapsing. Same tokens, same reserved meanings.
- Maia may appear only where she is live or genuinely stateful, per the presence
  rule — **and never during the locked transfer**.

**The locked transfer stays austere. This is absolute.** During the attempt there is
no Maia, no hints, no press celebration, no accent encouragement: a flat card, the
`LOCKED · ONE ATTEMPT / Maia 0 · hints 0 · solutions 0` ledger, a plain input, a
plain submit. The energy language must not make an unassisted check feel assisted —
that would corrupt the one measurement the product treats as strongest evidence.
Post-verdict feedback follows the normal checked rules.

### Phase B — Source Studio and onboarding (freest)

`SourceCreator.tsx`, `CourseArchitectPanel.tsx`, `source-creator/SourcePackEditor.tsx`,
`OnboardingTour.tsx`.

- The three-step rail (Source → Learning design → Compile) becomes a real progress
  spine in the studio's peach accent, with the active step unmistakable.
- Primary actions become `Pressable`s; `Check connection` stops being a bare text
  link where it is in fact the gating action.
- Compile is the studio's loudest moment and takes the one full-fill press; the
  `.pressable-held` state already exists for work the engine is still deciding about.
- Onboarding: the Next/Back/Skip row and the choice groups adopt the press grammar.
  It is the first minute of the product and currently the flattest screen in it.

### Phase C — close-out

Both type-scale allowlists empty except anything a deliberate content decision keeps.
Design doc updated. Screenshots regenerated against a production server. PR package
refreshed: this round becomes **PR 5** on the stack, based on `v2/lesson-canvas`.

## Binding constraints — unchanged

- Type scale: `text-micro` 11 / `text-label` 12 / `text-body-sm` 13 / `text-body` 15
  / `text-lead` 17, plus `text-lg`+ for display. Form fields take `lead` (iOS zoom floor).
- Subject colour only via `subjectColor()` / `subjectTint()` / `subjectDeep()`.
- Blur shadows = elevation; the hard edge = pressability. Nothing else.
- White text only on full accent fills; ink on tints and on gold. Verify new pairs
  with `contrastRatio`.
- **No gamification.** No streaks, XP, badges, or counters implying mastery. Urgency
  only from the real record. Celebration only for engine-checked outcomes.
- Engine, session semantics, evidence recording, leak gates: presentation only.
- 44px targets, visible focus, `prefers-reduced-motion` on every new animation.
- **No push before 2026-08-12.**

## Verification

Full suite green (591 at round start), lint clean, 0 typecheck errors, both ratchets
green. Screenshot-driven iteration at 1440 and 390 on: the judge sample lesson mid-flow,
a wrong check, a correct check, **the locked transfer (verified still austere)**,
Source Studio at each of its three steps, and the onboarding tour.
