import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The hero rendered as "Sources✦don't have" for two independent reasons, so
 * both need pinning: the JSX transform silently dropped the literal space
 * that followed the charm, and .inlineCharmImage renders at 155% of its box,
 * so the artwork bleeds past the orb and eats whatever space is left.
 */
const page = readFileSync("src/app/page.tsx", "utf8");
const landing = readFileSync("src/app/landing.module.css", "utf8");

describe("landing hero charm", () => {
  it("keeps an explicit space on both sides of the hero charm", () => {
    const hero = /<InlineCharm src="\/landing\/hero-spark-charm-v2\.png"[^/]*\/>\s*\{" "\}/.test(page);
    expect(hero).toBe(true);
    // and the rotator before it still ends with one
    expect(page).toContain('</span>{" "}');
  });

  it("gives the inline charm horizontal room in the shared rule", () => {
    const rule = landing.slice(landing.indexOf(".wordOrb {"));
    const body = rule.slice(0, rule.indexOf("}"));
    const margin = /margin-inline:\s*([0-9.]+)em/.exec(body);
    expect(margin).not.toBeNull();
    // .wordOrb's own font-size is 0.42em, so anything under ~0.1em here is
    // less than the artwork's own bleed and the charm collides again.
    expect(Number(margin![1])).toBeGreaterThanOrEqual(0.15);
  });

  it("keeps the decorative orb out of the hero's accessible name", () => {
    expect(page).toContain('aria-label="Sources don\'t have to stay passive"');
    // InlineCharm itself must stay hidden from the accessibility tree.
    const charm = page.slice(page.indexOf("function InlineCharm"));
    expect(charm.slice(0, charm.indexOf("</span>"))).toContain('aria-hidden="true"');
  });
});
