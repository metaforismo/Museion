import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function files(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? files(path.join(root, entry.name)) : [path.join(root, entry.name)]));
  return nested.flat();
}

const targets = (await files("dist/server")).filter((file) => /\.(m?js)$/.test(file));
for (const file of targets) {
  const source = await readFile(file, "utf8");
  // Vinext itself uses the Node compatibility layer for framework internals.
  // The forbidden boundary is Museion's local Codex process/filesystem runtime.
  if (/node:child_process|#region src\/lib\/ai\/codex-runtime\.ts/.test(source)) throw new Error(`Sites bundle contains a Node-only Codex runtime import: ${file}`);
}
console.log(`Verified ${targets.length} Sites server bundle files without Node-only Codex imports.`);
