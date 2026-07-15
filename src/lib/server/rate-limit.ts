/**
 * Sliding-window rate limiter (in-memory, server-only).
 *
 * Sized for the prototype: one process, modest traffic. The interface
 * (key → allow/deny) is what a Redis-backed limiter would keep when the
 * app scales past one instance.
 */

const globalStore = globalThis as unknown as {
  __museionRateWindows?: Map<string, number[]>;
};

const windows = globalStore.__museionRateWindows ?? new Map<string, number[]>();
globalStore.__museionRateWindows = windows;

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the next request would be allowed (0 when allowed). */
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const recent = (windows.get(key) ?? []).filter((ts) => ts > cutoff);

  if (recent.length >= limit) {
    windows.set(key, recent);
    const oldest = recent[0];
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  recent.push(now);
  windows.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}
