export type CardTone = "solid" | "quiet" | "tinted";

/**
 * Single source of truth for card surfaces. Elevation is restricted to the
 * three-level shadow system; bespoke shadows are a review failure.
 *
 * `solid` already rests at --shadow-1, so raising it on hover has to reach
 * --shadow-2 — reusing --shadow-1 there would animate a lift with no change
 * in elevation, which reads as a rendering glitch rather than a response.
 *
 * `tinted` deliberately sets no background: the caller supplies the subject
 * tint, which is the whole point of the tone.
 */
export function cardClasses(tone: CardTone, interactive = false): string {
  const base =
    tone === "solid" ? "surface-card" :
    tone === "quiet" ? "surface-card-quiet" :
    "rounded-[var(--radius-card)] border border-ink/8";
  const raised = tone === "solid" ? "hover:shadow-[var(--shadow-2)]" : "hover:shadow-[var(--shadow-1)]";
  const motion = interactive ? `transition duration-200 hover:-translate-y-0.5 ${raised}` : "";
  return `${base} ${motion}`.trim();
}
