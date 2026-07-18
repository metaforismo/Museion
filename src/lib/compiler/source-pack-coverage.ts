import type { SourcePackManifest } from "@/lib/source";

export type MaterialCitationCoverage = {
  materialId: string;
  title: string;
  spanCount: number;
  citedSpanCount: number;
  citedBlockCount: number;
  coveragePercent: number;
  status: "cited" | "uncited" | "no-extracted-spans";
};

export function computeMaterialCitationCoverage(
  manifest: SourcePackManifest,
  spans: Record<string, { pageNumber: number }>,
  blocks: Record<string, { id: string; citations: Array<{ spanId: string }> }>,
) {
  const citedSpanToBlocks = new Map<string, Set<string>>();
  for (const block of Object.values(blocks)) {
    for (const citation of block.citations) {
      const blockIds = citedSpanToBlocks.get(citation.spanId) ?? new Set<string>();
      blockIds.add(block.id);
      citedSpanToBlocks.set(citation.spanId, blockIds);
    }
  }
  const materials: MaterialCitationCoverage[] = manifest.materials.map((material) => {
    const spanIds = Object.entries(spans)
      .filter(([, span]) => span.pageNumber >= material.compiledPageStart && span.pageNumber <= material.compiledPageEnd)
      .map(([spanId]) => spanId);
    const citedSpanIds = spanIds.filter((spanId) => citedSpanToBlocks.has(spanId));
    const citedBlockIds = new Set(citedSpanIds.flatMap((spanId) => [...(citedSpanToBlocks.get(spanId) ?? [])]));
    return {
      materialId: material.id,
      title: material.title,
      spanCount: spanIds.length,
      citedSpanCount: citedSpanIds.length,
      citedBlockCount: citedBlockIds.size,
      coveragePercent: spanIds.length === 0 ? 0 : Math.round((citedSpanIds.length / spanIds.length) * 100),
      status: spanIds.length === 0 ? "no-extracted-spans" : citedSpanIds.length === 0 ? "uncited" : "cited",
    };
  });
  const unmappedSpanCount = Object.values(spans).filter((span) =>
    !manifest.materials.some((material) => span.pageNumber >= material.compiledPageStart && span.pageNumber <= material.compiledPageEnd),
  ).length;
  return { materials, unmappedSpanCount };
}
