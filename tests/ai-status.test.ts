import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/codex-runtime", () => ({ codexRuntimeStatus: vi.fn() }));

import { GET } from "@/app/api/ai/status/route";
import { codexRuntimeStatus } from "@/lib/ai/codex-runtime";
import { resetAiSettingsForTests, updateAiSettings } from "@/lib/ai/settings";
import { BALANCED_COMPILER_ROUTING } from "@/lib/ai/model-routing";
import { sanitizedAiDiagnostics } from "@/lib/client/ai-diagnostics";

describe("truthful compiler capability status", () => {
  beforeEach(() => {
    vi.stubEnv("MUSEION_LIVE_AI_ENABLED", "1");
    vi.stubEnv("OPENROUTER_API_KEY", "synthetic-status-key");
    vi.stubEnv("OPENAI_API_KEY", "");
    resetAiSettingsForTests();
    vi.mocked(codexRuntimeStatus).mockResolvedValue({ enabled: true, installed: true, authenticated: true, version: "synthetic-version", executable: "/synthetic/codex" });
  });
  afterEach(() => { vi.unstubAllEnvs(); resetAiSettingsForTests(); });

  it("reports a configured free compiler without claiming live acceptance", async () => {
    updateAiSettings({ provider: "openrouter-free" });
    const response = await GET();
    const status = await response.json();
    expect(status).toMatchObject({ openRouterConfigured: true, degradedReason: null, compilerAvailable: true, compilerUnavailableReason: null, models: { tutor: "openrouter/free" } });
    expect(Object.values(status.models.compiler)).toEqual(Object.keys(BALANCED_COMPILER_ROUTING).map(() => "openrouter/free"));
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(JSON.stringify(status)).not.toContain("synthetic-status-key");
    expect(sanitizedAiDiagnostics(status)).toMatchObject({ compilerAvailable: true, compilerUnavailableReason: null });
  });

  it("requires real Codex runtime readiness for the selected compiler", async () => {
    updateAiSettings({ provider: "codex" });
    expect(await (await GET()).json()).toMatchObject({ compilerAvailable: true, models: { compiler: BALANCED_COMPILER_ROUTING } });
    vi.mocked(codexRuntimeStatus).mockResolvedValue({ enabled: true, installed: true, authenticated: false, version: null, executable: "/synthetic/codex" });
    expect(await (await GET()).json()).toMatchObject({ compilerAvailable: false, compilerUnavailableReason: "CODEX_NOT_AUTHENTICATED", models: { compiler: {} } });
  });

  it("requires a configured selected API compiler and respects the explicit live opt-out", async () => {
    updateAiSettings({ provider: "openai-api" });
    expect(await (await GET()).json()).toMatchObject({ compilerAvailable: false, compilerUnavailableReason: "API_PROVIDER_NOT_CONFIGURED" });
    vi.stubEnv("OPENAI_API_KEY", "synthetic-not-called-key");
    expect(await (await GET()).json()).toMatchObject({ compilerAvailable: true });
    vi.stubEnv("MUSEION_LIVE_AI_ENABLED", "0");
    expect(await (await GET()).json()).toMatchObject({ compilerAvailable: false, compilerUnavailableReason: "LIVE_AI_DISABLED", models: { compiler: {} } });
  });
});
