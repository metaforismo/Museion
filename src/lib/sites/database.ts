import { sitesEnv, type D1DatabaseLike } from "./runtime";
import { localDatabase } from "@/lib/server/local-database";
import { localUploads } from "@/lib/server/local-uploads";

export function sitesDatabase(): D1DatabaseLike | null {
  if (sitesEnv()) return sitesEnv()?.DB ?? null;
  // Existing engine unit tests stay isolated; durability tests opt into a temp file.
  if (process.env.NODE_ENV === "test" && !process.env.MUSEION_DATABASE_PATH) return null;
  return localDatabase();
}

export function requireSitesDatabase(): D1DatabaseLike {
  const db = sitesDatabase();
  if (!db) throw new Error("SITES_DATABASE_UNAVAILABLE");
  return db;
}

export function sitesUploads() {
  const bucket = sitesEnv()?.UPLOADS;
  if (!bucket && sitesEnv()) throw new Error("SITES_UPLOADS_UNAVAILABLE");
  return bucket ?? localUploads;
}
