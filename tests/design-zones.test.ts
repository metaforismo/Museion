import { describe, expect, it } from "vitest";

import { washStyle, zoneForPath } from "@/lib/design/zones";

describe("zoneForPath", () => {
  it.each([
    ["/dashboard", "learn"],
    ["/library", "learn"],
    ["/review", "learn"],
    ["/courses/algebra-as-balance", "learn"],
    ["/progress", "evidence"],
    ["/create", "studio"],
    ["/create/review", "studio"],
    ["/settings", "account"],
    ["/account", "account"],
  ])("maps %s to the %s zone", (pathname, expected) => {
    expect(zoneForPath(pathname)).toBe(expected);
  });

  it("defaults unknown routes to learn", () => {
    expect(zoneForPath("/something-new")).toBe("learn");
  });

  it("is not confused by a prefix that is not a segment boundary", () => {
    expect(zoneForPath("/progressive")).toBe("learn");
  });
});

describe("washStyle", () => {
  it("produces a background image for a washed zone", () => {
    expect(washStyle("learn").backgroundImage).toContain("radial-gradient");
  });

  it("produces no background for the account zone", () => {
    expect(washStyle("account")).toEqual({});
  });

  it("prefers an explicit subject tint over the zone default", () => {
    const style = washStyle("learn", "#fff0e7");
    expect(style.backgroundImage).toContain("#fff0e7");
  });

  it("keeps the account zone unwashed even when given an explicit tint", () => {
    expect(washStyle("account", "#dff8ea")).toEqual({});
  });
});
