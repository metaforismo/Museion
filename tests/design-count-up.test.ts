import { describe, expect, it } from "vitest";

import { COUNT_UP_DURATION_MS, countUpValue } from "@/lib/design/count-up";

/**
 * The journey tiles count up to their real recorded value on first paint.
 * The honesty constraint is that no frame may ever display a number above
 * the record — the animation approaches the truth from below and lands on
 * it exactly.
 */
describe("countUpValue", () => {
  it("starts at 0 and lands exactly on the real value", () => {
    expect(countUpValue(37, 0)).toBe(0);
    expect(countUpValue(37, COUNT_UP_DURATION_MS)).toBe(37);
    expect(countUpValue(37, COUNT_UP_DURATION_MS + 500)).toBe(37);
  });

  it("never prints a frame above the real value, at any sampling", () => {
    for (const target of [1, 3, 7, 42, 1000]) {
      for (let elapsed = 0; elapsed <= COUNT_UP_DURATION_MS + 40; elapsed += 7) {
        expect(countUpValue(target, elapsed)).toBeLessThanOrEqual(target);
      }
    }
  });

  it("only ever counts up — a decreasing frame would read as the record shrinking", () => {
    let previous = 0;
    for (let elapsed = 0; elapsed <= COUNT_UP_DURATION_MS; elapsed += 16) {
      const current = countUpValue(42, elapsed);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it("eases out — the second half of the time covers less ground than the first", () => {
    const midpoint = countUpValue(1000, COUNT_UP_DURATION_MS / 2);
    expect(midpoint).toBeGreaterThan(500);
  });

  it("delivers small targets whole — counting to 1 would print a wrong 0 for the entire duration", () => {
    for (const target of [1, 2, 3, 4]) {
      expect(countUpValue(target, 1)).toBe(target);
      expect(countUpValue(target, COUNT_UP_DURATION_MS / 2)).toBe(target);
    }
    // The threshold itself still counts.
    expect(countUpValue(5, 1)).toBe(0);
  });

  it("returns 0 and negative targets untouched, instantly", () => {
    expect(countUpValue(0, 0)).toBe(0);
    expect(countUpValue(-2, 10)).toBe(-2);
  });

  it("treats a non-positive duration as reduced motion — the real value at once", () => {
    expect(countUpValue(9, 0, 0)).toBe(9);
  });
});
