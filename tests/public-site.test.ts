import { describe, expect, it } from "vitest";
import { siteConfiguration } from "@/lib/site/config";
import { AUTH_PAGE_PATHS, PUBLIC_CONTENT_PATHS, PUBLIC_PAGE_PATHS } from "@/lib/site/public-routes";

describe("public site release boundary", () => {
  it("keeps indexing off unless a public HTTPS origin is explicitly enabled", () => {
    for (const url of [undefined, "broken", "ftp://example.org", "https://localhost:3000", "https://127.0.0.1", "https://[::1]", "https://192.168.1.1", "https://10.1.2.3", "https://172.16.0.1", "https://app.local", "https://user:pass@example.org", "http://example.org"]) {
      expect(siteConfiguration({ NEXT_PUBLIC_SITE_URL: url, MUSEION_PUBLIC_INDEXING: "1" }).indexing).toBe(false);
    }
    expect(siteConfiguration({ NEXT_PUBLIC_SITE_URL: "https://museion.example" }).indexing).toBe(false);
    expect(siteConfiguration({ NEXT_PUBLIC_SITE_URL: "https://museion.example/path", MUSEION_PUBLIC_INDEXING: "1" })).toEqual({ origin: "https://museion.example", indexing: true });
  });
  it("publishes information pages while excluding authentication and personal work from the content index", () => {
    expect(PUBLIC_PAGE_PATHS).toEqual(expect.arrayContaining(["/", "/help", "/privacy", "/terms", ...AUTH_PAGE_PATHS]));
    for (const path of ["/dashboard", "/api/account", "/welcome", "/library", "/courses/algebra-as-balance", "/account", ...AUTH_PAGE_PATHS]) {
      expect(PUBLIC_CONTENT_PATHS).not.toContain(path);
    }
  });
});
