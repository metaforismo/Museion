import { NextResponse } from "next/server";
import { requireAccountActor } from "@/lib/server/actor";
import { sitesDatabase, sitesUploads } from "@/lib/sites/database";

export async function DELETE(_request: Request, { params }: { params: Promise<{ uploadId: string }> }) {
  let actor; try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "CHATGPT_SIGN_IN_REQUIRED" }, { status: 401 }); }
  const db = sitesDatabase(); if (!db) return NextResponse.json({ error: "SITES_STORAGE_UNAVAILABLE" }, { status: 503 });
  const { uploadId } = await params; const row = await db.prepare("SELECT object_key FROM uploads WHERE id=? AND owner_id=? LIMIT 1").bind(uploadId, actor.ownerId).first<{ object_key: string }>();
  if (!row) return NextResponse.json({ error: "UPLOAD_NOT_FOUND" }, { status: 404 });
  await sitesUploads().delete(row.object_key); await db.prepare("DELETE FROM uploads WHERE id=? AND owner_id=?").bind(uploadId, actor.ownerId).run();
  return NextResponse.json({ deleted: true });
}
