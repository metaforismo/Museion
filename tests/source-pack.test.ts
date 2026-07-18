import { describe, expect, it } from "vitest";

import { createSourcePack, publicSourcePackSummary, sourcePackToDocument } from "@/lib/source";

const CREATED_AT = "2026-07-18T00:00:00.000Z";

describe("Source Packs", () => {
  it("combines transcripts, book excerpts, notes, and references into one hash-bound pack", async () => {
    const input = {
      title: "My recursion course",
      description: "One course from material I supplied.",
      materials: [
        {
          title: "Lecture transcript",
          content: "A base case stops recursion. Each call must reduce the problem.",
          role: "transcript" as const,
          reference: { kind: "youtube_video" as const, url: "https://www.youtube.com/watch?v=abc", label: "My lecture" },
        },
        {
          title: "Chapter notes",
          content: "The call stack records unfinished calls and their return values.",
          role: "notes" as const,
          reference: { kind: "book" as const, url: "https://example.com/books/recursion", label: "Recursion chapter" },
        },
      ],
      rights: { confirmed: true as const, basis: "creator-owned" as const, notes: "I created the lecture and notes." },
    };
    const first = await createSourcePack(input, CREATED_AT);
    const second = await createSourcePack(input, CREATED_AT);
    expect(first.sha256).toBe(second.sha256);
    expect(first.materials).toHaveLength(2);
    expect(first.materials[0].document.sourceReference?.kind).toBe("youtube_video");
    expect(first.materials[1].document.sourceReference?.kind).toBe("book");

    const document = await sourcePackToDocument(first);
    expect(document.pages).toHaveLength(2);
    expect(document.pages[0].text).toContain("Material 1: Lecture transcript (transcript)");
    expect(document.pages[1].text).toContain("Material 2: Chapter notes (notes)");
    expect(document.sourceReference).toBeUndefined();
    expect(publicSourcePackSummary(first).materials[0]).not.toHaveProperty("content");
  });

  it("requires an explicit rights basis and rejects oversized packs", async () => {
    await expect(createSourcePack({
      title: "Unconfirmed",
      materials: [{ title: "Notes", content: "Allowed content" }],
      rights: { confirmed: false, basis: "personal-notes" },
    } as never, CREATED_AT)).rejects.toThrow();

    await expect(createSourcePack({
      title: "Too many",
      materials: Array.from({ length: 9 }, (_, index) => ({ title: `Part ${index}`, content: "Text" })),
      rights: { confirmed: true, basis: "personal-notes" },
    }, CREATED_AT)).rejects.toThrow();
  });
});
