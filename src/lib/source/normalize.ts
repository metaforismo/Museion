import type {
  SourceDocument,
  SourceMediaType,
  SourcePage,
  SourceWarning,
} from "./contracts";
import {
  SOURCE_NORMALIZATION_VERSION,
  SOURCE_OFFSET_ENCODING,
  SOURCE_SCHEMA_VERSION,
  SourceDocumentSchema,
} from "./contracts";
import { sha256Hex } from "./hash";
import {
  MAX_NORMALIZED_CHARACTERS,
  MAX_SOURCE_BYTES,
  MAX_SOURCE_PAGES,
  MAX_SOURCE_TITLE_CHARACTERS,
  SourceIngestionError,
} from "./limits";

const CONTROL_CHARACTERS = /[\u0000\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const INSTRUCTION_LIKE_CONTENT =
  /\b(ignore (all |any )?(previous|prior) instructions?|system prompt|developer message|reveal (the )?(answer|solution)|act as (an? )?unrestricted)\b/i;

export interface NormalizeResult {
  text: string;
  removedControlCharacters: boolean;
}

/**
 * Canonical text representation used for offsets and hashes.
 * Offsets are JavaScript UTF-16 string indexes and never refer to raw PDF bytes.
 */
export function normalizeSourceText(raw: string): NormalizeResult {
  let removedControlCharacters = false;
  const text = raw
    .replace(/^\ufeff/, "")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARACTERS, () => {
      removedControlCharacters = true;
      return "";
    })
    .normalize("NFC")
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
  return { text, removedControlCharacters };
}

function validateLimits(byteLength: number, pageCount: number): void {
  if (byteLength > MAX_SOURCE_BYTES) {
    throw new SourceIngestionError(
      "source_too_large",
      `Source exceeds the ${MAX_SOURCE_BYTES}-byte limit`,
      { byteLength, maxBytes: MAX_SOURCE_BYTES },
    );
  }
  if (pageCount > MAX_SOURCE_PAGES) {
    throw new SourceIngestionError(
      "too_many_pages",
      `Source exceeds the ${MAX_SOURCE_PAGES}-page limit`,
      { pageCount, maxPages: MAX_SOURCE_PAGES },
    );
  }
}

function sourceWarnings(
  pageNumber: number,
  text: string,
  removedControlCharacters: boolean,
): SourceWarning[] {
  const warnings: SourceWarning[] = [];
  if (removedControlCharacters) {
    warnings.push({
      code: "control_characters_removed",
      pageNumber,
      message: "Unsupported control characters were removed during normalization.",
    });
  }
  if (INSTRUCTION_LIKE_CONTENT.test(text)) {
    warnings.push({
      code: "instruction_like_content",
      pageNumber,
      message:
        "The source contains instruction-like text. It remains untrusted source data.",
    });
  }
  return warnings;
}

export interface CreateSourceDocumentInput {
  title: string;
  mediaType: SourceMediaType;
  rawPages: string[];
  byteLength: number;
  originalFileName?: string | null;
  language?: string;
  createdAt?: string;
}

export async function createSourceDocument(
  input: CreateSourceDocumentInput,
): Promise<SourceDocument> {
  validateLimits(input.byteLength, input.rawPages.length);

  const warnings: SourceWarning[] = [];
  const pages: SourcePage[] = [];
  for (let index = 0; index < input.rawPages.length; index += 1) {
    const normalized = normalizeSourceText(input.rawPages[index]);
    if (!normalized.text) continue;
    const pageNumber = index + 1;
    pages.push({
      pageNumber,
      text: normalized.text,
      sha256: await sha256Hex(normalized.text),
      charCount: normalized.text.length,
    });
    warnings.push(
      ...sourceWarnings(
        pageNumber,
        normalized.text,
        normalized.removedControlCharacters,
      ),
    );
  }

  if (pages.length === 0) {
    throw new SourceIngestionError(
      input.mediaType === "application/pdf" ? "textless_pdf" : "empty_source",
      input.mediaType === "application/pdf"
        ? "The PDF contains no selectable text. OCR is not supported."
        : "The source contains no usable text.",
    );
  }

  const charCount = pages.reduce((total, page) => total + page.charCount, 0);
  if (charCount > MAX_NORMALIZED_CHARACTERS) {
    throw new SourceIngestionError(
      "source_too_large",
      `Normalized source exceeds the ${MAX_NORMALIZED_CHARACTERS}-character limit`,
      { charCount, maxCharacters: MAX_NORMALIZED_CHARACTERS },
    );
  }

  const canonicalPayload = JSON.stringify({
    normalizationVersion: SOURCE_NORMALIZATION_VERSION,
    pages: pages.map(({ pageNumber, text }) => ({ pageNumber, text })),
  });
  const sha256 = await sha256Hex(canonicalPayload);
  const title = input.title.trim().slice(0, MAX_SOURCE_TITLE_CHARACTERS);
  if (!title) {
    throw new SourceIngestionError("empty_source", "The source title is empty.");
  }

  return SourceDocumentSchema.parse({
    schemaVersion: SOURCE_SCHEMA_VERSION,
    normalizationVersion: SOURCE_NORMALIZATION_VERSION,
    offsetEncoding: SOURCE_OFFSET_ENCODING,
    id: `src_${sha256.slice(0, 24)}`,
    title,
    mediaType: input.mediaType,
    originalFileName: input.originalFileName?.trim() || null,
    language: input.language ?? "und",
    sha256,
    byteLength: input.byteLength,
    charCount,
    pages,
    warnings,
    createdAt: input.createdAt ?? new Date().toISOString(),
  });
}

/**
 * Recompute every server-authoritative source field before compilation.
 * A browser may normalize for preview, but it cannot choose hashes or route a
 * request into the golden replay by claiming the fixture digest.
 */
export async function verifySourceDocumentIntegrity(document: SourceDocument): Promise<void> {
  SourceDocumentSchema.parse(document);
  let previousPage = 0;
  let charCount = 0;
  for (const page of document.pages) {
    if (page.pageNumber <= previousPage) throw new SourceIngestionError("invalid_source", "Source pages must be unique and ordered.");
    previousPage = page.pageNumber;
    const normalized = normalizeSourceText(page.text);
    if (normalized.text !== page.text) throw new SourceIngestionError("invalid_source", "Source page text is not canonically normalized.");
    if (page.charCount !== page.text.length) throw new SourceIngestionError("invalid_source", "Source page character count is invalid.");
    if (page.sha256 !== await sha256Hex(page.text)) throw new SourceIngestionError("invalid_source", "Source page hash is invalid.");
    charCount += page.charCount;
  }
  if (charCount !== document.charCount) throw new SourceIngestionError("invalid_source", "Source character count is invalid.");
  const canonicalPayload = JSON.stringify({
    normalizationVersion: SOURCE_NORMALIZATION_VERSION,
    pages: document.pages.map(({ pageNumber, text }) => ({ pageNumber, text })),
  });
  const sha256 = await sha256Hex(canonicalPayload);
  if (document.sha256 !== sha256 || document.id !== `src_${sha256.slice(0, 24)}`) {
    throw new SourceIngestionError("invalid_source", "Source identity does not match its contents.");
  }
}
