import type { SourceDocument, SourceMediaType } from "./contracts";
import { SourceMediaTypeSchema } from "./contracts";
import { MAX_SOURCE_BYTES, SourceIngestionError } from "./limits";
import { createSourceDocument } from "./normalize";
import { extractSelectablePdfPages } from "./pdf";

const encoder = new TextEncoder();

export async function ingestTextSource(input: {
  title: string;
  text: string;
  mediaType?: "text/plain" | "text/markdown";
  originalFileName?: string | null;
  createdAt?: string;
}): Promise<SourceDocument> {
  const bytes = encoder.encode(input.text);
  return createSourceDocument({
    title: input.title,
    mediaType: input.mediaType ?? "text/plain",
    rawPages: [input.text],
    byteLength: bytes.byteLength,
    originalFileName: input.originalFileName,
    createdAt: input.createdAt,
  });
}

export async function ingestPdfSource(input: {
  title: string;
  bytes: Uint8Array;
  originalFileName?: string | null;
  createdAt?: string;
  language?: string;
}): Promise<SourceDocument> {
  if (input.bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new SourceIngestionError(
      "source_too_large",
      `PDF exceeds the ${MAX_SOURCE_BYTES}-byte limit`,
      { byteLength: input.bytes.byteLength, maxBytes: MAX_SOURCE_BYTES },
    );
  }
  const pages = await extractSelectablePdfPages(input.bytes);
  return createSourceDocument({
    title: input.title,
    mediaType: "application/pdf",
    rawPages: pages,
    byteLength: input.bytes.byteLength,
    originalFileName: input.originalFileName,
    createdAt: input.createdAt,
    language: input.language,
  });
}

export function mediaTypeForFile(file: Pick<File, "name" | "type">): SourceMediaType {
  const declared = SourceMediaTypeSchema.safeParse(file.type);
  if (declared.success) return declared.data;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "text/markdown";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".pdf")) return "application/pdf";
  throw new SourceIngestionError(
    "unsupported_media_type",
    "Supported source types are plain text, Markdown, and selectable-text PDF.",
  );
}

export async function ingestSourceFile(file: File): Promise<SourceDocument> {
  const mediaType = mediaTypeForFile(file);
  if (file.size > MAX_SOURCE_BYTES) {
    throw new SourceIngestionError(
      "source_too_large",
      `File exceeds the ${MAX_SOURCE_BYTES}-byte limit`,
      { byteLength: file.size, maxBytes: MAX_SOURCE_BYTES },
    );
  }
  const title = file.name.replace(/\.(md|markdown|txt|pdf)$/i, "");
  if (mediaType === "application/pdf") {
    return ingestPdfSource({
      title,
      bytes: new Uint8Array(await file.arrayBuffer()),
      originalFileName: file.name,
    });
  }
  return ingestTextSource({
    title,
    text: await file.text(),
    mediaType,
    originalFileName: file.name,
  });
}
