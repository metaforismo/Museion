<!--
  PR 3 of 4. Open via:
    gh pr create --base v2/design-system --head v2/energy \
      --title "Museion Energy: pressable depth and the course trail, honesty intact" \
      --body-file docs/pr/3-energy/PR_BODY.md
  Images are raw URLs into the v2/sites branch (GitHub does not resolve
  repo-relative image paths in PR bodies); v2/sites must be pushed and kept.
-->

> **Stack: PR 3 of 4** — base `v2/design-system`. When PR 2 merges and its branch is deleted, GitHub retargets this PR to `main` automatically. See [the stack map](https://github.com/metaforismo/Museion/blob/v2/sites/docs/pr/README.md) for the whole picture.

The unification pass (PR 2) made Museion coherent. It did not make it *desirable* — correct, calm, and forgettable. This PR — 10 commits — adopts the craft of Duolingo-class products (tactility, full-saturation moments, a path you stand on, a character that reacts) **without the manipulation**. The boundary does not move: no streaks, no XP, no leagues, no badges, no invented numbers, no guilt copy. Every number on screen is a real engine observation; urgency may only reflect the real review queue. The energy pass exists to make honesty feel good instead of feeling beige.

Spec: [`docs/superpowers/specs/2026-07-25-museion-energy-design.md`](https://github.com/metaforismo/Museion/blob/v2/sites/docs/superpowers/specs/2026-07-25-museion-energy-design.md)

![Dashboard at 1440 — the proving ground](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/3-energy/annotated/dashboard-1440.png)

1. One full-accent next move — pressable depth on a real recommendation
2. The review press appears only when the queue is real — a count, not guilt
3. Journey tiles count up to recorded values; zero-valued tiles stay hidden
4. Maia posed from the recommendation state

![Course trail, fresh — Forces and Motion](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/3-energy/annotated/trail-fresh-1440.png)

1. Current node — full subject accent with a breathing halo
2. Maia stands at the current node, posed from state
3. The row's single tab stop — a chunky subject press
4. Ahead rows stay quiet and open — recommended order, never a padlock

![Course trail at 390](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/3-energy/annotated/trail-fresh-390.png)

![Review with a seeded queue](https://raw.githubusercontent.com/metaforismo/Museion/v2/sites/docs/pr/3-energy/annotated/review-1440.png)

1. The queue length is the page's one honest urgency — counted up, never invented
2. The head of the queue takes the page's one warm gold press
3. The rest of the queue: pressable cards in the same gold family

*Capture honesty note: all annotated captures were taken once, at the tip of the full stack — the trail shots therefore show PR 4's fattened board (64px current node, thicker rail) on top of the trail this PR introduces.*

## Key decisions

- **Edge presses, blur floats.** The hard bottom edge (4px, a same-hue `deep` shade at accent × ~0.72, shipped as literals in the palette — components never compute colour) is the system-wide signature for "you can press this"; the blur ladder stays reserved for resting elevation. `Pressable` ships as button and link with one physics, defined once in `globals.css`, behind the global reduced-motion switch. The palette test asserts each deep shade is genuinely darker than its accent by relative luminance.
- **One full-fill element per view.** Tints stay the resting language; the page's primary action — and on a course page, the trail's current node — takes the full accent.
- **The trail is honest ground.** The course page's stacked lesson cards become a snaking path: done / current / ahead derive from the real record; ahead nodes are never padlocked, because Museion recommends order, it does not lock content; course completion crowns the final node from the real completion record. **Known limitation, on purpose: no per-lesson transfer flags** — that evidence is not derivable per-lesson for authored courses, so per the honesty boundary the path ships without them rather than faking them.
- **Juice with real numbers only.** Count-ups approach the record from below and land on it exactly — `countUpValue()` is pinned to never print a frame above the recorded value (instant under reduced motion; small targets arrive whole with a pop rather than printing a wrong 0). The review press carries the actual queue count in gold with ink text — white on gold fails contrast at 2.80:1, so the pair is baked into the variant and no caller can re-decide it. An empty queue gets nothing: no zero, no urgency.
- **The record travels.** The library warms a started course's card with its subject tint and marks completed map nodes with the trail's accent check; the evidence page gains the same four count-up tiles as the dashboard via a shared `JourneyStats`, so both surfaces read one record. Every caveat line unchanged.
- A review pass over the whole range closed its own findings (`b17c580`): Safari list-role restatement on the trail's `ol`, and `Pressable`'s primary variant now requires its accent/edge pair at the type level.

## Verification

- `npm test` at this tip: **587 passed / 17 skipped** (up from 537 / 17 at the base). Lint clean.
- Contrast pins in tests: white on all six subject accents (worst case 5.44:1), ink on gold 6.62:1 — and the 2.80:1 white-on-gold failure is the documented reason the pair exists.
- Reduced motion verified under emulation: presses, count-ups, and the trail's halo all land instantly in their finished state (unanimated styles *are* the finished state).
- 44px interactive floors pinned; one tab stop per trail row with full sr-only position/state.
- `DESIGN_SYSTEM_V2.md` updated in-range with the pressable-depth grammar, the path grammar (node states from the record, the no-padlock rule), and the count-up rule; product screenshots regenerated against a production build.
