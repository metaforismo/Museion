# Museion visual unification — design

Date: 2026-07-25
Branch: `v2/sites`
Status: approved design, pending implementation plan

## Problem

Museion currently ships two design languages under one name.

The landing is a bright illustrated sky world: gradient blue, 3D clay objects, clouds, a tight
grotesk, a black pill CTA. The app shell is a cream editorial instrument: Fraunces serif, hairline
borders, lapis accent, grey micro-labels. They do not share tokens, typography, or colour.

The split is literal, not atmospheric. `src/app/landing.module.css` declares a private variable set
inside `.page` that has no relationship to the `@theme` block in `src/app/globals.css`:

| Role | Landing | App |
| --- | --- | --- |
| ink | `#10131b` | `#14192b` |
| blue | `#2b5ee7` | `#2b4acb` |
| tints | sky, peach, mint, violet, yellow | lapis-soft, gold-soft only |
| headings | `font-ui` (Inter), serif explicitly overridden | `font-display` (Fraunces) |

Two palettes, two inks, two blues, two heading typefaces.

The perceived "AI slop" in the app shell is measurable:

- Nine distinct micro font sizes across the sidebar and dashboard: `0.56 / 0.62 / 0.64 / 0.65 /
  0.66 / 0.68 / 0.7 / 0.72rem`. Near-identical greys at near-identical sizes is the loudest signal.
- The active navigation state is `bg-ink/[0.035]` — 3.5% opacity, effectively invisible. A 3px bar
  carries the entire affordance.
- `src/components/AppSidebar.tsx` forces `SubjectIcon variant="plain"`, stripping colour from the
  one place wayfinding needs it. Ten courses render as ten identical grey rows.
- The dashboard's entire colour budget is four 12%-tint icon chips.
- `public/landing/` holds six bespoke course illustrations and six subject clay objects. The app
  renders none of them.
- `MaiaCharacter` defaults `animated` to `true`, so every instance idles continuously — including
  static pages. `docs/redesign/DESIGN_SYSTEM_V2.md` forbids continuous mascot animation.

A subject has an accent and no fill token. That single omission is why nothing in the app can be
coloured without inventing a one-off `color-mix`, and it is the root cause of the grey.

## Decisions

Six decisions were taken during design. They are settled; the plan implements them.

1. **Bridge the two languages.** The app keeps its instrument bones — real hierarchy, honest data,
   no gamification — and inherits the landing's colour breadth, tinted zones, structural subject
   colour, and clay assets at emotional beats. The landing stays the loudest room; the app becomes
   the same house.
2. **Scope is every logged-in surface plus the landing.** Sidebar, app header, dashboard, library,
   course, review, evidence, Source Studio, settings, account. The lesson and Judge canvas are
   explicitly out — they carry the deterministic feedback states, misconception surfacing and Maia
   leak gates, and get their own later pass. Anything less than full scope leaves visibly stale
   rooms, because each page hand-rolls its own card markup today.
3. **Subject clay objects in grids; bespoke course art on detail heroes.** Six of ten courses have
   bespoke illustrations. Using them in grids would split every row into two visible tiers, so
   grids and the sidebar use the six subject objects (all ten courses map to a subject), and the
   bespoke art moves to course detail heroes where each course stands alone. The four courses
   without art — `forces-and-motion`, `natural-selection`, `recursion-foundations`,
   `proportional-reasoning` — get a subject-tinted wash hero. No new assets required.
4. **Celebrate only what the engine verifies.** Colour stays structural. Genuine checked
   milestones get a real moment. No streaks, XP, points or badges.
5. **Inter everywhere; Fraunces is retired.** One display face. Fraunces Variable stops being
   loaded, halving the self-hosted font payload. Letter-spacing must carry the character the serif
   used to, and must be tokenised rather than set per component.
6. **Maia is state, never furniture.** Every appearance derives from real data; she animates only
   where she is live.

## Foundation

### One token system

`landing.module.css` stops declaring private variables and consumes `@theme`. Landing values win
where they conflict, since the landing is the reference.

- `--color-ink: #10131b`
- `--color-lapis: #2b5ee7` (fills, buttons, large surfaces)
- `--color-lapis-dark: #20379b` (small text, links — 10.09:1 on sky)
- Tints promoted to first-class tokens: `--color-sky #f3f9ff`, `--color-peach #fff0e7`,
  `--color-mint #dff8ea`, `--color-violet #f7f1ff`, `--color-yellow #fff2ad`,
  `--color-coral #ffeee6`

Retained unchanged from the current `@theme`: `--color-gold` and `--color-gold-soft` (attention —
the misconception treatment depends on them), `--color-correct` / `--color-correct-soft` and
`--color-wrong` / `--color-wrong-soft` (checked outcomes only, never decorative),
`--color-paper`, `--color-surface`, and `--color-ink-soft`.

### Subject pairs

Every subject becomes an **accent + tint pair**. This is the structural addition that makes
coloured surfaces possible.

| Subject | Accent | Tint | Accent on tint |
| --- | --- | --- | --- |
| Mathematics | `#2b5ee7` fill / `#20379b` text | sky `#f3f9ff` | 5.13 / 9.52 |
| Physics | `#b3341f` | peach `#fff0e7` | 5.51 |
| Biology | `#17703d` | mint `#dff8ea` | 5.48 |
| Computer science | `#6d28d9` | violet `#f7f1ff` | 6.42 |
| Arithmetic | `#0b656d` | yellow `#fff2ad` | 5.99 |
| Research | `#9a470c` | coral `#ffeee6` | 5.68 |

**Binding rule: every accent clears 4.5:1 against its own tint.** Without it, coloured cards cannot
carry readable text and colour degrades into decoration. Two current accents fail the rule and
change: biology `#1f8a4c` (3.91, fail) deepens to `#17703d`, and arithmetic `#0e7c86` (4.37 on
yellow, fail) deepens to `#0b656d`. Both keep their hue identity. Verified with a WCAG relative
luminance calculation over all candidates.

### Type

Five sizes, Inter only: `11 / 12 / 13 / 15 / 17px`, plus `--title-page` (clamp 24→32) and
`--title-hero` (clamp 45→71). Tracking tokenised: `-0.045em` display, `-0.01em` titles, `0` body.

The nine ad-hoc micro sizes are removed. This is enforced, not documented: `scripts/verify-ui.mjs`
gains a check that fails on arbitrary `text-[...]` font sizes outside the scale.

### Elevation and motion

Elevation keeps the existing three-shadow system unchanged. Motion stays state-change only, with
`prefers-reduced-motion` honoured, matching current behaviour.

## Zone wash

The app background stops being flat cream. Each zone carries one soft radial wash at roughly 4%
strength over paper. This is the technique already shipping on the focus route in
`src/components/SiteShell.tsx`, so it is proven in-codebase rather than novel. It gives wayfinding
you feel before you read.

| Zone | Routes | Wash |
| --- | --- | --- |
| Learn | `/dashboard`, `/library`, `/courses/*`, `/review` | sky |
| Evidence | `/progress` | mint |
| Studio | `/create`, `/create/review` | peach |
| Account | `/settings`, `/account` | none (neutral paper) |

A course detail page overrides the Learn wash with its own subject tint, so
`/courses/forces-and-motion` reads peach rather than sky. Zone is resolved from the pathname in
`SiteShell`, in one place, not per page.

## Shared primitives

Extract into `src/components/ui/`: `Card`, `SectionHeader`, `StatTile`, `Chip`, `EmptyState`,
`SubjectBadge`, `ProgressRail`.

Library, course, review, evidence, Source Studio and settings are re-laid on these. This is the
part that prevents the divergence recurring — library drifted precisely because it rebuilt cards by
hand in `src/app/library/page.tsx`.

## Surfaces

### Sidebar

- Tagline removed from the rail; it already appears on the landing and is noise in a 17rem column.
  Header drops from 80px to 64px.
- Active state becomes visible: sky fill, `lapis-dark` text, coloured icon, bar retained.
  `bg-ink/[0.035]` is retired.
- Subject colour restored — `variant="plain"` is removed.
- Paths cap at six, then "View all N". Ordering is deterministic: in-progress first (most recently
  active first), then completed, then unstarted in catalog order. Each row carries a 2px accent
  progress rail; the bare lesson count moves into the tooltip.
- Exactly two type sizes in the rail, one icon size, one stroke weight.
- The Maia card is removed and replaced by a compact live/offline guidance indicator — real
  information the dashboard currently duplicates as a grey pill.
- Collapsed rail is 4.5rem; icons keep subject colour.

### Dashboard

- The hero adopts the subject colour of the recommended action: tint field, accent eyebrow, accent
  progress. This single change removes most of the white.
- Method spine: seven grey dashes become a labelled rail with completed / active / upcoming states.
  Mobile currently renders bare numbers, making the product's central thesis invisible on phones.
- Status pills gain semantics — a live dot for connected guidance, neutral for offline.
- Course cards: clay object at 44px, tint band, accent border at full strength, replacing the
  current 60%-into-white wash.
- Right rail earns colour by meaning — misconceptions amber, sources blue.

### Library, course, review, evidence, Source Studio, settings

Re-laid on the shared primitives, inheriting tokens and the zone wash. Course detail pages gain the
bespoke illustration hero where art exists, and a subject-tinted wash hero where it does not.

## Maia

Maia is currently two characters wearing one face: a functional, schema-bounded, leak-gated tutor in
the lesson rail, and a decorative pose in eight other places. A character who talks to you in one
room and is furniture in the next teaches people to stop reading her.

**State semantics are locked.** `attentive` idle, `curious` a move is available, `thinking`
something needs review, `celebrating` a verified moment fired, `redirecting` a misconception was
detected. `src/app/dashboard/page.tsx` already derives her pose from the real recommendation; that
pattern generalises. Hardcoded poses chosen for looks are removed.

**Size ladder**: 28px inline, 96px hero, 144px moment. Nothing else.

**Animation only where she is live** — the lesson rail and verified moments. Static everywhere else.
`animated` stops defaulting to `true`.

**Presence map**: lesson rail (full tutor, unchanged), dashboard hero, verified moments, empty
states, onboarding. Removed everywhere else, including the sidebar, because the rail has no state to
report about her.

## Verified moments

Three triggers, all engine-checked: an unaided transfer passing, a course completing, a
misconception resolving.

Treatment is a Maia state change plus a one-shot accent bloom, always accompanied by the line that
justifies it — for example "Unaided transfer — no hints, no Maia". Reduced-motion respected. No
streaks, XP, badges, or counters implying durable mastery. Celebrating exactly the moments the
evidence model already supports is consistent with the product's honesty claim, not in tension with
it.

## Landing

- Consumes the merged tokens instead of declaring its own.
- The hero `InlineCharm` collision is fixed — `Sources✦don't have` currently has no space around
  the orb.
- Otherwise unchanged. It is the reference, not the patient.

## Accessibility

- Every accent clears 4.5:1 on its own tint (verified above).
- Focus rings must remain visible on tinted fields; a lapis ring on a sky field is insufficient, so
  coloured surfaces take an ink ring.
- Minimum 44px interactive targets, visible focus, semantic landmarks preserved.
- The method spine must remain legible on mobile rather than degrading to numbers.

## Non-goals

- No dark mode in this pass.
- Lesson and Judge canvas untouched.
- No new illustrated assets produced.
- No gamification layer.
- No changes to learning logic, evidence semantics, or Maia's leak gating.

## Verification

- Existing bar holds: 387 tests passing, typecheck clean, lint clean.
- Both the self-hosted Next build and the Sites/Vinext build must pass.
- `npm run screenshots` re-run and diffed across every surface, before and after.
- `scripts/verify-ui.mjs` extended to fail on off-scale font sizes.
- Contrast assertions added for all six accent/tint pairs so the binding rule cannot silently
  regress.

## Release constraints

All work stays on `v2/sites`, local plus the private owner-only Site. Nothing reaches `main`, the
public GitHub repository, Devpost, or Vercel before the winner announcement on 2026-08-12, per the
host's standing instruction not to modify the submission, its description, video link, or
repository during judging.

`docs/redesign/DESIGN_SYSTEM_V2.md` is rewritten as part of this work. It currently forbids what the
code will now do, and a doc that contradicts the implementation is worse than no doc.

## Arguable items

Two decisions are defensible either way and were flagged rather than settled by strong conviction:

- **Capping sidebar paths at six.** Correct at ten courses; a real information loss if learners are
  expected to juggle more. Revisit if the catalog grows.
- **Removing Maia from the sidebar.** Justified by the state-not-furniture rule, but her presence
  there had warmth value that the guidance indicator does not replace.
