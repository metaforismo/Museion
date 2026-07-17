export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_SOURCE_PAGES = 30;
export const MAX_NORMALIZED_CHARACTERS = 140_000;
export const MAX_SOURCE_TITLE_CHARACTERS = 200;

export type SourceErrorCode =
  | "empty_source"
  | "source_too_large"
  | "too_many_pages"
  | "textless_pdf"
  | "unsupported_media_type"
  | "invalid_pdf"
  | "invalid_source"
  | "quote_not_found"
  | "ambiguous_quote";

export class SourceIngestionError extends Error {
  constructor(
    readonly code: SourceErrorCode,
    message: string,
    readonly details: Record<string, number | string> = {},
  ) {
    super(message);
    this.name = "SourceIngestionError";
  }
}
