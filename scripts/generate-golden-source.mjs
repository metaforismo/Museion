import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const root = process.cwd();
const pdfPath = path.join(root, "tests/fixtures/binary-search-golden-source.pdf");
const documentPath = path.join(root, "tests/fixtures/binary-search-source-document.json");
const graphPath = path.join(root, "tests/fixtures/binary-search-source-graph.json");
const createdAt = "2026-07-15T00:00:00.000Z";
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");

function normalizeSourceText(raw) {
  return raw
    .replace(/^\ufeff/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .normalize("NFC")
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

async function extractPages(bytes) {
  const task = pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: true });
  const pdf = await task.promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      if (text && !text.endsWith("\n") && !/^\s/.test(item.str)) text += " ";
      text += item.str;
      if (item.hasEOL) text += "\n";
    }
    pages.push(normalizeSourceText(text));
    page.cleanup();
  }
  await task.destroy();
  return pages;
}

function resolveSpan(document, pageNumber, exactText) {
  const page = document.pages.find((candidate) => candidate.pageNumber === pageNumber);
  if (!page) throw new Error(`Missing page ${pageNumber}`);
  const start = page.text.indexOf(exactText);
  if (start < 0) throw new Error(`Quote not found on page ${pageNumber}: ${exactText}`);
  if (page.text.indexOf(exactText, start + 1) >= 0) {
    throw new Error(`Ambiguous quote on page ${pageNumber}: ${exactText}`);
  }
  return {
    schemaVersion: "1.0",
    sourceId: document.id,
    pageNumber,
    start,
    end: start + exactText.length,
    exactText,
    sha256: sha256(exactText),
  };
}

const bytes = new Uint8Array(await readFile(pdfPath));
const rawPages = await extractPages(bytes);
const pages = rawPages.map((text, index) => ({
  pageNumber: index + 1,
  text,
  sha256: sha256(text),
  charCount: text.length,
}));
const payload = JSON.stringify({
  normalizationVersion: "source-text-v1",
  pages: pages.map(({ pageNumber, text }) => ({ pageNumber, text })),
});
const documentSha = sha256(payload);
const document = {
  schemaVersion: "1.0",
  normalizationVersion: "source-text-v1",
  offsetEncoding: "utf-16",
  id: `src_${documentSha.slice(0, 24)}`,
  title: "Binary Search: Invariants, Boundaries, and Off-by-One Errors",
  mediaType: "application/pdf",
  originalFileName: "binary-search-golden-source.pdf",
  language: "en",
  sha256: documentSha,
  byteLength: bytes.byteLength,
  charCount: pages.reduce((total, page) => total + page.charCount, 0),
  pages,
  warnings: [],
  createdAt,
};

await writeFile(documentPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");

const quotes = {
  invariant: [1, "An invariant is a statement that is true before an iteration, remains true after the iteration, and helps explain why the\nalgorithm is correct."],
  midpoint: [2, "This expression chooses the lower middle index when the interval contains an even number of elements."],
  discard: [2, "The comparison gives a proof that one whole region\ncannot contain the target."],
  boundaries: [3, "The comparison has already shown that index  mid  is not the target."],
  progress: [3, "They also guarantee progress. Whenever the target is not found, the number of candidate indices decreases."],
  off_by_one: [4, "The state does not change, so the loop may never terminate."],
  empty: [5, "The interval becomes empty only\nwhen  low >  high ."],
  termination: [5, "Therefore the active interval strictly shrinks until the target is found or no candidates remain."],
  transfer: [6, "The surface values are new, but the invariant and boundary logic are\nunchanged."],
};
const spans = Object.fromEntries(
  Object.entries(quotes).map(([id, [pageNumber, exactText]]) => [
    `span_${id}`,
    resolveSpan(document, pageNumber, exactText),
  ]),
);
const evidence = (spanId, support = "direct") => [{ spanId, support }];
const graph = {
  schemaVersion: "1.0",
  sourceId: document.id,
  spans,
  concepts: [
    { id: "active_interval", label: "Active interval invariant", definition: "If the target exists, at least one occurrence remains between the inclusive low and high boundaries.", evidence: evidence("span_invariant") },
    { id: "midpoint_selection", label: "Midpoint selection", definition: "Choose the lower midpoint using a difference-based formula.", evidence: evidence("span_midpoint") },
    { id: "boundary_elimination", label: "Boundary elimination", definition: "A comparison proves one region and the midpoint impossible, so the next boundary moves past mid.", evidence: evidence("span_boundaries") },
    { id: "strict_progress", label: "Strict progress", definition: "Every unsuccessful iteration reduces the number of candidate indices.", evidence: evidence("span_progress") },
    { id: "empty_interval", label: "Empty interval termination", definition: "An inclusive interval is empty only when low is greater than high.", evidence: evidence("span_empty") },
    { id: "near_transfer", label: "Near transfer", definition: "The same invariant and boundary reasoning applies when the surface values change.", evidence: evidence("span_transfer") },
  ],
  claims: [
    { id: "claim_invariant", text: "The active interval retains every still-possible target occurrence.", conceptIds: ["active_interval"], evidence: evidence("span_invariant"), confidence: 1 },
    { id: "claim_midpoint", text: "The canonical midpoint formula selects the lower middle index.", conceptIds: ["midpoint_selection"], evidence: evidence("span_midpoint"), confidence: 1 },
    { id: "claim_discard", text: "Sorted order plus the midpoint comparison proves an entire region impossible.", conceptIds: ["active_interval", "boundary_elimination"], evidence: evidence("span_discard"), confidence: 1 },
    { id: "claim_boundary", text: "The midpoint must be excluded after it has been disproved.", conceptIds: ["boundary_elimination"], evidence: evidence("span_boundaries"), confidence: 1 },
    { id: "claim_progress", text: "Moving beyond the midpoint guarantees strict progress.", conceptIds: ["strict_progress", "boundary_elimination"], evidence: evidence("span_progress"), confidence: 1 },
    { id: "claim_off_by_one", text: "Reusing mid can repeat the same state and prevent termination.", conceptIds: ["strict_progress", "boundary_elimination"], evidence: evidence("span_off_by_one"), confidence: 1 },
    { id: "claim_empty", text: "A one-element inclusive interval remains searchable; low greater than high is empty.", conceptIds: ["empty_interval"], evidence: evidence("span_empty"), confidence: 1 },
    { id: "claim_termination", text: "Each unsuccessful update moves a boundary beyond the midpoint.", conceptIds: ["strict_progress", "empty_interval"], evidence: evidence("span_termination"), confidence: 1 },
    { id: "claim_transfer", text: "Changing the values preserves the invariant and boundary logic.", conceptIds: ["near_transfer", "active_interval", "boundary_elimination"], evidence: evidence("span_transfer"), confidence: 1 },
  ],
  prerequisiteEdges: [
    { fromConceptId: "active_interval", toConceptId: "boundary_elimination", rationale: "A boundary can move safely only after the invariant identifies which candidates remain possible.", evidence: evidence("span_discard") },
    { fromConceptId: "midpoint_selection", toConceptId: "boundary_elimination", rationale: "The comparison at mid determines which inclusive boundary moves past mid.", evidence: evidence("span_boundaries") },
    { fromConceptId: "boundary_elimination", toConceptId: "strict_progress", rationale: "Excluding the disproved midpoint makes the active interval strictly smaller.", evidence: evidence("span_progress") },
    { fromConceptId: "strict_progress", toConceptId: "empty_interval", rationale: "Strictly shrinking inclusive bounds eventually find the target or produce an empty interval.", evidence: evidence("span_termination") },
    { fromConceptId: "active_interval", toConceptId: "near_transfer", rationale: "The invariant is the deep structure reused when surface values change.", evidence: evidence("span_transfer") },
  ],
  warnings: [],
};

await writeFile(graphPath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(root, documentPath)} and ${path.relative(root, graphPath)}`);
