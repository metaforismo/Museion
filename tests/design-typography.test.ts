import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function grepCount(pattern: string, target: string): number {
  try {
    const output = execFileSync("grep", ["-ro", pattern, target], { encoding: "utf8" });
    return output.split("\n").filter(Boolean).length;
  } catch {
    return 0; // grep exits 1 when there are no matches
  }
}

describe("Fraunces retirement", () => {
  it("has no font-display class usages left in src", () => {
    expect(grepCount("font-display", "src")).toBe(0);
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
