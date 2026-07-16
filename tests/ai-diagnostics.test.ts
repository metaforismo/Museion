import { describe, expect, it } from "vitest";

import { sanitizedAiDiagnostics } from "@/lib/client/ai-diagnostics";

describe("sanitized AI diagnostics", () => {
  it("copies only browser-safe runtime and routing fields", () => {
    const diagnostics = sanitizedAiDiagnostics({
      enabled: true,
      installed: true,
      authenticated: true,
      codexVersion: "codex-cli 0.144.2",
      provider: "codex",
      familyFallback: true,
      degradedReason: null,
      models: {
        compiler: { source_graph: "gpt-5.6-luna" },
        tutor: "gpt-5.6-terra",
      },
    }, "2026-07-16T10:00:00.000Z");

    expect(diagnostics).toEqual({
      capturedAt: "2026-07-16T10:00:00.000Z",
      enabled: true,
      installed: true,
      authenticated: true,
      codexVersion: "codex-cli 0.144.2",
      provider: "codex",
      familyFallback: true,
      degradedReason: null,
      models: {
        compiler: { source_graph: "gpt-5.6-luna" },
        tutor: "gpt-5.6-terra",
      },
    });
    expect(Object.keys(diagnostics)).not.toEqual(expect.arrayContaining(["token", "credentials", "source", "prompt", "conversation"]));
    expect(JSON.stringify(diagnostics)).not.toMatch(/access_token|refresh_token|authorization|conversation/i);
  });
});
