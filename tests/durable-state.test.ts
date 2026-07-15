import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetMemoryStateForTests, stateBackend, type StateRecord } from "@/lib/server/durable-state";

const originalEnvironment = {
  backend: process.env.MUSEION_STATE_BACKEND,
  url: process.env.SUPABASE_URL,
  secret: process.env.SUPABASE_SECRET_KEY,
  legacy: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

function restore(name: keyof NodeJS.ProcessEnv, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function fixture(expiresAt = new Date(Date.now() + 60_000).toISOString()): StateRecord<{ value: number }> {
  const now = new Date().toISOString();
  return {
    namespace: "compiler_run",
    id: "run-1",
    ownerId: "owner-a",
    payload: { value: 1 },
    expiresAt,
    createdAt: now,
    updatedAt: now,
  };
}

describe("durable state backend", () => {
  beforeEach(() => {
    process.env.MUSEION_STATE_BACKEND = "memory";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetMemoryStateForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restore("MUSEION_STATE_BACKEND", originalEnvironment.backend);
    restore("SUPABASE_URL", originalEnvironment.url);
    restore("SUPABASE_SECRET_KEY", originalEnvironment.secret);
    restore("SUPABASE_SERVICE_ROLE_KEY", originalEnvironment.legacy);
  });

  it("keeps ownership, expiry, and clone boundaries in memory", async () => {
    const backend = stateBackend();
    const record = fixture();
    await backend.put(record);
    record.payload.value = 99;

    expect((await backend.get<{ value: number }>("compiler_run", "run-1", "owner-a"))?.payload.value).toBe(1);
    expect(await backend.get("compiler_run", "run-1", "owner-b")).toBeUndefined();
    expect(await backend.list("compiler_run", "owner-a")).toHaveLength(1);

    await backend.prune("compiler_run", new Date(Date.now() + 120_000));
    expect(await backend.get("compiler_run", "run-1", "owner-a")).toBeUndefined();
  });

  it("fails closed when Supabase is only partially configured", () => {
    process.env.MUSEION_STATE_BACKEND = "supabase";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    expect(() => stateBackend()).toThrow("SUPABASE_STATE_NOT_CONFIGURED");
  });

  it("uses new Supabase secret keys only in the apikey header", async () => {
    process.env.MUSEION_STATE_BACKEND = "supabase";
    process.env.SUPABASE_URL = "https://example.supabase.co/";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("[]", { status: 200 }));

    await stateBackend().list("compiler_run", "owner with spaces");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("owner_id=eq.owner%20with%20spaces");
    expect(new Headers(init?.headers).get("apikey")).toBe("sb_secret_test");
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("keeps bearer auth for a legacy service-role JWT", async () => {
    process.env.MUSEION_STATE_BACKEND = "supabase";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy.jwt.value";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("[]", { status: 200 }));

    await stateBackend().list("compiler_run", "owner-a");

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer legacy.jwt.value");
  });
});
