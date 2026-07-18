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
      version: 4,
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
      rightsBasis: "licensed" as const,
    };
    const serialized = serializeCreatorDraft(linked);
    expect(parseCreatorDraft(serialized)).toMatchObject(linked);
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("token");
  });

  it("rejects an unknown rights basis instead of restoring an untrusted attestation", () => {
    expect(parseCreatorDraft(JSON.stringify({ ...draft, rightsBasis: "probably-fine" }))).toBeNull();
  });

  it("round-trips independently editable text materials in their chosen order", () => {
    const materials = [
      { id: "draft_notes", title: "My notes", origin: "text" as const, content: "A bounded explanation.", mediaType: "text/markdown" as const, role: "notes" as const, sourceUrl: "", sourceKind: "webpage" as const },
      { id: "draft_transcript", title: "Lecture", origin: "text" as const, content: "An authorized transcript.", mediaType: "text/plain" as const, role: "transcript" as const, sourceUrl: "https://www.youtube.com/watch?v=abc", sourceKind: "youtube_video" as const },
    ];
    expect(parseCreatorDraft(serializeCreatorDraft({ ...draft, materials }))).toMatchObject({ version: 4, materials });
  });

  it("persists file metadata but forces reattachment and never serializes file content", () => {
    const materials = [{ id: "draft_pdf", title: "Owned chapter", origin: "file" as const, content: "", mediaType: "text/plain" as const, role: "excerpt" as const, sourceUrl: "", sourceKind: "book" as const, fileName: "chapter.pdf", fileSize: 1234, needsReattach: false }];
    const serialized = serializeCreatorDraft({ ...draft, materials });
    expect(serialized).not.toContain("fileBytes");
    expect(parseCreatorDraft(serialized)?.materials?.[0]).toMatchObject({ fileName: "chapter.pdf", fileSize: 1234, content: "", needsReattach: true });
  });

  it("rejects duplicate material ids and persisted file content", () => {
    const material = { id: "draft_same", title: "Notes", origin: "text", content: "Allowed", mediaType: "text/plain", role: "notes", sourceUrl: "", sourceKind: "webpage" };
    expect(parseCreatorDraft(JSON.stringify({ ...draft, materials: [material, material], version: 4 }))).toBeNull();
    expect(parseCreatorDraft(JSON.stringify({ ...draft, materials: [{ ...material, id: "draft_file", origin: "file", content: "private bytes", fileName: "x.pdf" }], version: 4 }))).toBeNull();
  });

  it.each([null, "not-json", "{}", JSON.stringify({ ...draft, targetMinutes: 999 })])(
    "rejects an absent or invalid draft",
    (value) => expect(parseCreatorDraft(value)).toBeNull(),
  );
});
