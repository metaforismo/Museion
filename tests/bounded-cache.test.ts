import { describe, expect, it } from "vitest";

import { BoundedTtlCache } from "@/lib/server/bounded-cache";

describe("BoundedTtlCache", () => {
  it("returns a stored value until it expires", () => {
    const cache = new BoundedTtlCache<string>({ maxEntries: 10, ttlMs: 1_000 });
    const t0 = 1_000_000;
    cache.set("a", "value", t0);
    expect(cache.get("a", t0 + 500)).toBe("value");
    expect(cache.get("a", t0 + 1_001)).toBeUndefined();
  });

  it("sweeps expired entries out of the map on access", () => {
    const cache = new BoundedTtlCache<number>({ maxEntries: 10, ttlMs: 100 });
    const t0 = 2_000_000;
    cache.set("a", 1, t0);
    cache.set("b", 2, t0);
    expect(cache.size).toBe(2);
    cache.get("b", t0 + 200);
    expect(cache.size).toBe(0);
  });

  it("evicts the oldest entry once maxEntries is exceeded", () => {
    const cache = new BoundedTtlCache<number>({ maxEntries: 3, ttlMs: 60_000 });
    const t0 = 3_000_000;
    cache.set("a", 1, t0);
    cache.set("b", 2, t0 + 1);
    cache.set("c", 3, t0 + 2);
    cache.set("d", 4, t0 + 3);
    expect(cache.size).toBe(3);
    expect(cache.get("a", t0 + 3)).toBeUndefined();
    expect(cache.get("d", t0 + 3)).toBe(4);
  });

  it("deletes a key on demand", () => {
    const cache = new BoundedTtlCache<number>({ maxEntries: 10, ttlMs: 60_000 });
    cache.set("a", 1);
    expect(cache.delete("a")).toBe(true);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.delete("missing")).toBe(false);
  });
});
