import { beforeEach, describe, expect, it } from "vitest";

import {
  checkRateLimit,
  RATE_LIMIT_SWEEP_INTERVAL_CALLS,
  rateLimitKeyCountForTests,
  resetRateLimitForTests,
} from "@/lib/server/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("allows up to the limit inside the window, then denies", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("k1", 3, 60_000, t0 + i).allowed).toBe(true);
    }
    const denied = checkRateLimit("k1", 3, 60_000, t0 + 10);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("frees capacity once the window slides past old requests", () => {
    const t0 = 2_000_000;
    checkRateLimit("k2", 1, 1_000, t0);
    expect(checkRateLimit("k2", 1, 1_000, t0 + 500).allowed).toBe(false);
    expect(checkRateLimit("k2", 1, 1_000, t0 + 1_001).allowed).toBe(true);
  });

  it("keys are independent", () => {
    const t0 = 3_000_000;
    checkRateLimit("k3", 1, 60_000, t0);
    expect(checkRateLimit("k4", 1, 60_000, t0).allowed).toBe(true);
  });

  it("reports a sensible retry-after", () => {
    const t0 = 4_000_000;
    checkRateLimit("k5", 1, 30_000, t0);
    const denied = checkRateLimit("k5", 1, 30_000, t0 + 10_000);
    expect(denied.retryAfterSeconds).toBe(20);
  });

  it("prunes a key once its whole timestamp array has expired, via periodic sweep", () => {
    const t0 = 5_000_000;
    checkRateLimit("stale-key", 1, 1_000, t0);
    for (let i = 0; i < RATE_LIMIT_SWEEP_INTERVAL_CALLS; i++) {
      checkRateLimit(`filler-${i}`, 1, 1_000, t0 + 50_000 + i);
    }
    expect(rateLimitKeyCountForTests()).toBe(RATE_LIMIT_SWEEP_INTERVAL_CALLS);
  });
});
