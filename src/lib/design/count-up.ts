/**
 * The count-up a journey tile plays on first paint: 0 to the real recorded
 * value in ~400ms, ease-out, never overshooting. Honesty constraint: the
 * animation may only ever *approach* the real number from below — a frame
 * that printed a value above it would flash a count the record does not hold.
 *
 * Pure so `tests/design-count-up.test.ts` can pin those properties without a
 * component-render stack; the client component owns only the rAF loop and the
 * prefers-reduced-motion check (reduced motion: the real value, instantly).
 */

export const COUNT_UP_DURATION_MS = 400;

/**
 * Below this, counting is theatre: a target of 1 would print "0" for the full
 * duration and then jump, and a screenshot taken mid-animation shows a number
 * the surrounding copy contradicts ("0 lessons completed" inside a section
 * that only renders when the count is at least 1). Small values pop in whole —
 * the component pairs this with the existing pop-in scale animation.
 */
export const COUNT_UP_MIN_TARGET = 5;

export function countUpValue(target: number, elapsedMs: number, durationMs: number = COUNT_UP_DURATION_MS): number {
  if (target <= 0 || durationMs <= 0 || elapsedMs >= durationMs) return target;
  if (target < COUNT_UP_MIN_TARGET) return target;
  if (elapsedMs <= 0) return 0;
  const progress = elapsedMs / durationMs;
  const eased = 1 - Math.pow(1 - progress, 3);
  // Floor, not round: rounding up would display a count the record has not
  // reached yet, for a frame. Every intermediate frame under-reports.
  return Math.min(target, Math.floor(eased * target));
}
