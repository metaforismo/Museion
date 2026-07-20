import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const staticDir = path.resolve(".next/static");
const budgets = {
  // 3 MiB of app assets plus ~0.35 MiB of self-hosted display/UI fonts
  // (Fraunces 500/600 + Inter). JavaScript budgets stay unchanged.
  totalBytes: Math.round(3.35 * 1024 * 1024),
  largestJavaScriptBytes: 550 * 1024,
  pdfWorkerBytes: 1400 * 1024,
};

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(entryPath) : [entryPath];
  }));
  return nested.flat();
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

const files = await filesBelow(staticDir);
const measured = await Promise.all(files.map(async (file) => ({ file, bytes: (await stat(file)).size })));
const totalBytes = measured.reduce((sum, item) => sum + item.bytes, 0);
const javascript = measured.filter((item) => item.file.endsWith(".js"));
const largestJavaScript = javascript.sort((left, right) => right.bytes - left.bytes)[0];
const pdfWorker = measured.find((item) => path.basename(item.file).startsWith("pdf.worker.min."));

const failures = [];
if (totalBytes > budgets.totalBytes) failures.push(`static total ${kib(totalBytes)} exceeds ${kib(budgets.totalBytes)}`);
if (largestJavaScript?.bytes > budgets.largestJavaScriptBytes) {
  failures.push(`largest JavaScript chunk ${kib(largestJavaScript.bytes)} exceeds ${kib(budgets.largestJavaScriptBytes)}`);
}
if (!pdfWorker) failures.push("PDF worker asset is missing");
if (pdfWorker?.bytes > budgets.pdfWorkerBytes) {
  failures.push(`PDF worker ${kib(pdfWorker.bytes)} exceeds ${kib(budgets.pdfWorkerBytes)}`);
}

console.log(`Static total: ${kib(totalBytes)} / ${kib(budgets.totalBytes)}`);
console.log(`Largest JavaScript: ${kib(largestJavaScript?.bytes ?? 0)} / ${kib(budgets.largestJavaScriptBytes)}`);
console.log(`PDF worker: ${kib(pdfWorker?.bytes ?? 0)} / ${kib(budgets.pdfWorkerBytes)}`);

if (failures.length) throw new Error(`Bundle budget failures:\n${failures.join("\n")}`);
