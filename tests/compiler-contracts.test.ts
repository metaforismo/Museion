import { describe, expect, it } from "vitest";

import {
  CourseBlueprintSchema,
  SourceGraphSchema,
  canonicalJson,
  canonicalSha256,
  validateSourceGraph,
} from "@/lib/compiler";
import {
  SourceDocumentSchema,
  ingestPdfSource,
  ingestTextSource,
  resolveExactSourceSpan,
} from "@/lib/source";
import goldenDocumentJson from "./fixtures/binary-search-source-document.json";
import goldenGraphJson from "./fixtures/binary-search-source-graph.json";

describe("compiler boundary contracts", () => {
  it("serializes object keys canonically without reordering arrays", async () => {
    const left = { z: [2, 1], a: { y: true, x: "value" } };
    const right = { a: { x: "value", y: true }, z: [2, 1] };
    expect(canonicalJson(left)).toBe(canonicalJson(right));
    expect(await canonicalSha256(left)).toBe(await canonicalSha256(right));
  });

  it("accepts an exact cited graph and blocks forged references", async () => {
    const document = await ingestTextSource({
      title: "Binary search",
      text: "Binary search keeps the target inside an inclusive active interval.",
      mediaType: "text/plain",
    });
    const span = await resolveExactSourceSpan(document, {
      pageNumber: 1,
      exactText: "inclusive active interval",
    });
    const graph = {
      schemaVersion: "1.0",
      sourceId: document.id,
      spans: { span_interval: span },
      concepts: [{ id: "active_interval", label: "Active interval", definition: "The region still under consideration.", evidence: [{ spanId: "span_interval", support: "direct" }] }],
      claims: [{ id: "claim_invariant", text: "The target remains inside the active interval.", conceptIds: ["active_interval"], evidence: [{ spanId: "span_interval", support: "partial" }], confidence: 0.9 }],
      prerequisiteEdges: [],
      warnings: [],
    };
    expect(await validateSourceGraph(document, graph)).toEqual([]);
    graph.claims[0].evidence[0].spanId = "span_missing";
    expect((await validateSourceGraph(document, graph)).map((issue) => issue.code)).toContain("unknown_span");
  });

  it("rejects unknown blueprint fields", () => {
    expect(() =>
      CourseBlueprintSchema.parse({
        schemaVersion: "1.0",
        sourceGraphSha256: "a".repeat(64),
        title: "Binary search",
        audience: { level: "novice", language: "en", targetMinutes: 8, learnerGoal: "Apply the invariant" },
        bigQuestion: "How can we discard half safely?",
        objectives: [{ id: "objective_1", statement: "Maintain the invariant", conceptIds: ["active_interval"], evidenceTarget: "near_transfer" }],
        sequence: ["objective_1"],
        ahaMoment: "Discarding half is safe only because the invariant survives.",
        executableCode: "alert(1)",
      }),
    ).toThrow();
  });

  it("validates the checked-in six-page golden Source Graph end to end", async () => {
    const document = SourceDocumentSchema.parse(goldenDocumentJson);
    const graph = SourceGraphSchema.parse(goldenGraphJson);
    expect(document.pages).toHaveLength(6);
    expect(Object.keys(graph.spans)).toHaveLength(9);
    expect(await validateSourceGraph(document, graph)).toEqual([]);
  });

  it("reproduces the checked-in normalized document from the original PDF", async () => {
    const fixtureUrl = new URL("./fixtures/binary-search-golden-source.pdf", import.meta.url);
    const bytes = new Uint8Array(await import("node:fs/promises").then((fs) => fs.readFile(fixtureUrl)));
    const generated = await ingestPdfSource({
      title: "Binary Search: Invariants, Boundaries, and Off-by-One Errors",
      bytes,
      originalFileName: "binary-search-golden-source.pdf",
      createdAt: "2026-07-15T00:00:00.000Z",
      language: "en",
    });
    expect(generated).toEqual(SourceDocumentSchema.parse(goldenDocumentJson));
  });
});
