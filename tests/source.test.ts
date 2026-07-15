import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  MAX_NORMALIZED_CHARACTERS,
  MAX_SOURCE_PAGES,
  SourceIngestionError,
  createSourceDocument,
  ingestPdfSource,
  ingestTextSource,
  normalizeSourceText,
  resolveExactSourceSpan,
  validateSourceSpan,
} from "@/lib/source";

const CREATED_AT = "2026-07-15T00:00:00.000Z";

describe("source normalization and provenance", () => {
  it("normalizes line endings, Unicode and trailing whitespace deterministically", () => {
    const composed = normalizeSourceText("\ufeffCafe\u0301  \r\nnext\t \r\n");
    expect(composed.text).toBe("Café\nnext");
    expect(composed.removedControlCharacters).toBe(false);
  });

  it("produces stable document and page hashes", async () => {
    const first = await ingestTextSource({
      title: "Binary search",
      text: "Invariant\r\nlow <= target <= high  ",
      mediaType: "text/markdown",
      createdAt: CREATED_AT,
    });
    const second = await ingestTextSource({
      title: "Binary search",
      text: "Invariant\nlow <= target <= high",
      mediaType: "text/markdown",
      createdAt: CREATED_AT,
    });
    expect(first.sha256).toBe(second.sha256);
    expect(first.pages[0].sha256).toBe(second.pages[0].sha256);
    expect(first.id).toBe(second.id);
  });

  it("resolves and validates exact UTF-16 spans", async () => {
    const document = await ingestTextSource({
      title: "Emoji offsets",
      text: "A😀B unique invariant C",
      createdAt: CREATED_AT,
    });
    const span = await resolveExactSourceSpan(document, {
      pageNumber: 1,
      exactText: "unique invariant",
    });
    expect(span.start).toBe(5); // A + surrogate pair + B + space
    expect(document.pages[0].text.slice(span.start, span.end)).toBe(span.exactText);
    expect(await validateSourceSpan(document, span)).toEqual([]);

    const forged = { ...span, sha256: "0".repeat(64) };
    expect(await validateSourceSpan(document, forged)).toContain("span_hash_mismatch");
  });

  it("rejects missing and ambiguous quotes", async () => {
    const document = await ingestTextSource({
      title: "Repeated",
      text: "same phrase, same phrase",
      createdAt: CREATED_AT,
    });
    await expect(
      resolveExactSourceSpan(document, { pageNumber: 1, exactText: "missing" }),
    ).rejects.toMatchObject({ code: "quote_not_found" });
    await expect(
      resolveExactSourceSpan(document, { pageNumber: 1, exactText: "same phrase" }),
    ).rejects.toMatchObject({ code: "ambiguous_quote" });
  });

  it("keeps prompt injection as source data and emits a review warning", async () => {
    const malicious = await readFile(
      new URL("./fixtures/malicious-source-injection.md", import.meta.url),
      "utf8",
    );
    const document = await ingestTextSource({
      title: "Untrusted fixture",
      text: malicious,
      mediaType: "text/markdown",
      createdAt: CREATED_AT,
    });
    expect(document.pages[0].text).toContain("IGNORE");
    expect(document.warnings.map((warning) => warning.code)).toContain(
      "instruction_like_content",
    );
  });

  it("rejects empty, oversized and over-page-limit sources", async () => {
    await expect(
      ingestTextSource({ title: "Empty", text: "  \n\t", createdAt: CREATED_AT }),
    ).rejects.toBeInstanceOf(SourceIngestionError);
    await expect(
      ingestTextSource({
        title: "Large",
        text: "x".repeat(MAX_NORMALIZED_CHARACTERS + 1),
        createdAt: CREATED_AT,
      }),
    ).rejects.toMatchObject({ code: "source_too_large" });
    await expect(
      createSourceDocument({
        title: "Too many pages",
        mediaType: "application/pdf",
        rawPages: Array.from({ length: MAX_SOURCE_PAGES + 1 }, () => "text"),
        byteLength: 100,
        createdAt: CREATED_AT,
      }),
    ).rejects.toMatchObject({ code: "too_many_pages" });
  });

  it("extracts the six-page golden selectable-text PDF", async () => {
    const bytes = await readFile(
      new URL("./fixtures/binary-search-golden-source.pdf", import.meta.url),
    );
    const document = await ingestPdfSource({
      title: "Binary Search: Invariants, Boundaries and Off-by-One Errors",
      bytes: new Uint8Array(bytes),
      originalFileName: "binary-search-golden-source.pdf",
      createdAt: CREATED_AT,
    });
    expect(document.pages).toHaveLength(6);
    expect(document.pages[0].text.toLowerCase()).toContain("binary search");
    expect(document.pages.every((page) => page.sha256.length === 64)).toBe(true);
  });
});
