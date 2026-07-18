import { describe, expect, it } from "vitest";

import { computeMaterialCitationCoverage } from "@/lib/compiler/source-pack-coverage";
import type { SourcePackManifest } from "@/lib/source";

const material = (id: string, title: string, start: number, end: number) => ({
  id: `material_${id.repeat(24)}`,
  title,
  role: "notes" as const,
  documentId: `src_${id.repeat(24)}`,
  documentSha256: id.repeat(64),
  pages: end - start + 1,
  characters: 100,
  compiledPageStart: start,
  compiledPageEnd: end,
  reference: null,
  warnings: [],
});

const manifest: SourcePackManifest = {
  schemaVersion: "1.0",
  packId: `pack_${"a".repeat(24)}`,
  packSha256: "a".repeat(64),
  title: "Mixed pack",
  compilerDocumentSha256: "f".repeat(64),
  rights: { confirmed: true, basis: "personal-notes", notes: "" },
  materials: [material("a", "Video notes", 1, 2), material("b", "Book excerpt", 3, 3), material("c", "Unused notes", 4, 4)],
};

describe("per-material citation coverage", () => {
  it("deduplicates spans and blocks while preserving uncited and empty material states", () => {
    const coverage = computeMaterialCitationCoverage(
      manifest,
      { span_a: { pageNumber: 1 }, span_b: { pageNumber: 2 }, span_c: { pageNumber: 3 }, outside: { pageNumber: 9 } },
      {
        block_1: { id: "block_1", citations: [{ spanId: "span_a" }, { spanId: "span_a" }, { spanId: "span_c" }] },
        block_2: { id: "block_2", citations: [{ spanId: "span_a" }] },
      },
    );
    expect(coverage.materials).toEqual([
      expect.objectContaining({ title: "Video notes", spanCount: 2, citedSpanCount: 1, citedBlockCount: 2, coveragePercent: 50, status: "cited" }),
      expect.objectContaining({ title: "Book excerpt", spanCount: 1, citedSpanCount: 1, citedBlockCount: 1, coveragePercent: 100, status: "cited" }),
      expect.objectContaining({ title: "Unused notes", spanCount: 0, citedSpanCount: 0, citedBlockCount: 0, coveragePercent: 0, status: "no-extracted-spans" }),
    ]);
    expect(coverage.unmappedSpanCount).toBe(1);
  });

  it("marks extracted but unused evidence as uncited", () => {
    const coverage = computeMaterialCitationCoverage(manifest, { span_c: { pageNumber: 3 } }, {});
    expect(coverage.materials[1]).toMatchObject({ status: "uncited", spanCount: 1, citedSpanCount: 0 });
  });
});
