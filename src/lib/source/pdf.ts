import { MAX_SOURCE_PAGES, SourceIngestionError } from "./limits";

const PDF_WORKER_URL = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export async function extractSelectablePdfPages(
  bytes: Uint8Array,
): Promise<string[]> {
  let destroyLoadingTask: (() => Promise<void>) | null = null;
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    }
    const loadingTask = pdfjs.getDocument({
      data: bytes.slice(),
      useSystemFonts: true,
    });
    destroyLoadingTask = () => loadingTask.destroy();
    const pdf = await loadingTask.promise;
    if (pdf.numPages > MAX_SOURCE_PAGES) {
      throw new SourceIngestionError(
        "too_many_pages",
        `PDF exceeds the ${MAX_SOURCE_PAGES}-page limit`,
        { pageCount: pdf.numPages, maxPages: MAX_SOURCE_PAGES },
      );
    }
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      try {
        const content = await page.getTextContent();
        let text = "";
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const fragment = item.str;
          if (!fragment) continue;
          if (text && !text.endsWith("\n") && !/^\s/.test(fragment)) text += " ";
          text += fragment;
          if (item.hasEOL) text += "\n";
        }
        pages.push(text);
      } finally {
        page.cleanup();
      }
    }
    return pages;
  } catch (error) {
    if (error instanceof SourceIngestionError) throw error;
    throw new SourceIngestionError(
      "invalid_pdf",
      "The PDF could not be parsed as a selectable-text document.",
      { errorName: error instanceof Error ? error.name : "UnknownError" },
    );
  } finally {
    await destroyLoadingTask?.().catch(() => undefined);
  }
}
