import { NextResponse } from "next/server";
import { requireAccountActor } from "@/lib/server/actor";
import { MAX_SOURCE_BYTES } from "@/lib/source/limits";
import { sitesDatabase, sitesUploads } from "@/lib/sites/database";

export const dynamic = "force-dynamic";
const UPLOAD_TTL_MS = 24 * 60 * 60 * 1_000;
const ALLOWED_TYPES = new Set(["text/plain", "text/markdown", "application/pdf"]);
function hex(bytes: ArrayBuffer) { return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function cleanupExpired(ownerId: string) {
  const db = sitesDatabase(); if (!db) return;
  const rows = await db.prepare("SELECT id,object_key FROM uploads WHERE owner_id=? AND expires_at<=?").bind(ownerId, new Date().toISOString()).all<{ id: string; object_key: string }>();
  if (!rows.results?.length) return;
  await sitesUploads().delete(rows.results.map((row) => row.object_key));
  await db.prepare(`DELETE FROM uploads WHERE id IN (${rows.results.map(() => "?").join(",")})`).bind(...rows.results.map((row) => row.id)).run();
}
export async function GET() {
  let actor; try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "CHATGPT_SIGN_IN_REQUIRED" }, { status: 401 }); }
  const db = sitesDatabase(); if (!db) return NextResponse.json({ error: "SITES_STORAGE_UNAVAILABLE" }, { status: 503 });
  await cleanupExpired(actor.ownerId);
  const rows = await db.prepare("SELECT id,filename,media_type,byte_length,sha256,status,expires_at,created_at FROM uploads WHERE owner_id=? ORDER BY created_at DESC").bind(actor.ownerId).all();
  return NextResponse.json({ uploads: rows.results ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  let actor; try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "CHATGPT_SIGN_IN_REQUIRED" }, { status: 401 }); }
  const db = sitesDatabase(); if (!db) return NextResponse.json({ error: "SITES_STORAGE_UNAVAILABLE" }, { status: 503 });
  const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_SOURCE_BYTES) return NextResponse.json({ error: "INVALID_SOURCE_FILE" }, { status: 422 });
  await cleanupExpired(actor.ownerId);
  const bytes = await file.arrayBuffer(); const id = crypto.randomUUID(); const objectKey = `uploads/${actor.ownerId}/${id}`;
  const sha256 = hex(await crypto.subtle.digest("SHA-256", bytes)); const now = new Date(); const expiresAt = new Date(now.getTime() + UPLOAD_TTL_MS).toISOString();
  await sitesUploads().put(objectKey, bytes, { httpMetadata: { contentType: file.type }, customMetadata: { ownerId: actor.ownerId, sha256 } });
  await db.prepare("INSERT INTO uploads(id,owner_id,object_key,filename,media_type,byte_length,sha256,status,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(id, actor.ownerId, objectKey, file.name.slice(0, 255), file.type, file.size, sha256, "ready", expiresAt, now.toISOString(), now.toISOString()).run();
  return NextResponse.json({ upload: { id, filename: file.name, mediaType: file.type, byteLength: file.size, sha256, status: "ready", expiresAt } }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
