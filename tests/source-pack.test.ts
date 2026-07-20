import { describe, expect, it } from "vitest";

import {
  createSingleDocumentSourcePackManifest,
  createSourcePack,
  createSourcePackFromDocuments,
  createSourcePackManifest,
  ingestTextSource,
  publicSourcePackSummary,
  sourcePackToDocument,
  verifySourcePackIntegrity,
  verifySourcePackManifestBinding,
} from "@/lib/source";

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
    const manifest = createSourcePackManifest(first, document);
    expect(manifest.materials.map((material) => [material.compiledPageStart, material.compiledPageEnd])).toEqual([[1, 1], [2, 2]]);
    expect(manifest.compilerDocumentSha256).toBe(document.sha256);
    expect(JSON.stringify(manifest)).not.toContain("A base case stops recursion");
    expect(() => verifySourcePackManifestBinding(manifest, document)).not.toThrow();
    await expect(verifySourcePackIntegrity(first)).resolves.toBeUndefined();
  });

  it("builds a pack from independently normalized documents and preserves a single material hash", async () => {
    const transcript = await ingestTextSource({ title: "Transcript", text: "Authorized transcript evidence.", sourceReference: { kind: "youtube_video", url: "https://youtube.com/watch?v=abc", label: "Lecture" }, createdAt: CREATED_AT });
    const notes = await ingestTextSource({ title: "Notes", text: "Creator notes with a second distinction.", createdAt: CREATED_AT });
    const pack = await createSourcePackFromDocuments({
      title: "Independent materials",
      materials: [{ title: "Transcript", role: "transcript", document: transcript }, { title: "Notes", role: "notes", document: notes }],
      rights: { confirmed: true, basis: "creator-owned" },
    }, CREATED_AT);
    const compiled = await sourcePackToDocument(pack);
    expect(compiled.pages.map((page) => page.text)).toEqual([
      expect.stringContaining("Material 1: Transcript (transcript)"),
      expect.stringContaining("Material 2: Notes (notes)"),
    ]);
    expect(createSourcePackManifest(pack, compiled).materials.map((material) => material.role)).toEqual(["transcript", "notes"]);

    const single = await createSourcePackFromDocuments({ title: "Course title", materials: [{ title: "Original material title", role: "primary-source", document: notes }], rights: { confirmed: true, basis: "personal-notes" } }, CREATED_AT);
    const singleCompiled = await sourcePackToDocument(single);
    expect(singleCompiled.sha256).toBe(notes.sha256);
    expect(singleCompiled.title).toBe("Course title");
  });

  it("rejects tampered material ids, pack hashes, and document contents", async () => {
    const pack = await createSourcePack({ title: "Pack", materials: [{ title: "Notes", content: "Authorized notes." }], rights: { confirmed: true, basis: "personal-notes" } }, CREATED_AT);
    await expect(verifySourcePackIntegrity({ ...pack, id: `pack_${"f".repeat(24)}` })).rejects.toThrow("SOURCE_PACK_HASH_MISMATCH");
    await expect(verifySourcePackIntegrity({ ...pack, materials: [{ ...pack.materials[0], id: `material_${"f".repeat(24)}` }] })).rejects.toThrow("SOURCE_PACK_MATERIAL_HASH_MISMATCH");
    await expect(verifySourcePackIntegrity({ ...pack, materials: [{ ...pack.materials[0], document: { ...pack.materials[0].document, pages: [{ ...pack.materials[0].document.pages[0], text: "Tampered" }] } }] })).rejects.toThrow();
  });

  it("creates a sanitized single-document manifest and rejects document or page-range substitution", async () => {
    const document = await ingestTextSource({ title: "My notes", text: "A bounded source record with enough substance." });
    const manifest = await createSingleDocumentSourcePackManifest(document, { confirmed: true, basis: "personal-notes", notes: "Mine" });
    expect(manifest.materials).toHaveLength(1);
    expect(manifest.materials[0]).toMatchObject({ compiledPageStart: 1, compiledPageEnd: 1, documentSha256: document.sha256 });
    expect(JSON.stringify(manifest)).not.toContain("enough substance");

    const other = await ingestTextSource({ title: "Other", text: "Different authorized material." });
    expect(() => verifySourcePackManifestBinding(manifest, other)).toThrow("SOURCE_PACK_DOCUMENT_MISMATCH");
    expect(() => verifySourcePackManifestBinding({
      ...manifest,
      materials: [{ ...manifest.materials[0], compiledPageStart: 2, compiledPageEnd: 2 }],
    }, document)).toThrow("SOURCE_PACK_PAGE_RANGE_INVALID");
  });

  it("keeps eight-material page ranges contiguous under the maximum pack size", async () => {
    const pack = await createSourcePack({
      title: "Stress pack",
      materials: Array.from({ length: 8 }, (_, index) => ({ title: `Material ${index + 1}`, content: `Authorized material ${index + 1}.`, role: "notes" as const })),
      rights: { confirmed: true, basis: "personal-notes" },
    }, CREATED_AT);
    const document = await sourcePackToDocument(pack);
    const manifest = createSourcePackManifest(pack, document);
    expect(manifest.materials).toHaveLength(8);
    expect(manifest.materials.map((material) => material.compiledPageStart)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(() => verifySourcePackManifestBinding(manifest, document)).not.toThrow();
  });

  it("keeps duplicate-content materials independently addressable by position", async () => {
    const pack = await createSourcePack({
      title: "Repeated evidence",
      materials: [{ title: "Same title", content: "The same authorized note.", role: "notes" }, { title: "Same title", content: "The same authorized note.", role: "notes" }],
      rights: { confirmed: true, basis: "personal-notes" },
    }, CREATED_AT);
    expect(pack.materials[0].document.sha256).toBe(pack.materials[1].document.sha256);
    expect(pack.materials[0].id).not.toBe(pack.materials[1].id);
    await expect(verifySourcePackIntegrity(pack)).resolves.toBeUndefined();
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
