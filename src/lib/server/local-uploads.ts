import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import type { R2BucketLike } from "@/lib/sites/runtime";

function objectPath(key: string): string {
  const root = resolve(process.env.MUSEION_UPLOADS_PATH ?? "./data/uploads");
  const path = resolve(root, key);
  if (!key || path === root || !path.startsWith(root + sep)) throw new Error("INVALID_OBJECT_KEY");
  return path;
}

export const localUploads: R2BucketLike = {
  async put(key, value, options) {
    const path = objectPath(key);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const bytes = value instanceof ReadableStream ? new Uint8Array(await new Response(value).arrayBuffer()) : typeof value === "string" ? Buffer.from(value) : value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    await writeFile(path, bytes, { mode: 0o600 });
    await writeFile(path + ".meta.json", JSON.stringify(options?.httpMetadata ?? {}), { mode: 0o600 });
  },
  async get(key) {
    const path = objectPath(key);
    try {
      const [bytes, info, metadata] = await Promise.all([readFile(path), stat(path), readFile(path + ".meta.json", "utf8").catch(() => "{}")]);
      return { body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }), size: info.size, httpMetadata: JSON.parse(metadata) };
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  },
  async delete(keys) {
    for (const key of typeof keys === "string" ? [keys] : keys) {
      const path = objectPath(key);
      await Promise.all([rm(path, { force: true }), rm(path + ".meta.json", { force: true })]);
    }
  },
};
