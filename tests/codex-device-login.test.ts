import { describe, expect, it } from "vitest";

import { parseCodexDeviceLoginOutput } from "@/lib/ai/codex-runtime";

describe("Codex device login output", () => {
  it.each([
    "ABCD-EFGH",
    "ABCD-EFGHJ",
    "ABCD-EFGH12",
  ])("accepts the device-code shapes emitted by Codex: %s", (userCode) => {
    expect(parseCodexDeviceLoginOutput(`Open https://auth.openai.com/codex/device\nCode: ${userCode}`)).toEqual({
      verificationUrl: "https://auth.openai.com/codex/device",
      userCode,
    });
  });

  it("does not treat unrelated short identifiers as device codes", () => {
    expect(parseCodexDeviceLoginOutput("status READY-OK")).toEqual({
      verificationUrl: null,
      userCode: null,
    });
  });
});
