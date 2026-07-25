# Museion Energy — design direction

Date: 2026-07-25
Branch: `v2/sites`
Status: approved direction (Francesco: "think like Duolingo… addictive, amazing, catchy"),
scoped in conversation: **full visual energy + honest mechanics, shell first; the lesson
canvas gets its own dedicated pass immediately after.**

## The diagnosis

The unification pass made Museion coherent. It did not make it *desirable*. The current
app is correct, calm, and forgettable: pale tints, one blur-shadow language, small flat
buttons, a mascot who mostly stands still. Duolingo-class products feel alive because
every interactive element looks **pressable**, colour arrives at **full saturation** at
the moment of action, progression is drawn as a **place you are standing on a path**, and
the character **reacts to you**.

We adopt the craft. We do not adopt the manipulation.

## The boundary that does not move

No streaks. No XP. No leagues. No badges. No fabricated numbers. No guilt copy. Every
number on screen is a real engine observation; every celebration is engine-verified
(unaided transfer, course completion, misconception resolved); urgency may only reflect
the real review queue. A completed activity is an observation, not mastery. This is the
product's thesis and its differentiator — the energy pass makes honesty *feel good*
instead of feeling beige.

Addictiveness, for Museion, means: **you always see exactly one obvious, delicious next
action, pressing it feels physical, and finishing it visibly moves you forward on a path
you can see.** Clarity + tactility + visible progress. Not guilt.

## The five moves

### 1. Pressable depth — the hard edge

The landing CTA already carries a 3px hard offset (`0_3px_0`). That device — flat fill,
darker same-hue bottom edge, press = translate down + edge collapses — becomes the
system-wide signature for *interactive* elements. The blur ladder `--shadow-1/2/3`
remains for *resting surface elevation*. The rule: **blur = it floats, edge = it presses.**

Every accent gains a `deep` shade for its edge (accent × 0.72, computed once, literal):

| Token | Fill | Deep edge |
| --- | --- | --- |
| lapis | `#2b5ee7` | `#1f44a6` |
| algebra | `#2b5ee7` | `#1f44a6` |
| physics | `#b3341f` | `#812516` |
| biology | `#17703d` | `#11512c` |
| cs | `#6d28d9` | `#4e1d9c` |
| arithmetic | `#0b656d` | `#08494e` |
| research | `#9a470c` | `#6f3309` |
| gold | `#c79114` | `#8f680e` |
| correct | `#137638` | `#0e5528` |

Deep shades are decorative edges (no text on them) — no contrast requirement. They live
in `SUBJECT_PALETTE` as a `deep` field plus `--color-*-deep` tokens, pinned by the
existing token test. Components never compute them.

A `Pressable` treatment ships in `src/components/ui/` (button + link variants): fill,
white text, 4px deep edge, `rounded-2xl`, hover lifts 1px, active translates down 2px
and collapses the edge, focus ring stays ink. Secondary variant: surface fill, ink text,
ink/12 edge. All six subject fills are legal with white text (verified: 5.44:1 worst
case, algebra).

### 2. Full-saturation moments

Tints remain the resting language of surfaces. **The primary action of a page and the
current node of a path take the full accent fill.** One full-fill element per view is
the target density — the eye needs exactly one loudest thing. Chips, rails and washes
stay tinted.

### 3. The path — course detail becomes a place

Course detail's lesson list becomes a vertical snaking path of circular nodes on the
subject tint wash:

- **Done** — full accent fill, white check, small and settled.
- **Current** — larger, full accent fill, pulsing halo ring (reduced-motion: static
  ring), a chunky `Start` / `Continue` Pressable beside it. Maia stands at this node,
  pose from state (`curious`).
- **Ahead** — surface fill, ink/15 border, number. Never a padlock: Museion does not
  lock content, it recommends order. Ahead nodes are enterable and visibly quieter.
- **Milestones** — the transfer check of each lesson, when passed, plants a small flag
  on the node (engine-verified, so it is legal celebration). Course completion crowns
  the final node.

The path is drawn with the subject accent as a connecting rail; done segments full
accent, ahead segments ink/10. All data comes from the real progress record.

### 4. Character with a pulse

Maia's presence map is unchanged (state, never furniture) but her *quality* upgrades:
larger at her hero placements, always posed from real state, and on the path she stands
at the current node. Her animation remains only where she is live (lesson rail, verified
moments) — but pressing Begin may hand off with a one-shot pop (reduced-motion safe).

### 5. Juice — honest numbers that feel good

- Evidence tiles count up from 0 to their real value on first paint (400ms,
  reduced-motion: instant). Real numbers only.
- The review queue, when non-empty, becomes a warm gold Pressable with the real count —
  "3 to revisit" — sized by urgency (queue length), capped, never guilt-worded.
- Verified moments keep their bloom; the bloom gains confetti-free scale physics
  (`pop-in` exists already). No sounds in this pass.
- Press states everywhere: anything clickable responds within 100ms visually.

## Scope

**This pass:** dashboard, course detail (flagship), library, review, evidence, plus the
`ui/` foundation (Pressable, deep tokens, path components). Landing untouched — it
already leads. **Explicitly out:** lesson canvas and Judge (next pass, sequenced), Source
Studio and settings (follow the system automatically via primitives; light touch only).

## System discipline — unchanged and binding

- Five-step type scale + display steps; both ratchets hold; allowlists only shrink.
- Subject colour via `subjectColor()` / `subjectTint()` (+ new `subjectDeep()`).
- Blur shadows for elevation only; the hard edge is the only other depth device.
- Every text/fill pair ≥4.5:1 (white-on-accent verified for all six).
- 44px interactive targets; `prefers-reduced-motion` honoured on every new animation.
- No push before 2026-08-12.

`DESIGN_SYSTEM_V2.md` gains a "Pressable depth" section and the path grammar when this
lands.
