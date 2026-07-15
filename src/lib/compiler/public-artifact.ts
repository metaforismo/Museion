import { z } from "zod";

import { ArtifactIdSchema, CitationSchema, CourseArtifactV2Schema, type CourseArtifactV2 } from "./schemas/course-artifact";

const PublicCommon = {
  id: ArtifactIdSchema,
  objectiveIds: z.array(ArtifactIdSchema),
  conceptIds: z.array(ArtifactIdSchema),
  citations: z.array(CitationSchema),
  estimatedSeconds: z.number().int(),
  accessibilityLabel: z.string(),
};

export const PublicLearningBlockSchema = z.discriminatedUnion("kind", [
  z.object({ ...PublicCommon, kind: z.literal("explanation"), title: z.string(), body: z.string() }).strict(),
  z.object({ ...PublicCommon, kind: z.literal("guided-response"), prompt: z.string(), responseKind: z.enum(["numeric", "multiple-choice", "expression"]), options: z.array(z.string()) }).strict(),
  z.object({ ...PublicCommon, kind: z.literal("prediction-choice"), prompt: z.string(), options: z.array(z.string()) }).strict(),
  z.object({ ...PublicCommon, kind: z.literal("sequence-builder"), prompt: z.string(), items: z.array(z.object({ id: ArtifactIdSchema, label: z.string() }).strict()) }).strict(),
  z.object({ ...PublicCommon, kind: z.literal("range-explorer"), prompt: z.string(), values: z.array(z.number()), target: z.number(), initialState: z.object({ low: z.number().int(), high: z.number().int() }).strict(), learnerTask: z.enum(["choose-mid", "update-low", "update-high", "complete-search"]), midpointPolicy: z.enum(["floor", "ceiling"]) }).strict(),
  z.object({ ...PublicCommon, kind: z.literal("state-trace"), prompt: z.string(), values: z.array(z.number()), target: z.number(), initialState: z.object({ step: z.number().int(), low: z.number().int(), high: z.number().int(), mid: z.number().int() }).strict(), responseMode: z.enum(["predict-next-state", "fill-state-table"]) }).strict(),
  z.object({ ...PublicCommon, kind: z.literal("transfer-challenge"), prompt: z.string(), responseKind: z.enum(["numeric", "multiple-choice", "expression"]), options: z.array(z.string()), deepStructureTags: z.array(ArtifactIdSchema), sourceSurfaceDifference: z.string(), assistancePolicy: z.literal("none") }).strict(),
]);

export const PublicCourseArtifactV2Schema = CourseArtifactV2Schema.omit({
  answerSpecs: true,
  misconceptions: true,
}).extend({ blocks: z.record(ArtifactIdSchema, PublicLearningBlockSchema) }).strict();

export type PublicCourseArtifactV2 = z.infer<typeof PublicCourseArtifactV2Schema>;
export type PublicLearningBlock = z.infer<typeof PublicLearningBlockSchema>;

export function toPublicCourseArtifact(artifact: CourseArtifactV2): PublicCourseArtifactV2 {
  const parsed = CourseArtifactV2Schema.parse(artifact);
  const blocks = Object.fromEntries(
    Object.entries(parsed.blocks).map(([id, block]) => {
      const common = { id: block.id, kind: block.kind, objectiveIds: block.objectiveIds, conceptIds: block.conceptIds, citations: block.citations, estimatedSeconds: block.estimatedSeconds, accessibilityLabel: block.accessibilityLabel };
      switch (block.kind) {
        case "explanation": return [id, { ...common, title: block.title, body: block.body }];
        case "guided-response": return [id, { ...common, prompt: block.prompt, responseKind: block.responseKind, options: block.options }];
        case "prediction-choice": return [id, { ...common, prompt: block.prompt, options: block.options }];
        case "sequence-builder": return [id, { ...common, prompt: block.prompt, items: block.items }];
        case "range-explorer": return [id, { ...common, prompt: block.prompt, values: block.values, target: block.target, initialState: block.initialState, learnerTask: block.learnerTask, midpointPolicy: block.midpointPolicy }];
        case "state-trace": return [id, { ...common, prompt: block.prompt, values: block.values, target: block.target, initialState: block.initialState, responseMode: block.responseMode }];
        case "transfer-challenge": return [id, { ...common, prompt: block.prompt, responseKind: block.responseKind, options: block.options, deepStructureTags: block.deepStructureTags, sourceSurfaceDifference: block.sourceSurfaceDifference, assistancePolicy: block.assistancePolicy }];
      }
    }),
  );
  const publicFields = CourseArtifactV2Schema.omit({
    answerSpecs: true,
    misconceptions: true,
  })
    .strip()
    .parse(parsed);
  return PublicCourseArtifactV2Schema.parse({ ...publicFields, blocks });
}
