export const DEFAULT_CLIENT_TIMEOUT_MS = 10_000;

export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request exceeded ${timeoutMs} ms`);
    this.name = "RequestTimeoutError";
  }
}

/**
 * Browser fetch with one owned abort timer. Callers that need their own abort
 * controller (for example Maia's explicit Cancel action) should use fetch
 * directly and compose that lifecycle themselves.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: Omit<RequestInit, "signal"> = {},
  timeoutMs = DEFAULT_CLIENT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new RequestTimeoutError(timeoutMs);
    throw error;
  } finally {
    globalThis.clearTimeout(timer);
  }
}
