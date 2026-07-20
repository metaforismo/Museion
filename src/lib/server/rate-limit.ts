/**
 * Sliding-window rate limiter (in-memory, server-only).
 *
 * Sized for the prototype: one process, modest traffic. The interface
 * (key → allow/deny) is what a Redis-backed limiter would keep when the
 * app scales past one instance.
 */

interface RateWindow {
  timestamps: number[];
  windowMs: number;
}

const globalStore = globalThis as unknown as {
  __museionRateWindows?: Map<string, RateWindow>;
};

const windows = globalStore.__museionRateWindows ?? new Map<string, RateWindow>();
globalStore.__museionRateWindows = windows;

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the next request would be allowed (0 when allowed). */
  retryAfterSeconds: number;
}

/** How many `checkRateLimit` calls between full-map sweeps of stale keys. */
export const RATE_LIMIT_SWEEP_INTERVAL_CALLS = 200;
let callsSinceSweep = 0;

function sweepStaleKeys(now: number): void {
  for (const [key, entry] of windows) {
    const cutoff = now - entry.windowMs;
    const recent = entry.timestamps.filter((ts) => ts > cutoff);
    if (recent.length === 0) windows.delete(key);
    else if (recent.length !== entry.timestamps.length) windows.set(key, { timestamps: recent, windowMs: entry.windowMs });
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  callsSinceSweep += 1;
  if (callsSinceSweep >= RATE_LIMIT_SWEEP_INTERVAL_CALLS) {
    callsSinceSweep = 0;
    sweepStaleKeys(now);
  }

  const cutoff = now - windowMs;
  const recent = (windows.get(key)?.timestamps ?? []).filter((ts) => ts > cutoff);
  if (recent.length === 0) windows.delete(key);

  if (recent.length >= limit) {
    windows.set(key, { timestamps: recent, windowMs });
    const oldest = recent[0];
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  recent.push(now);
  windows.set(key, { timestamps: recent, windowMs });
  return { allowed: true, retryAfterSeconds: 0 };
}

export function rateLimitKeyCountForTests(): number {
  return windows.size;
}

export function resetRateLimitForTests(): void {
  windows.clear();
  callsSinceSweep = 0;
}
