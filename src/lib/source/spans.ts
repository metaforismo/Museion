import type { SourceDocument, SourceSpan } from "./contracts";
import {
  SOURCE_SCHEMA_VERSION,
  SourceDocumentSchema,
  SourceSpanSchema,
} from "./contracts";
import { sha256Hex } from "./hash";
import { SourceIngestionError } from "./limits";

export async function resolveExactSourceSpan(
  document: SourceDocument,
  candidate: { pageNumber: number; exactText: string },
): Promise<SourceSpan> {
  SourceDocumentSchema.parse(document);
  const page = document.pages.find(
    (sourcePage) => sourcePage.pageNumber === candidate.pageNumber,
  );
  if (!page || !candidate.exactText) {
    throw new SourceIngestionError(
      "quote_not_found",
      "The quoted text does not exist on the requested source page.",
      { pageNumber: candidate.pageNumber },
    );
  }

  const start = page.text.indexOf(candidate.exactText);
  if (start < 0) {
    throw new SourceIngestionError(
      "quote_not_found",
      "The quoted text does not exist exactly on the requested source page.",
      { pageNumber: candidate.pageNumber },
    );
  }
  if (page.text.indexOf(candidate.exactText, start + 1) >= 0) {
    throw new SourceIngestionError(
      "ambiguous_quote",
      "The quoted text occurs more than once on the requested source page.",
      { pageNumber: candidate.pageNumber },
    );
  }
  const end = start + candidate.exactText.length;
  return SourceSpanSchema.parse({
    schemaVersion: SOURCE_SCHEMA_VERSION,
    sourceId: document.id,
    pageNumber: candidate.pageNumber,
    start,
    end,
    exactText: candidate.exactText,
    sha256: await sha256Hex(candidate.exactText),
  });
}

export async function validateSourceSpan(
  document: SourceDocument,
  span: SourceSpan,
): Promise<string[]> {
  const issues: string[] = [];
  const parsed = SourceSpanSchema.safeParse(span);
  if (!parsed.success) return ["invalid_span_schema"];
  if (span.sourceId !== document.id) issues.push("source_id_mismatch");
  const page = document.pages.find(
    (sourcePage) => sourcePage.pageNumber === span.pageNumber,
  );
  if (!page) return [...issues, "page_not_found"];
  if (page.text.slice(span.start, span.end) !== span.exactText) {
    issues.push("slice_mismatch");
  }
  if ((await sha256Hex(span.exactText)) !== span.sha256) {
    issues.push("span_hash_mismatch");
  }
  return issues;
}
