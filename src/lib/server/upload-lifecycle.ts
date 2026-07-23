import { sitesDatabase, sitesUploads } from "@/lib/sites/database";

/** Raw sources never outlive a terminal compilation for this owner. */
export async function deleteRawUploadsForOwner(ownerId: string): Promise<number> {
  const db = sitesDatabase();
  if (!db) return 0;
  const rows = await db.prepare("SELECT id,object_key FROM uploads WHERE owner_id=? AND status IN ('ready','compiling')").bind(ownerId).all<{ id: string; object_key: string }>();
  if (!rows.results?.length) return 0;
  await sitesUploads().delete(rows.results.map((row) => row.object_key));
  await db.prepare(`DELETE FROM uploads WHERE owner_id=? AND id IN (${rows.results.map(() => "?").join(",")})`).bind(ownerId, ...rows.results.map((row) => row.id)).run();
  return rows.results.length;
}
