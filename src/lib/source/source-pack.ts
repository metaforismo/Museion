import { z } from "zod";

import { canonicalSha256 } from "@/lib/compiler/canonical";

import { SourceDocumentSchema, SourceReferenceSchema, type SourceDocument } from "./contracts";
import { ingestTextSource } from "./ingest";
import { createSourceDocument } from "./normalize";

export const SourceRightsBasisSchema = z.enum([
  "creator-owned",
  "licensed",
  "open-licensed",
  "public-domain",
  "authorized-excerpt",
  "personal-notes",
]);

export const SourcePackMaterialInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(200_000),
  mediaType: z.enum(["text/plain", "text/markdown"]).default("text/markdown"),
  role: z.enum(["primary-source", "transcript", "excerpt", "notes"]).default("primary-source"),
  reference: SourceReferenceSchema.optional(),
}).strict();

export const SourcePackInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(600).default(""),
  materials: z.array(SourcePackMaterialInputSchema).min(1).max(8),
  rights: z.object({
    confirmed: z.literal(true),
    basis: SourceRightsBasisSchema,
    notes: z.string().trim().max(600).default(""),
  }).strict(),
}).strict();

export const SourcePackMaterialSchema = z.object({
  id: z.string().regex(/^material_[a-f0-9]{24}$/),
  title: z.string().min(1).max(200),
  role: z.enum(["primary-source", "transcript", "excerpt", "notes"]),
  document: SourceDocumentSchema,
}).strict();

export const SourcePackSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().regex(/^pack_[a-f0-9]{24}$/),
  title: z.string().min(1).max(200),
  description: z.string().max(600),
  materials: z.array(SourcePackMaterialSchema).min(1).max(8),
  rights: z.object({
    confirmed: z.literal(true),
    basis: SourceRightsBasisSchema,
    notes: z.string().max(600),
  }).strict(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.string().datetime(),
}).strict();

export type SourcePackInput = z.input<typeof SourcePackInputSchema>;
export type SourcePack = z.infer<typeof SourcePackSchema>;

export async function createSourcePack(input: SourcePackInput, createdAt = new Date().toISOString()): Promise<SourcePack> {
  const parsed = SourcePackInputSchema.parse(input);
  const documents = await Promise.all(parsed.materials.map((material) => ingestTextSource({
    title: material.title,
    text: material.content,
    mediaType: material.mediaType,
    sourceReference: material.reference,
    createdAt,
  })));
  const materialRecords = await Promise.all(documents.map(async (document, index) => {
    const hash = await canonicalSha256({ documentSha256: document.sha256, role: parsed.materials[index].role });
    return {
      id: `material_${hash.slice(0, 24)}`,
      title: parsed.materials[index].title,
      role: parsed.materials[index].role,
      document,
    };
  }));
  const sha256 = await canonicalSha256({
    schemaVersion: "1.0",
    title: parsed.title,
    description: parsed.description,
    materials: materialRecords.map((material) => ({
      id: material.id,
      role: material.role,
      documentSha256: material.document.sha256,
      reference: material.document.sourceReference ?? null,
    })),
    rights: parsed.rights,
  });
  return SourcePackSchema.parse({
    schemaVersion: "1.0",
    id: `pack_${sha256.slice(0, 24)}`,
    title: parsed.title,
    description: parsed.description,
    materials: materialRecords,
    rights: parsed.rights,
    sha256,
    createdAt,
  });
}

/** Flattens an inspected pack into the compiler's canonical document boundary. */
export async function sourcePackToDocument(pack: SourcePack): Promise<SourceDocument> {
  const parsed = SourcePackSchema.parse(pack);
  const rawPages = parsed.materials.flatMap((material, materialIndex) =>
    material.document.pages.map((page, pageIndex) => {
      const heading = pageIndex === 0
        ? `Material ${materialIndex + 1}: ${material.title} (${material.role})\n\n`
        : "";
      return `${heading}${page.text}`;
    }),
  );
  return createSourceDocument({
    title: parsed.title,
    mediaType: "text/markdown",
    rawPages,
    byteLength: parsed.materials.reduce((total, material) => total + material.document.byteLength, 0),
    originalFileName: `${parsed.materials.length} source-pack materials`,
    sourceReference: parsed.materials.length === 1 ? parsed.materials[0].document.sourceReference : undefined,
    createdAt: parsed.createdAt,
  });
}

export function publicSourcePackSummary(pack: SourcePack) {
  return {
    schemaVersion: pack.schemaVersion,
    id: pack.id,
    title: pack.title,
    description: pack.description,
    sha256: pack.sha256,
    rights: pack.rights,
    materialCount: pack.materials.length,
    materials: pack.materials.map((material) => ({
      id: material.id,
      title: material.title,
      role: material.role,
      pages: material.document.pages.length,
      characters: material.document.charCount,
      sha256: material.document.sha256,
      reference: material.document.sourceReference ?? null,
      warnings: material.document.warnings,
    })),
  };
}
