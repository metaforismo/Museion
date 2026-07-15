import { z } from "zod";

import {
  SourceDocumentSchema,
  SourceSpanSchema,
  type SourceDocument,
} from "@/lib/source";
import { validateSourceSpan } from "@/lib/source/spans";

const IdSchema = z.string().regex(/^[a-z][a-z0-9_-]{0,159}$/);
const EvidenceSchema = z
  .object({
    spanId: IdSchema,
    support: z.enum(["direct", "partial"]),
  })
  .strict();

export const SourceConceptSchema = z
  .object({
    id: IdSchema,
    label: z.string().min(1).max(160),
    definition: z.string().min(1).max(1_200),
    evidence: z.array(EvidenceSchema).min(1).max(12),
  })
  .strict();

export const SourceClaimSchema = z
  .object({
    id: IdSchema,
    text: z.string().min(1).max(1_200),
    conceptIds: z.array(IdSchema).min(1).max(12),
    evidence: z.array(EvidenceSchema).min(1).max(12),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export const SourceGraphSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    sourceId: z.string().regex(/^src_[a-f0-9]{24}$/),
    spans: z.record(IdSchema, SourceSpanSchema),
    concepts: z.array(SourceConceptSchema).min(1).max(40),
    claims: z.array(SourceClaimSchema).min(1).max(120),
    prerequisiteEdges: z
      .array(
        z
          .object({
            fromConceptId: IdSchema,
            toConceptId: IdSchema,
            rationale: z.string().min(1).max(600),
            evidence: z.array(EvidenceSchema).min(1).max(12),
          })
          .strict(),
      )
      .max(80),
    warnings: z
      .array(
        z
          .object({
            code: z.enum([
              "ambiguous_source",
              "contradictory_source",
              "missing_prerequisite",
              "insufficient_evidence",
              "possible_source_injection",
            ]),
            message: z.string().min(1).max(600),
            spanIds: z.array(IdSchema).max(12),
            blocking: z.boolean(),
          })
          .strict(),
      )
      .max(40),
  })
  .strict();

export type SourceGraph = z.infer<typeof SourceGraphSchema>;

export interface GraphIssue {
  code: "source_mismatch" | "invalid_span" | "unknown_span" | "unknown_concept" | "duplicate_id" | "blocking_source_warning";
  path: string;
  message: string;
  blocking: true;
}

export async function validateSourceGraph(
  document: SourceDocument,
  candidate: unknown,
): Promise<GraphIssue[]> {
  SourceDocumentSchema.parse(document);
  const graph = SourceGraphSchema.parse(candidate);
  const issues: GraphIssue[] = [];
  if (graph.sourceId !== document.id) {
    issues.push({ code: "source_mismatch", path: "sourceId", message: "Graph source does not match the document", blocking: true });
  }

  const spanIds = new Set(Object.keys(graph.spans));
  for (const [spanId, span] of Object.entries(graph.spans)) {
    const spanIssues = await validateSourceSpan(document, span);
    if (spanIssues.length) {
      issues.push({ code: "invalid_span", path: `spans.${spanId}`, message: spanIssues.join(", "), blocking: true });
    }
  }

  const conceptIds = new Set<string>();
  for (const [index, concept] of graph.concepts.entries()) {
    if (conceptIds.has(concept.id)) {
      issues.push({ code: "duplicate_id", path: `concepts[${index}].id`, message: `Duplicate concept ${concept.id}`, blocking: true });
    }
    conceptIds.add(concept.id);
  }
  const claimIds = new Set<string>();
  graph.claims.forEach((claim, index) => {
    if (claimIds.has(claim.id)) {
      issues.push({ code: "duplicate_id", path: `claims[${index}].id`, message: `Duplicate claim ${claim.id}`, blocking: true });
    }
    claimIds.add(claim.id);
  });

  const evidenceOwners = [
    ...graph.concepts.map((value, index) => ({ path: `concepts[${index}]`, value })),
    ...graph.claims.map((value, index) => ({ path: `claims[${index}]`, value })),
    ...graph.prerequisiteEdges.map((value, index) => ({ path: `prerequisiteEdges[${index}]`, value })),
  ];
  for (const owner of evidenceOwners) {
    owner.value.evidence.forEach((reference, index) => {
      if (!spanIds.has(reference.spanId)) {
        issues.push({ code: "unknown_span", path: `${owner.path}.evidence[${index}].spanId`, message: `Unknown span ${reference.spanId}`, blocking: true });
      }
    });
  }
  graph.claims.forEach((claim, claimIndex) => {
    claim.conceptIds.forEach((conceptId, conceptIndex) => {
      if (!conceptIds.has(conceptId)) {
        issues.push({ code: "unknown_concept", path: `claims[${claimIndex}].conceptIds[${conceptIndex}]`, message: `Unknown concept ${conceptId}`, blocking: true });
      }
    });
  });
  graph.prerequisiteEdges.forEach((edge, index) => {
    for (const field of ["fromConceptId", "toConceptId"] as const) {
      if (!conceptIds.has(edge[field])) {
        issues.push({ code: "unknown_concept", path: `prerequisiteEdges[${index}].${field}`, message: `Unknown concept ${edge[field]}`, blocking: true });
      }
    }
  });
  graph.warnings.forEach((warning, warningIndex) => {
    if (warning.blocking) {
      issues.push({ code: "blocking_source_warning", path: `warnings[${warningIndex}]`, message: warning.message, blocking: true });
    }
    warning.spanIds.forEach((spanId, spanIndex) => {
      if (!spanIds.has(spanId)) {
        issues.push({ code: "unknown_span", path: `warnings[${warningIndex}].spanIds[${spanIndex}]`, message: `Unknown span ${spanId}`, blocking: true });
      }
    });
  });
  return issues;
}
