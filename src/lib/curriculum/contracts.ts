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

export const CoursePathSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(160),
  tagline: z.string().min(1).max(220),
  description: z.string().min(1).max(700),
  subject: z.enum(["Arithmetic", "Algebra", "Computer Science"]),
  level: z.enum(["foundation", "developing", "extension"]),
  learnerBand: z.string().min(1).max(100),
  lessonIds: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(2).max(12)
    .refine((ids) => new Set(ids).size === ids.length, "Course lesson ids must be unique."),
  prerequisites: z.array(z.string().min(1).max(160)).max(8),
  outcomes: z.array(z.string().min(1).max(240)).min(2).max(8),
  estimatedMinutes: z.number().int().min(10).max(600),
  sourceLabels: z.array(z.string().min(1).max(200)).min(1).max(8),
  evidenceBoundary: z.string().min(1).max(300),
}).strict();

export type CoursePath = z.infer<typeof CoursePathSchema>;
