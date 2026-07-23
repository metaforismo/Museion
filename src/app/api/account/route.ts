import { NextResponse } from "next/server";

import { currentActor, requireAccountActor } from "@/lib/server/actor";
import { quotaView } from "@/lib/server/usage";
import { sitesDatabase, sitesUploads } from "@/lib/sites/database";

export const dynamic = "force-dynamic";

async function clearAccountData(ownerId: string, deleteAccount: boolean) {
  const db = sitesDatabase();
  if (!db) throw new Error("DURABLE_STORAGE_UNAVAILABLE");
  const [uploadRows, courseRows] = await Promise.all([
    db.prepare("SELECT object_key FROM uploads WHERE owner_id=?").bind(ownerId).all<{ object_key: string }>(),
    db.prepare("SELECT artifact_key FROM generated_courses WHERE owner_id=?").bind(ownerId).all<{ artifact_key: string }>(),
  ]);
  const keys = [...(uploadRows.results ?? []).map((row) => row.object_key), ...(courseRows.results ?? []).map((row) => row.artifact_key)];
  if (keys.length > 0) await sitesUploads().delete(keys);
  const statements = [
    db.prepare("DELETE FROM session_events WHERE owner_id=?").bind(ownerId), db.prepare("DELETE FROM lesson_sessions WHERE owner_id=?").bind(ownerId),
    db.prepare("DELETE FROM concept_evidence WHERE owner_id=?").bind(ownerId), db.prepare("DELETE FROM generated_courses WHERE owner_id=?").bind(ownerId),
    db.prepare("DELETE FROM compiler_runs WHERE owner_id=?").bind(ownerId), db.prepare("DELETE FROM uploads WHERE owner_id=?").bind(ownerId),
    db.prepare("DELETE FROM daily_usage WHERE owner_id=?").bind(ownerId), db.prepare("DELETE FROM museion_state WHERE owner_id=?").bind(ownerId),
    db.prepare("DELETE FROM audit_events WHERE owner_id=?").bind(ownerId),
  ];
  if (deleteAccount) statements.push(db.prepare("DELETE FROM guest_claims WHERE account_id=?").bind(ownerId), db.prepare("DELETE FROM accounts WHERE id=?").bind(ownerId));
  await db.batch(statements);
}

export async function GET(request: Request) {
  const actor = await currentActor();
  const quotas = actor.kind === "account" ? await quotaView(actor.ownerId) : null;
  if (new URL(request.url).searchParams.get("export") !== "1") {
    return NextResponse.json({ actor: { kind: actor.kind, displayName: actor.displayName }, quotas, features: { paidAi: actor.kind === "account", courseArchitect: actor.kind === "account", uploads: actor.kind === "account" } }, { headers: { "Cache-Control": "no-store" } });
  }
  if (actor.kind !== "account") return NextResponse.json({ error: "CHATGPT_SIGN_IN_REQUIRED" }, { status: 401 });
  const db = sitesDatabase();
  if (!db) return NextResponse.json({ account: { id: actor.ownerId }, data: { storage: "self-hosted", exportAvailable: false } });
  const [sessions, evidence, courses, runs, uploads] = await Promise.all([
    db.prepare("SELECT id,lesson_id,mode,revision,state_json,created_at,updated_at FROM lesson_sessions WHERE owner_id=? ORDER BY updated_at DESC").bind(actor.ownerId).all(),
    db.prepare("SELECT concept_id,score_micros,completed,practice_runs,updated_at FROM concept_evidence WHERE owner_id=? ORDER BY concept_id").bind(actor.ownerId).all(),
    db.prepare("SELECT id,title,revision,created_at,updated_at FROM generated_courses WHERE owner_id=? AND deleted_at IS NULL ORDER BY updated_at DESC").bind(actor.ownerId).all(),
    db.prepare("SELECT id,status,stage,revision,error_code,created_at,updated_at FROM compiler_runs WHERE owner_id=? ORDER BY updated_at DESC").bind(actor.ownerId).all(),
    db.prepare("SELECT id,filename,media_type,byte_length,sha256,status,expires_at,created_at FROM uploads WHERE owner_id=? ORDER BY created_at DESC").bind(actor.ownerId).all(),
  ]);
  return NextResponse.json({ exportedAt: new Date().toISOString(), account: { id: actor.ownerId }, data: { sessions: sessions.results ?? [], evidence: evidence.results ?? [], courses: courses.results ?? [], compilerRuns: runs.results ?? [], uploads: uploads.results ?? [] } }, { headers: { "Content-Disposition": "attachment; filename=museion-data.json", "Cache-Control": "no-store" } });
}

export async function DELETE() {
  let actor;
  try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "CHATGPT_SIGN_IN_REQUIRED" }, { status: 401 }); }
  const db = sitesDatabase();
  if (!db) return NextResponse.json({ deleted: false, error: "DURABLE_STORAGE_UNAVAILABLE" }, { status: 503 });
  await clearAccountData(actor.ownerId, true);
  return NextResponse.json({ deleted: true });
}

export async function POST(request: Request) {
  let actor;
  try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "CHATGPT_SIGN_IN_REQUIRED" }, { status: 401 }); }
  const body = await request.json().catch(() => null) as { action?: string } | null;
  if (body?.action !== "reset") return NextResponse.json({ error: "INVALID_ACCOUNT_ACTION" }, { status: 400 });
  try { await clearAccountData(actor.ownerId, false); }
  catch { return NextResponse.json({ error: "DURABLE_STORAGE_UNAVAILABLE" }, { status: 503 }); }
  return NextResponse.json({ reset: true });
}
