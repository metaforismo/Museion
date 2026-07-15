import { z } from "zod";

export const SOURCE_SCHEMA_VERSION = "1.0" as const;
export const SOURCE_NORMALIZATION_VERSION = "source-text-v1" as const;
export const SOURCE_OFFSET_ENCODING = "utf-16" as const;

export const SourceMediaTypeSchema = z.enum([
  "text/plain",
  "text/markdown",
  "application/pdf",
]);

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const SourcePageSchema = z
  .object({
    pageNumber: z.number().int().positive(),
    text: z.string().min(1),
    sha256: Sha256Schema,
    charCount: z.number().int().positive(),
  })
  .strict();

export const SourceWarningSchema = z
  .object({
    code: z.enum(["instruction_like_content", "control_characters_removed"]),
    pageNumber: z.number().int().positive(),
    message: z.string().min(1).max(240),
  })
  .strict();

export const SourceDocumentSchema = z
  .object({
    schemaVersion: z.literal(SOURCE_SCHEMA_VERSION),
    normalizationVersion: z.literal(SOURCE_NORMALIZATION_VERSION),
    offsetEncoding: z.literal(SOURCE_OFFSET_ENCODING),
    id: z.string().regex(/^src_[a-f0-9]{24}$/),
    title: z.string().min(1).max(200),
    mediaType: SourceMediaTypeSchema,
    originalFileName: z.string().min(1).max(255).nullable(),
    language: z.string().min(2).max(35),
    sha256: Sha256Schema,
    byteLength: z.number().int().nonnegative(),
    charCount: z.number().int().positive(),
    pages: z.array(SourcePageSchema).min(1).max(30),
    warnings: z.array(SourceWarningSchema),
    createdAt: z.string().datetime(),
  })
  .strict();

export const SourceSpanSchema = z
  .object({
    schemaVersion: z.literal(SOURCE_SCHEMA_VERSION),
    sourceId: z.string().regex(/^src_[a-f0-9]{24}$/),
    pageNumber: z.number().int().positive(),
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    exactText: z.string().min(1),
    sha256: Sha256Schema,
  })
  .strict()
  .refine((span) => span.end > span.start, {
    message: "Span end must be greater than start",
  });

export type SourceMediaType = z.infer<typeof SourceMediaTypeSchema>;
export type SourcePage = z.infer<typeof SourcePageSchema>;
export type SourceWarning = z.infer<typeof SourceWarningSchema>;
export type SourceDocument = z.infer<typeof SourceDocumentSchema>;
export type SourceSpan = z.infer<typeof SourceSpanSchema>;
