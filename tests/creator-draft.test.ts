import { describe, expect, it, vi } from "vitest";

import { parseCreatorDraft, serializeCreatorDraft } from "@/lib/client/creator-draft";

const draft = {
  title: "Binary search notes",
  text: "The interval remains inclusive.",
  mediaType: "text/markdown" as const,
  templateId: "socratic-foundations" as const,
  learnerGoal: "Trace every update.",
  level: "novice" as const,
  language: "en",
  targetMinutes: 12,
};

describe("creator draft storage", () => {
  it("round-trips a bounded, versioned draft", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T10:00:00.000Z"));
    expect(parseCreatorDraft(serializeCreatorDraft(draft))).toEqual({
      ...draft,
      version: 3,
      savedAt: "2026-07-15T10:00:00.000Z",
    });
    vi.useRealTimers();
  });

  it("accepts the legacy unversioned shape without trusting extra fields", () => {
    expect(parseCreatorDraft(JSON.stringify({ ...draft, privateFileBytes: "never" }))).toEqual(draft);
  });

  it("round-trips a linked-source draft without storing fetched content or credentials", () => {
    const linked = {
      ...draft,
      sourceMode: "reference" as const,
      sourceUrl: "https://www.youtube.com/playlist?list=PL123",
      sourceKind: "youtube_playlist" as const,
    };
    const serialized = serializeCreatorDraft(linked);
    expect(parseCreatorDraft(serialized)).toMatchObject(linked);
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("token");
  });

  it.each([null, "not-json", "{}", JSON.stringify({ ...draft, targetMinutes: 999 })])(
    "rejects an absent or invalid draft",
    (value) => expect(parseCreatorDraft(value)).toBeNull(),
  );
});
