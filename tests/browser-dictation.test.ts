import { describe, expect, it } from "vitest";
import { browserDictationAvailable } from "@/lib/client/dictation";

describe("browser dictation availability", () => {
  it("keeps dictation unavailable when the microphone policy blocks it, even with a speech API", () => {
    expect(browserDictationAvailable({ isSecureContext: true, recognizerAvailable: true, document: { featurePolicy: { allowsFeature: () => false } } })).toBe(false);
    expect(browserDictationAvailable({ isSecureContext: true, recognizerAvailable: true, document: { permissionsPolicy: { allowsFeature: () => false }, featurePolicy: { allowsFeature: () => true } } })).toBe(false);
  });

  it("requires both browser support and explicit page permission", () => {
    const policy = { allowsFeature: (feature: string) => feature === "microphone" };
    expect(browserDictationAvailable({ isSecureContext: true, recognizerAvailable: true, document: { permissionsPolicy: policy } })).toBe(true);
    expect(browserDictationAvailable({ isSecureContext: false, recognizerAvailable: true, document: { permissionsPolicy: policy } })).toBe(false);
    expect(browserDictationAvailable({ isSecureContext: true, recognizerAvailable: false, document: { permissionsPolicy: policy } })).toBe(false);
  });

  it("keeps the control unavailable when policy checks cannot confirm permission", () => {
    expect(browserDictationAvailable({ isSecureContext: true, recognizerAvailable: true, document: {} })).toBe(false);
    expect(browserDictationAvailable({ isSecureContext: true, recognizerAvailable: true, document: { featurePolicy: { allowsFeature: () => { throw new Error("Unsupported policy"); } } } })).toBe(false);
  });
});
