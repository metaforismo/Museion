import { NextResponse } from "next/server";
import { requireAccountActor } from "@/lib/server/actor";
import { LearningPreferencesSchema, persistLearningPreferences, savedLearningPreferences } from "@/lib/server/learner-settings";
export const dynamic = "force-dynamic";
export async function GET() {
  let actor;
  try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 }); }
  return NextResponse.json({ preferences: await savedLearningPreferences(actor.ownerId) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  let actor;
  try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 }); }
  const parsed = LearningPreferencesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_PREFERENCES" }, { status: 400 });
  await persistLearningPreferences(actor.ownerId, parsed.data);
  return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
}
