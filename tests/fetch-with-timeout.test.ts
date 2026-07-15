import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "@/lib/client/fetch-with-timeout";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchWithTimeout", () => {
  it("returns a response and clears its timer", async () => {
    vi.useFakeTimers();
    const response = new Response("ok");
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithTimeout("/health", {}, 250)).resolves.toBe(response);
    expect(vi.getTimerCount()).toBe(0);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("aborts a hanging request and reports a typed timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_input, init: RequestInit | undefined) => (
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })
    )));

    const request = fetchWithTimeout("/slow", {}, 400);
    const rejection = expect(request).rejects.toBeInstanceOf(RequestTimeoutError);
    await vi.advanceTimersByTimeAsync(400);
    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });
});
