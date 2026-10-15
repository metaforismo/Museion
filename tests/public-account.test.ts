import { afterEach, describe, expect, it, vi } from "vitest";
import { readPublicAccount } from "@/lib/client/public-account";

afterEach(() => vi.unstubAllGlobals());

describe("public account navigation", () => {
  it.each([
    { actor: { kind: "guest", displayName: null } },
    { actor: { kind: "account", displayName: "Learner" } },
  ])("reads a validated guest or account session", async (value) => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(value));
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    expect(await readPublicAccount(signal)).toEqual(value);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", { cache: "no-store", signal });
  });

  it("settles failed and malformed session responses as unavailable", async () => {
    for (const response of [new Response(null, { status: 503 }), Response.json(null), Response.json({ actor: { kind: "admin", displayName: "Wrong" } }), Response.json({ actor: { kind: "account" } })]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
      await expect(readPublicAccount(new AbortController().signal)).rejects.toThrow();
    }
  });

  it("allows the navigation timeout to cancel a stalled session request", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", vi.fn((_url, { signal }: RequestInit) => new Promise((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })));
    const request = readPublicAccount(controller.signal);
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });
});
