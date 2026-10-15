import type { ReactNode } from "react";

/**
 * Small state marker. Tone is meaning, never decoration:
 *   neutral   — a fact with no valence ("Not started")
 *   correct   — an observation the engine checked and accepted
 *   attention — something still open: developing, unresolved, local-only
 *   wrong     — a checked answer that was incorrect
 *
 * `neutral` carries a hairline instead of the paper fill so it stays legible
 * on a subject tint, where warm paper turns muddy.
 */
const TONES = {
  neutral: "border border-ink/10 bg-surface text-ink-soft",
  correct: "bg-correct-soft text-correct",
  attention: "bg-gold-soft text-ink",
  wrong: "bg-wrong-soft text-wrong",
} as const;

export type ChipTone = keyof typeof TONES;

export default function Chip({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-medium ${TONES[tone]} ${className}`.trim()}>
      {children}
    </span>
  );
}
