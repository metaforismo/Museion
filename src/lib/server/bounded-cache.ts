/**
 * Bounded TTL cache (in-memory, server-only).
 *
 * Backs idempotency and short-lived result caches that must not grow
 * without bound: entries expire after `ttlMs` and the map never holds
 * more than `maxEntries`, evicting the oldest entry first.
 */

export interface BoundedCacheOptions {
  maxEntries: number;
  ttlMs: number;
}

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class BoundedTtlCache<V> {
  private readonly store = new Map<string, CacheEntry<V>>();

  constructor(private readonly options: BoundedCacheOptions) {}

  private sweep(now: number): void {
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }

  get(key: string, now: number = Date.now()): V | undefined {
    this.sweep(now);
    const entry = this.store.get(key);
    return entry ? entry.value : undefined;
  }

  set(key: string, value: V, now: number = Date.now()): void {
    this.sweep(now);
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: now + this.options.ttlMs });
    while (this.store.size > this.options.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  get size(): number {
    return this.store.size;
  }
}
