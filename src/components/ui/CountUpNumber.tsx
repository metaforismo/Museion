"use client";

import { useEffect, useState } from "react";

import { COUNT_UP_DURATION_MS, countUpValue } from "@/lib/design/count-up";

/**
 * A recorded count that arrives by counting up from 0 on first paint. The
 * number it lands on is the real value and nothing else — the maths lives in
 * `countUpValue`, which is pinned to never print a frame above the target.
 *
 * Reduced motion (and no-JS, via the sr-only copy) gets the real value with
 * no animation. The animated span is aria-hidden throughout so assistive tech
 * only ever reads the true number.
 */
export default function CountUpNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Reduced motion collapses the duration to 0: the first frame is already
    // the real value. Everything runs through the same rAF tick either way.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : COUNT_UP_DURATION_MS;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = countUpValue(value, now - start, duration);
      setDisplay(next);
      if (next < value) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}
