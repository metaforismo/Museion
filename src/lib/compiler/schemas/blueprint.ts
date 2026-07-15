import { z } from "zod";

const IdSchema = z.string().regex(/^[a-z][a-z0-9_-]{0,159}$/);

export const CourseBlueprintSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    sourceGraphSha256: z.string().regex(/^[a-f0-9]{64}$/),
    title: z.string().min(1).max(200),
    audience: z
      .object({
        level: z.enum(["novice", "intermediate", "advanced"]),
        language: z.string().min(2).max(35),
        targetMinutes: z.number().int().min(3).max(60),
        learnerGoal: z.string().min(1).max(600),
      })
      .strict(),
    bigQuestion: z.string().min(1).max(300),
    objectives: z
      .array(
        z
          .object({
            id: IdSchema,
            statement: z.string().min(1).max(300),
            conceptIds: z.array(IdSchema).min(1).max(12),
            evidenceTarget: z.enum(["guided_practice", "self_explanation", "near_transfer"]),
          })
          .strict(),
      )
      .min(1)
      .max(12),
    sequence: z.array(IdSchema).min(1).max(12),
    ahaMoment: z.string().min(1).max(600),
  })
  .strict();

export type CourseBlueprint = z.infer<typeof CourseBlueprintSchema>;
