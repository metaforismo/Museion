import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function grepCount(pattern: string, target: string, include: string[] = []): number {
  let output: string;
  try {
    // -e keeps patterns that start with "-" (e.g. "--font-serif-display") from
    // being parsed as grep options.
    output = execFileSync("grep", ["-ro", ...include.map((glob) => `--include=${glob}`), "-e", pattern, target], { encoding: "utf8" });
  } catch (error) {
    // grep exits 1 for "no matches" — the only failure that means zero. Exit 2
    // (missing path, bad pattern) or a spawn failure must not pass vacuously.
    if ((error as { status?: unknown }).status === 1) return 0;
    throw error;
  }
  return output.split("\n").filter(Boolean).length;
}

describe("Fraunces retirement", () => {
  it("has no font-display class usages left in src", () => {
    // Font-face's standard `font-display: swap` is unrelated to the retired
    // Tailwind class. Class usages live in TS/TSX, not font-face declarations.
    expect(grepCount("font-display", "src", ["*.ts", "*.tsx"])).toBe(0);
  });

  it("no longer defines the serif display token", () => {
    expect(grepCount("--font-serif-display", "src")).toBe(0);
  });

  it("no longer imports the Fraunces stylesheet", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).not.toContain("fraunces");
  });

  it("no longer depends on the Fraunces package", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).some((name) => name.includes("fraunces"))).toBe(false);
  });
});
