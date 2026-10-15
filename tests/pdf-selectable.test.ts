import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { extractSelectablePdfPages } from "@/lib/source/pdf";
import { normalizeSourceText } from "@/lib/source/normalize";

it("keeps the reviewed source text unchanged with the patched PDF parser", async () => {
  const bytes = new Uint8Array(await readFile("tests/fixtures/binary-search-golden-source.pdf"));
  const document = JSON.parse(await readFile("tests/fixtures/binary-search-source-document.json", "utf8")) as { pages: { text: string }[] };
  const pages = await extractSelectablePdfPages(bytes);
  expect(pages.map((text) => normalizeSourceText(text).text)).toEqual(document.pages.map((page) => page.text));
});
