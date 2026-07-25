export type PressableVariant = "primary" | "attention" | "secondary";

/**
 * Single source of truth for the pressable treatment — the hard-edge depth
 * device that marks "you can press this" the way the blur ladder marks "this
 * floats". The press physics live in `globals.css` (`.pressable`): rest on a
 * 4px deep edge, hover lifts 1px, active travels down 2px and collapses the
 * edge, all behind the global reduced-motion switch.
 *
 * Variants are the three text/fill pairs that have actually been checked:
 *
 * - `primary`   — full accent fill + white text. The caller supplies the fill
 *                 from `subjectColor()` and the edge from `subjectDeep()`;
 *                 every subject accent clears 4.5:1 under white (worst case
 *                 algebra, 5.44:1) and `tests/design-palette.test.ts` pins it.
 * - `attention` — the review queue's warm gold. Ink text, not white: white on
 *                 gold is 2.80:1 and fails, ink is 6.62:1. The pair is baked
 *                 in here precisely so no caller can re-decide it.
 * - `secondary` — surface fill, ink text, ink/12 edge (the `.pressable`
 *                 default), for the quieter action beside a primary.
 *
 * No variant carries a blur shadow: edge = presses, blur = floats, never both.
 */
export function pressableClasses(variant: PressableVariant = "primary"): string {
  const base =
    "pressable inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-2xl px-5 text-body font-semibold";
  const look =
    variant === "primary" ? "text-white" :
    variant === "attention" ? "bg-gold text-ink [--pressable-edge:var(--color-gold-deep)]" :
    "border border-ink/8 bg-surface text-ink";
  return `${base} ${look}`;
}
