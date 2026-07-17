import { z } from "zod";

export const ArtifactIdSchema = z.string().regex(/^[a-z][a-z0-9_-]{0,159}$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const CitationSchema = z
  .object({
    spanId: ArtifactIdSchema,
    purpose: z.enum(["definition", "claim", "example", "instruction"]),
  })
  .strict();

const CommonBlockShape = {
  id: ArtifactIdSchema,
  objectiveIds: z.array(ArtifactIdSchema).min(1).max(12),
  conceptIds: z.array(ArtifactIdSchema).min(1).max(12),
  citations: z.array(CitationSchema).max(12),
  estimatedSeconds: z.number().int().min(10).max(600),
  accessibilityLabel: z.string().min(1).max(300),
};

export const ExplanationBlockSchema = z
  .object({
    ...CommonBlockShape,
    kind: z.literal("explanation"),
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(2_500),
  })
  .strict();

export const GuidedResponseBlockSchema = z
  .object({
    ...CommonBlockShape,
    kind: z.literal("guided-response"),
    prompt: z.string().min(1).max(1_200),
    responseKind: z.enum(["numeric", "multiple-choice", "expression"]),
    options: z.array(z.string().min(1).max(240)).max(8),
    answerSpecId: ArtifactIdSchema,
    solution: z.string().min(1).max(2_500),
    hints: z.array(z.string().min(1).max(600)).max(6),
    misconceptionIds: z.array(ArtifactIdSchema).max(12),
  })
  .strict();

export const PredictionChoiceBlockSchema = z
  .object({
    ...CommonBlockShape,
    kind: z.literal("prediction-choice"),
    prompt: z.string().min(1).max(600),
    options: z.array(z.string().min(1).max(240)).min(2).max(6),
    correctIndex: z.number().int().nonnegative(),
    reveal: z.string().min(1).max(1_200),
    misconceptionByIndex: z.record(z.string(), ArtifactIdSchema),
  })
  .strict();

export const SequenceBuilderBlockSchema = z
  .object({
    ...CommonBlockShape,
    kind: z.literal("sequence-builder"),
    prompt: z.string().min(1).max(600),
    items: z
      .array(z.object({ id: ArtifactIdSchema, label: z.string().min(1).max(240) }).strict())
      .min(2)
      .max(10),
    correctOrder: z.array(ArtifactIdSchema).min(2).max(10),
  })
  .strict();

const RangeStateSchema = z
  .object({ low: z.number().int().nonnegative(), high: z.number().int().nonnegative() })
  .strict();

export const RangeExplorerBlockSchema = z
  .object({
    ...CommonBlockShape,
    kind: z.literal("range-explorer"),
    prompt: z.string().min(1).max(600),
    values: z.array(z.number()).min(3).max(31),
    target: z.number(),
    initialState: RangeStateSchema,
    learnerTask: z.enum(["choose-mid", "update-low", "update-high", "complete-search"]),
    midpointPolicy: z.enum(["floor", "ceiling"]),
    misconceptionRules: z.array(z.object({ id: ArtifactIdSchema, when: z.enum(["mid-reused-after-too-large", "mid-reused-after-too-small", "mid-outside-active-range", "wrong-half-discarded"]) }).strict()).max(8),
  })
  .strict();

const TraceStateSchema = z
  .object({
    step: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    mid: z.number().int().nonnegative(),
    comparison: z.enum(["less", "equal", "greater"]),
  })
  .strict();

export const StateTraceBlockSchema = z
  .object({
    ...CommonBlockShape,
    kind: z.literal("state-trace"),
    prompt: z.string().min(1).max(600),
    values: z.array(z.number()).min(3).max(31),
    target: z.number(),
    initialState: TraceStateSchema.omit({ comparison: true }),
    expectedStates: z.array(TraceStateSchema).min(1).max(20),
    midpointPolicy: z.enum(["floor", "ceiling"]),
    terminalCondition: z.enum(["found", "absent"]),
    responseMode: z.enum(["predict-next-state", "fill-state-table"]),
  })
  .strict();

export const TransferChallengeBlockSchema = z
  .object({
    ...CommonBlockShape,
    kind: z.literal("transfer-challenge"),
    prompt: z.string().min(1).max(1_200),
    responseKind: z.enum(["numeric", "multiple-choice", "expression"]),
    options: z.array(z.string().min(1).max(240)).max(8),
    answerSpecId: ArtifactIdSchema,
    deepStructureTags: z.array(ArtifactIdSchema).min(1).max(12),
    sourceSurfaceDifference: z.string().min(1).max(600),
    assistancePolicy: z.literal("none"),
  })
  .strict();

export const LearningBlockSchema = z.discriminatedUnion("kind", [
  ExplanationBlockSchema,
  GuidedResponseBlockSchema,
  PredictionChoiceBlockSchema,
  SequenceBuilderBlockSchema,
  RangeExplorerBlockSchema,
  StateTraceBlockSchema,
  TransferChallengeBlockSchema,
]);

export const AnswerSpecSchema = z.discriminatedUnion("kind", [
  z.object({ id: ArtifactIdSchema, kind: z.literal("numeric"), value: z.number(), tolerance: z.number().nonnegative() }).strict(),
  z.object({ id: ArtifactIdSchema, kind: z.literal("multiple-choice"), correctIndex: z.number().int().nonnegative() }).strict(),
  z.object({ id: ArtifactIdSchema, kind: z.literal("expression"), acceptedForms: z.array(z.string().min(1)).min(1).max(20) }).strict(),
  z.object({ id: ArtifactIdSchema, kind: z.literal("sequence"), correctOrder: z.array(ArtifactIdSchema).min(2).max(10) }).strict(),
]);

export const ArtifactMisconceptionSchema = z
  .object({
    id: ArtifactIdSchema,
    conceptId: ArtifactIdSchema,
    triggerAnswers: z.array(z.string().min(1)).max(20),
    description: z.string().min(1).max(1_000),
    remediationFocus: z.string().min(1).max(1_000),
    citations: z.array(CitationSchema).max(12),
  })
  .strict();

export const CourseArtifactV2Schema = z
  .object({
    schemaVersion: z.literal("2.0"),
    id: ArtifactIdSchema,
    title: z.string().min(1).max(200),
    source: z
      .object({
        origin: z.enum(["source_graph", "legacy_v1"]),
        sourceId: z.string().min(1).max(200),
        sourceSha256: Sha256Schema,
        sourceGraphSha256: Sha256Schema.nullable(),
      })
      .strict(),
    audience: z.object({ level: z.enum(["novice", "intermediate", "advanced"]), language: z.string().min(2).max(35), targetMinutes: z.number().int().min(3).max(60), learnerGoal: z.string().min(1).max(600) }).strict(),
    description: z.string().min(1).max(1_200),
    bigQuestion: z.string().min(1).max(300),
    objectives: z.array(z.object({ id: ArtifactIdSchema, statement: z.string().min(1).max(300), conceptIds: z.array(ArtifactIdSchema).min(1).max(12) }).strict()).min(1).max(20),
    concepts: z.array(z.object({ id: ArtifactIdSchema, label: z.string().min(1).max(160), prerequisiteIds: z.array(ArtifactIdSchema).max(12), sourceConceptId: ArtifactIdSchema.nullable() }).strict()).min(1).max(40),
    lessons: z.array(z.object({ id: ArtifactIdSchema, title: z.string().min(1).max(160), objectiveIds: z.array(ArtifactIdSchema).min(1), blockIds: z.array(ArtifactIdSchema).min(1) }).strict()).min(1).max(12),
    blocks: z.record(ArtifactIdSchema, LearningBlockSchema),
    answerSpecs: z.record(ArtifactIdSchema, AnswerSpecSchema),
    misconceptions: z.record(ArtifactIdSchema, ArtifactMisconceptionSchema),
    transferBlockIds: z.array(ArtifactIdSchema),
    validation: z.object({ validatorVersion: z.string().min(1), status: z.enum(["accepted", "rejected", "needs-review"]), blockingIssueCount: z.number().int().nonnegative(), warningCount: z.number().int().nonnegative(), validatedAt: z.string().datetime() }).strict(),
    provenance: z.object({ compilerVersion: z.string().min(1), promptBundleVersion: z.string().min(1), model: z.string().min(1), generatedAt: z.string().datetime(), deterministicSeed: z.string().min(1), generationRunId: z.string().min(1) }).strict(),
  })
  .strict();

export type CourseArtifactV2 = z.infer<typeof CourseArtifactV2Schema>;
export const GeneratedCourseCandidateSchema = CourseArtifactV2Schema.omit({ validation: true, provenance: true }).strict();
export type GeneratedCourseCandidate = z.infer<typeof GeneratedCourseCandidateSchema>;
export type LearningBlock = z.infer<typeof LearningBlockSchema>;

export interface ArtifactIssue {
  code: "record_key_mismatch" | "dangling_reference" | "citation_not_found" | "missing_citation" | "invalid_answer_spec" | "missing_transfer" | "invalid_source_provenance" | "source_id_mismatch" | "source_hash_mismatch" | "source_graph_hash_mismatch" | "unsupported_learner_structure";
  path: string;
  message: string;
  severity: "blocking";
}

export interface ArtifactSourceBinding {
  sourceId: string;
  sourceSha256: string;
  sourceGraphSha256: string;
}

export function validateArtifactReferences(
  artifact: CourseArtifactV2,
  knownSpanIds: ReadonlySet<string>,
  binding?: ArtifactSourceBinding,
): ArtifactIssue[] {
  const issues: ArtifactIssue[] = [];
  const objectiveIds = new Set(artifact.objectives.map((item) => item.id));
  const conceptIds = new Set(artifact.concepts.map((item) => item.id));
  const answerSpecIds = new Set(Object.keys(artifact.answerSpecs));
  const misconceptionIds = new Set(Object.keys(artifact.misconceptions));
  if (artifact.source.origin === "source_graph" && artifact.lessons.length !== 1) {
    issues.push({ code: "unsupported_learner_structure", path: "lessons", message: "The current learner experience requires exactly one lesson", severity: "blocking" });
  }
  if ((artifact.source.origin === "source_graph") !== (artifact.source.sourceGraphSha256 !== null)) {
    issues.push({ code: "invalid_source_provenance", path: "source.sourceGraphSha256", message: "Only source-graph artifacts may carry a Source Graph hash", severity: "blocking" });
  }
  if (artifact.source.origin === "source_graph" && binding) {
    if (artifact.source.sourceId !== binding.sourceId) issues.push({ code: "source_id_mismatch", path: "source.sourceId", message: "Artifact source id does not match the validated document", severity: "blocking" });
    if (artifact.source.sourceSha256 !== binding.sourceSha256) issues.push({ code: "source_hash_mismatch", path: "source.sourceSha256", message: "Artifact source hash does not match the validated document", severity: "blocking" });
    if (artifact.source.sourceGraphSha256 !== binding.sourceGraphSha256) issues.push({ code: "source_graph_hash_mismatch", path: "source.sourceGraphSha256", message: "Artifact Source Graph hash does not match the validated graph", severity: "blocking" });
  }
  for (const [key, value] of [...Object.entries(artifact.blocks), ...Object.entries(artifact.answerSpecs), ...Object.entries(artifact.misconceptions)]) {
    if (key !== value.id) issues.push({ code: "record_key_mismatch", path: key, message: `Record key ${key} does not match id ${value.id}`, severity: "blocking" });
  }
  artifact.lessons.forEach((lesson, lessonIndex) => {
    lesson.objectiveIds.forEach((id) => {
      if (!objectiveIds.has(id)) issues.push({ code: "dangling_reference", path: `lessons[${lessonIndex}].objectiveIds`, message: `Unknown objective ${id}`, severity: "blocking" });
    });
    lesson.blockIds.forEach((id) => {
      if (!artifact.blocks[id]) issues.push({ code: "dangling_reference", path: `lessons[${lessonIndex}].blockIds`, message: `Unknown block ${id}`, severity: "blocking" });
      if (artifact.source.origin === "source_graph" && (artifact.blocks[id]?.kind === "guided-response" || artifact.blocks[id]?.kind === "transfer-challenge")) {
        issues.push({ code: "unsupported_learner_structure", path: `lessons[${lessonIndex}].blockIds`, message: `${artifact.blocks[id].kind} must not appear in the guided lesson sequence`, severity: "blocking" });
      }
    });
  });
  artifact.objectives.forEach((objective, objectiveIndex) => {
    objective.conceptIds.forEach((id) => {
      if (!conceptIds.has(id)) issues.push({ code: "dangling_reference", path: `objectives[${objectiveIndex}].conceptIds`, message: `Unknown concept ${id}`, severity: "blocking" });
    });
  });
  artifact.concepts.forEach((concept, conceptIndex) => {
    concept.prerequisiteIds.forEach((id) => {
      if (!conceptIds.has(id)) issues.push({ code: "dangling_reference", path: `concepts[${conceptIndex}].prerequisiteIds`, message: `Unknown concept ${id}`, severity: "blocking" });
    });
  });
  for (const [blockId, block] of Object.entries(artifact.blocks)) {
    if (artifact.source.origin === "source_graph" && block.citations.length === 0) {
      issues.push({ code: "missing_citation", path: `blocks.${blockId}.citations`, message: "Every source-grounded block requires at least one validated citation", severity: "blocking" });
    }
    block.objectiveIds.forEach((id) => {
      if (!objectiveIds.has(id)) issues.push({ code: "dangling_reference", path: `blocks.${blockId}.objectiveIds`, message: `Unknown objective ${id}`, severity: "blocking" });
    });
    block.conceptIds.forEach((id) => {
      if (!conceptIds.has(id)) issues.push({ code: "dangling_reference", path: `blocks.${blockId}.conceptIds`, message: `Unknown concept ${id}`, severity: "blocking" });
    });
    block.citations.forEach((citation, index) => {
      if (!knownSpanIds.has(citation.spanId)) issues.push({ code: "citation_not_found", path: `blocks.${blockId}.citations[${index}]`, message: `Unknown span ${citation.spanId}`, severity: "blocking" });
    });
    if ((block.kind === "guided-response" || block.kind === "transfer-challenge") && !answerSpecIds.has(block.answerSpecId)) {
      issues.push({ code: "invalid_answer_spec", path: `blocks.${blockId}.answerSpecId`, message: `Unknown answer spec ${block.answerSpecId}`, severity: "blocking" });
    }
    if (block.kind === "guided-response" || block.kind === "transfer-challenge") {
      const spec = artifact.answerSpecs[block.answerSpecId];
      if (spec && spec.kind !== block.responseKind) {
        issues.push({ code: "invalid_answer_spec", path: `blocks.${blockId}.responseKind`, message: `Response kind ${block.responseKind} does not match answer spec ${spec.kind}`, severity: "blocking" });
      }
      if (block.responseKind === "multiple-choice" && (block.options.length < 2 || (spec?.kind === "multiple-choice" && spec.correctIndex >= block.options.length))) {
        issues.push({ code: "invalid_answer_spec", path: `blocks.${blockId}.options`, message: "Multiple-choice blocks require at least two options and a correct index inside the option list", severity: "blocking" });
      }
    }
    if (block.kind === "prediction-choice" && block.correctIndex >= block.options.length) {
      issues.push({ code: "invalid_answer_spec", path: `blocks.${blockId}.correctIndex`, message: "Correct index is outside the option list", severity: "blocking" });
    }
    const referencedMisconceptions =
      block.kind === "guided-response"
        ? block.misconceptionIds
        : block.kind === "prediction-choice"
          ? Object.values(block.misconceptionByIndex)
          : block.kind === "range-explorer"
            ? block.misconceptionRules.map((rule) => rule.id)
            : [];
    referencedMisconceptions.forEach((id) => {
      if (!misconceptionIds.has(id)) issues.push({ code: "dangling_reference", path: `blocks.${blockId}`, message: `Unknown misconception ${id}`, severity: "blocking" });
    });
  }
  for (const [id, misconception] of Object.entries(artifact.misconceptions)) {
    if (!conceptIds.has(misconception.conceptId)) issues.push({ code: "dangling_reference", path: `misconceptions.${id}.conceptId`, message: `Unknown concept ${misconception.conceptId}`, severity: "blocking" });
    misconception.citations.forEach((citation, index) => {
      if (!knownSpanIds.has(citation.spanId)) issues.push({ code: "citation_not_found", path: `misconceptions.${id}.citations[${index}]`, message: `Unknown span ${citation.spanId}`, severity: "blocking" });
    });
  }
  artifact.transferBlockIds.forEach((id) => {
    if (artifact.blocks[id]?.kind !== "transfer-challenge") issues.push({ code: "missing_transfer", path: "transferBlockIds", message: `${id} is not a transfer challenge`, severity: "blocking" });
  });
  if (artifact.source.origin === "source_graph" && artifact.transferBlockIds.length === 0) {
    issues.push({ code: "missing_transfer", path: "transferBlockIds", message: "Source-grounded artifacts require at least one transfer challenge", severity: "blocking" });
  }
  return issues;
}
