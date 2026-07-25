import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { STATE_DEEPS, SUBJECT_PALETTE, TINTS } from "@/lib/design/palette";

const globals = readFileSync(path.resolve("src/app/globals.css"), "utf8");
const landing = readFileSync(path.resolve("src/app/landing.module.css"), "utf8");

describe("globals.css", () => {
  it.each(Object.entries(SUBJECT_PALETTE))("declares the %s accent, tint and deep with the palette's exact values", (key, entry) => {
    expect(globals).toContain(`--color-subject-${key}: ${entry.accent};`);
    expect(globals).toContain(`--color-subject-${key}-tint: ${entry.tint};`);
    expect(globals).toContain(`--color-subject-${key}-deep: ${entry.deep};`);
  });

  it.each(Object.entries(STATE_DEEPS))("declares the %s deep edge with the palette's exact value", (name, value) => {
    expect(globals).toContain(`--color-${name}-deep: ${value};`);
  });

  it.each(Object.entries(TINTS))("declares the %s tint token", (name, value) => {
    expect(globals).toContain(`--color-${name}: ${value};`);
  });

  it("adopts the landing ink and blue", () => {
    expect(globals).toContain("--color-ink: #10131b;");
    expect(globals).toContain("--color-lapis: #2b5ee7;");
  });

  it("declares the five-step type scale", () => {
    expect(globals).toContain("--text-micro: 0.6875rem;");
    expect(globals).toContain("--text-label: 0.75rem;");
    expect(globals).toContain("--text-body-sm: 0.8125rem;");
    expect(globals).toContain("--text-body: 0.9375rem;");
    expect(globals).toContain("--text-lead: 1.0625rem;");
  });

  it("declares tokenised tracking", () => {
    expect(globals).toContain("--tracking-display: -0.045em;");
    expect(globals).toContain("--tracking-title: -0.01em;");
  });
});

describe("landing.module.css", () => {
  it("no longer declares a private palette", () => {
    const privateVars = landing.match(/--landing-[a-z-]+:/g) ?? [];
    expect(privateVars).toEqual([]);
  });

  it("no longer overrides headings to a different family", () => {
    expect(landing).not.toContain("font-family: var(--font-ui)");
  });
});
