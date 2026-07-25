# Design system V2

Museion has one visual system. The illustrated landing and the working app draw
from the same tokens, the same type scale and the same elevation ladder, so a
learner who arrives from the marketing page recognises the product they were
promised. Anything that exists in only one of the two — a private palette, a
second display family, a bespoke shadow — is drift, and drift is what this
system exists to prevent.

The character of the system is *warm instrument*: paper canvas, white working
surfaces, one blue for decisions, one gold for attention, green and red only for
outcomes the engine actually checked, and a saturated-but-soft tint per subject
so a page can carry colour without carrying claims. It is calm because the
content is demanding, not because colour is suspect.

## The one token set

Everything is declared once, in `src/app/globals.css`, inside `@theme`. There is
no second palette. `tests/design-tokens.test.ts` asserts the CSS matches
`src/lib/design/palette.ts` value for value, and that `landing.module.css` no
longer declares a private `--landing-*` palette or its own heading family.

| Role | Token | Value |
| --- | --- | --- |
| Canvas | `--color-paper` | `#f7f5f0` |
| Working surface | `--color-surface` | `#ffffff` |
| Text | `--color-ink` / `--color-ink-soft` | `#10131b` / `#5d6374` |
| Decision | `--color-lapis` / `-dark` / `-soft` | `#2b5ee7` / `#20379b` / `#e8edfc` |
| Attention | `--color-gold` / `-soft` | `#c79114` / `#faf3dd` |
| Checked correct | `--color-correct` / `-soft` | `#137638` / `#e7f6ec` |
| Checked wrong | `--color-wrong` / `-soft` | `#b42318` / `#fdecea` |

Never reach for a raw hex in a component. If a surface needs a colour the table
does not have, the answer is a new token with a reason, not a one-off
`color-mix`.

## Subject colour: accent and tint travel together

Six subjects, each owning a pair. The accent fills bars, rings, glyph squares
and the 3px top edge of a card. The tint fills the surface underneath. They are
designed as a pair because a subject that had only an accent is exactly why the
app used to be grey — there was nothing to fill with.

| Subject | Accent | Tint | Accent on its own tint |
| --- | --- | --- | --- |
| Algebra | `#2b5ee7` | sky `#f3f9ff` | 5.1:1 |
| Arithmetic | `#0b656d` | yellow `#fff2ad` | 6.0:1 |
| Computer Science | `#6d28d9` | violet `#f7f1ff` | 6.4:1 |
| Research Methods | `#9a470c` | coral `#ffeee6` | 5.7:1 |
| Physics | `#b3341f` | peach `#fff0e7` | 5.5:1 |
| Biology | `#17703d` | mint `#dff8ea` | 5.5:1 |

Algebra is the tightest pair at 5.1:1 and the only one with a separate darker
text variant, `--color-lapis-dark` `#20379b`, which reaches 9.5:1 on sky. Use it
for small text and links on a sky field; the accent itself is for fills, bars
and glyphs.

That exception is a *token*, not a palette field. There is no per-subject text
colour in `SUBJECT_PALETTE` — one existed briefly, identical to the accent for
five of six subjects, carried by no CSS variable and read by nothing, which
meant the contrast test was pinning a value the app never painted. The rule is
now asserted against `accent`, which is what `subjectColor()` returns and what
actually reaches the screen.

**The rule that binds them: every accent clears 4.5:1 against its own tint.**
Not against white — against the surface it will actually be printed on. Biology
and arithmetic were deepened from their original values for precisely this
reason; hue identity survived, the failing ratio did not.

Three consequences worth internalising:

- Ink stays readable on every tint (16:1 or better), so a tinted card needs no
  special text colour. Use `text-ink` and `text-ink-soft` as normal.
- Every accent also clears 3:1 on white, so it is legal as a non-text graphic
  (a ring, a rail, a hairline) on a working surface.
- Reach the pair through `subjectColor()` / `subjectTint()` in
  `src/lib/curriculum/subjects.ts`. These return `var(--color-subject-*)`, so a
  token change propagates. A hand-rolled `color-mix` on an accent is a review
  failure — it produces a colour nobody contrast-checked.

`tests/design-palette.test.ts` enforces all three ratios per subject. Adding a
seventh subject is a compile error in `SUBJECT_PALETTE`, `SUBJECT_OBJECT` and
every exhaustive record keyed on `SubjectKey` — that is deliberate.

Illustration follows the same discipline: subject clay objects
(`subjectObjectSrc`) in any grid or rail, bespoke course art only on a course
detail hero, where nothing sits beside it to look inconsistent. A course without
bespoke art gets a tinted wash hero, which reads as a variant rather than a gap.

## Type: five steps, one family

Inter, self-hosted, for everything. Fraunces is retired — there is no display
serif, no `--font-display`, and `tests/design-typography.test.ts` fails if one
comes back.

| Step | Token | Size | Use |
| --- | --- | --- | --- |
| micro | `--text-micro` | 0.6875rem | chips, evidence metadata, protocol labels |
| label | `--text-label` | 0.75rem | eyebrows, section labels, meta lines |
| body-sm | `--text-body-sm` | 0.8125rem | dense UI text, nav rows, card bodies |
| body | `--text-body` | 0.9375rem | prose |
| lead | `--text-lead` | 1.0625rem | panel titles, standfirst |

Headings above `lead` use `.title-page` (a clamp, for the one page title) and
`.title-panel`, plus Tailwind's own `text-lg`/`text-xl`/`text-2xl`/`text-3xl`
steps. Everything else is off the scale, and `tests/design-type-scale.test.ts`
enforces that in three parts:

- Arbitrary **absolute** sizes — `text-[13px]`, `text-[0.9em]`,
  `text-[length:…]`, `calc`/`clamp` — are banned outright. No allowlist.
- Arbitrary **rem** sizes — `text-[0.82rem]` — are banned outside a shrinking
  allowlist, which holds the lesson canvas and the marketing landing.
- Tailwind's **named sizes below lead** — `text-xs` 12, `text-sm` 14,
  `text-base` 16 — are banned outside a second shrinking allowlist, seeded
  from what the tree already carried. The app-shell chrome it was seeded with
  is gone; what remains is the lesson canvas, the Judge canvas and the
  landing, which are out of scope by design rather than un-swept.

Both allowlists may only get shorter, and a staleness assertion forces a file
off its list the moment it is clean. Adding an entry is a review failure, not a
fix. The rule originally covered only the rem form, which is how a whole Studio
surface built out of `text-sm` stayed invisible through fifteen tasks.

**Form controls take `lead`, and that is not a hierarchy decision.** iOS zooms
the viewport when a field below 16px takes focus, so every `input`, `textarea`
and `select` in the app needs a size above that floor; `lead` at 17px is the
smallest step on the scale that clears it. A field therefore sits two steps
above its own `body-sm` label, which looks larger than a designer would choose
and is correct anyway. Sizing one down to `body` reintroduces the zoom.

Tracking is tokenised, not typed by hand: `tracking-display` (-0.045em) for
large headlines, `tracking-title` (-0.01em) for panel and card titles,
`tracking-body` (0) for everything else. Two tracking utilities on one element
is a bug — the later one silently wins.

## Zone washes

The app has four zones, resolved from the route by `zoneForPath()`:

| Zone | Routes | Wash |
| --- | --- | --- |
| learn | `/dashboard`, `/library`, `/review`, `/courses` | sky |
| evidence | `/progress` | mint |
| studio | `/create` | peach |
| account | `/settings`, `/account` | none |

A wash is two soft radial gradients of the zone tint over paper, anchored off
the top corners — wayfinding you feel before you read. **Soft washes are
permitted, at zone strength.** The earlier prohibition on "gradient-led styling"
was aimed at the AI-product cliché of a saturated gradient as brand identity,
and it overshot: it left the app grey while the landing was full of colour, and
that gap is the drift this system closes.

The boundaries are:

- One wash per page, from the zone or from an explicit subject tint on a
  subject-scoped surface. Never both.
- Zone strength means the tint itself, faded to transparent — not a stronger
  mix, and not a second gradient stacked on for depth.
- The account zone stays unwashed on purpose. Settings is not a place; it is a
  panel of switches. `washStyle()` checks the zone before it resolves a tint, so
  passing an explicit subject tint cannot wash it anyway.
- Gradients are canvas only. A card, a chip, a button or a rail is a flat fill.

One known tension to design around: the learn wash and the algebra tint are both
sky, so an algebra hero cannot separate itself from its own canvas by fill alone.
It uses the 3px accent edge to hold the boundary. If the learn zone is ever
retinted, prefer a neutral wash there so every subject tint reads against it.

## Elevation: three levels, no fourth

`--shadow-1`, `--shadow-2`, `--shadow-3`. Level 1 is a resting card, level 2 is
a card responding to the pointer, level 3 is something floating over the page
(a drawer, a modal). Borders do most of the grouping work; shadow is for the
question "is this above the page?", not "is this important?".

Surfaces come from three places and nowhere else:

- `.surface-card` — white, hairline border, resting at level 1.
- `.surface-card-quiet` — the same without the shadow.
- `cardClasses(tone, interactive)` in `src/components/ui/card-classes.ts`, the
  tested contract. `tinted` deliberately sets no background so the caller
  supplies the subject tint.

An interactive solid card lifts from level 1 to level 2; reusing level 1 for the
hover state animates a lift with no change in elevation, which reads as a
rendering glitch. `tests/design-primitives.test.ts` fails on any bespoke
`shadow-[...]` outside the three tokens.

Radius: `--radius-control` (0.75rem) for controls, `--radius-card` (1.25rem) for
surfaces. Do not nest one rounded box inside another of the same radius.

Shared primitives live in `src/components/ui`: `Card`, `Chip`, `ProgressRail`,
`SectionHeader`, `StatTile`, `SubjectBadge`. Build the new surface out of these
before you build a new one — the dashboard and the library drifted into two
different cards for the same object once already, which is why
`CoursePathCard` now exists.

Chip tone is meaning, never decoration: `neutral` is a fact with no valence,
`correct` is an observation the engine accepted, `attention` is something still
open, `wrong` is a checked answer that was incorrect. `evidenceTone()` is the
single mapping from an engine result to a tone, so no surface can invent its
own reading — in particular, "developing" is unfinished work, not a wrong
answer, and must not be coloured as one.

## Maia is state, not furniture

Maia appears where she carries information about the learner's situation, and
nowhere else. A mascot idling on a page where she cannot be spoken to is the
clearest tell that a product has been decorated rather than designed.

Five poses, one meaning each — `MAIA_STATE_MEANING` is the whole contract:

| Pose | Means |
| --- | --- |
| attentive | idle — nothing is waiting |
| curious | a move is available |
| thinking | something needs review |
| celebrating | a verified moment fired |
| redirecting | a misconception was detected |

Rules:

- **Derive the pose, never choose it.** `maiaStateForAction()` maps the
  dashboard's real recommendation to a pose. A pose picked for looks teaches
  people to stop reading her.
- **The name comes from the same state as the pose.** `MAIA_STATE_TITLE` is
  the one accessible name per pose, so the alt text cannot say "ready for the
  next learning move" while she is drawn thinking. A fixed `title` beside a
  derived `state` is the same failure as a decorative pose, read aloud.
- **Stillness is the default.** `animated` is `false` unless she is somewhere
  she is genuinely live: the lesson canvas and a verified moment. Continuous
  idle motion elsewhere is banned, and every animation sits behind
  `prefers-reduced-motion`.
- **Size comes from the ladder.** 28px inline avatar, 96px page figure, 144px
  verified moment — `MAIA_SIZES`, applied through the `size` prop. Never
  Tailwind height/width classes, and never both at once on one element.
- She stays out of the navigation rail. Navigation is not a place where she has
  anything to say.

`tests/design-maia.test.ts` enforces the presence map, the default-still rule
and the size ladder, and keeps the lesson-canvas exemption honest by checking
that every exempted file still renders her.

## The verified moment, and the line it must not cross

Museion celebrates exactly one thing: an observation the engine checked. A
`VerifiedMoment` states what happened *and* the evidence that justifies it, on
the record's own green rather than a subject accent — because the band reports
the learning record, not a topic.

Three triggers, in order of evidential strength:

1. **Transfer solved unaided** — no hints, no Maia, no solution reveal.
2. **Course path complete** — every lesson in the path recorded a checked move.
   It says nothing about how many of those answers were right, and the copy must
   not imply it did.
3. **Misconception corrected in session** — a later answer on the same step was
   correct; the delayed recheck is still owed.

The moment blooms once on arrival and then holds still. A celebration that loops
stops being about the thing it marks.

**Gamification stays prohibited.** No streaks, no points, no XP, no badges, no
levels, no counters that only go up, no urgency. This is not a stylistic
preference; it is the product's central honesty claim. A completed activity is
an *observation* — the learner did this, on this date, under these conditions —
and it is not evidence of retained mastery. Every celebratory surface must
survive being read back as a factual sentence about the record. If it cannot,
it is a claim the product cannot defend, and it does not ship.
`tests/design-moments.test.ts` fails on the words that mark the slide.

## Accessibility is part of the palette, not a pass over it

- 44px minimum for anything tappable; the sidebar row geometry exists to make
  that automatic rather than remembered.
- Visible focus everywhere: 2px lapis outline at 3px offset, never removed.
- Text meets WCAG AA against its *composited* background — the tints and washes
  included. `scripts/verify-ui.mjs` walks every rendered run of text, resolves
  the painted stack behind it (including the wash gradient at full strength) and
  fails below 4.5:1, or 3:1 for large text. Failing that check means fixing the
  colour, not the threshold.
- Semantic landmarks, live regions for checked outcomes, keyboard-complete
  navigation, and reduced motion respected by every animation in `globals.css`.

## Working rules, in short

1. Take the token; do not mix your own colour.
2. Take the type step; do not type a rem value.
3. Take the primitive; do not rebuild the card.
4. Colour a surface with a subject's tint and its own accent, never one of each.
5. One wash per page, canvas only, at zone strength.
6. Three elevations. There is no fourth.
7. Maia appears because of state, at a ladder size, still unless she is live.
8. Celebrate only what was checked, and say what checked it.
