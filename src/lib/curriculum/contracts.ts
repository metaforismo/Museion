import { z } from "zod";

export const CurriculumNodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(160),
  subject: z.enum(["Arithmetic", "Algebra", "Computer Science"]),
  level: z.enum(["foundation", "developing", "extension"]),
  lessonId: z.string().regex(/^[a-z0-9-]+$/).nullable(),
  prerequisiteIds: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(12),
  objective: z.string().min(1).max(300),
  provenance: z.object({
    kind: z.enum(["museion-authored", "external-standard", "external-taxonomy"]),
    label: z.string().min(1).max(200),
    url: z.string().url().nullable(),
  }).strict(),
}).strict();

export type CurriculumNode = z.infer<typeof CurriculumNodeSchema>;

export const CurriculumGraphSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(160),
  nodes: z.array(CurriculumNodeSchema).min(1).max(10_000),
}).strict();

export type CurriculumGraph = z.infer<typeof CurriculumGraphSchema>;
