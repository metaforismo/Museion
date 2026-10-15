import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/page.tsx", "utf8");

describe("landing presentation", () => {
  it("routes product entry through authentication", () => {
    expect(page).toContain('href="/signup"');
    expect(page).toContain('href="/login"');
    expect(page).not.toContain('href="/judge"');
    expect(page).not.toContain("No account");
  });

  it("keeps the public landing informational and account entry explicit", () => {
    expect(page).not.toContain("MethodTraceDemo");
    expect(page).not.toContain("Try this small algebra example");
    expect(page).toContain('id="how-it-works"');
    expect(page).toContain('href="/signup?next=/library"');
  });
});
