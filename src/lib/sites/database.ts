import { sitesEnv, type D1DatabaseLike } from "./runtime";

export function sitesDatabase(): D1DatabaseLike | null {
  return sitesEnv()?.DB ?? null;
}

export function requireSitesDatabase(): D1DatabaseLike {
  const db = sitesDatabase();
  if (!db) throw new Error("SITES_DATABASE_UNAVAILABLE");
  return db;
}

export function sitesUploads() {
  const bucket = sitesEnv()?.UPLOADS;
  if (!bucket) throw new Error("SITES_UPLOADS_UNAVAILABLE");
  return bucket;
}
