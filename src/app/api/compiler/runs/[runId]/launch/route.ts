import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSessionState } from "@/lib/api-types";
import { toPublicLesson } from "@/lib/content";
import { generatedLessonId, ownedGeneratedLesson } from "@/lib/compiler/lesson-adapter";
import { LearnerSession } from "@/lib/engine/session";
import { currentActor } from "@/lib/server/actor";
import { learnerProfile, persistSession, courseEvidenceSessionFor } from "@/lib/server/session-repository";

const LaunchRequest = z.object({ clientRunId: z.string().uuid() }).strict();

/** Retained launch endpoint shares the standard lesson session as well. */
export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const actor = await currentActor();
  if (actor.kind !== "account") return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });
  if (!LaunchRequest.safeParse(await request.json().catch(() => null)).success) return NextResponse.json({ error: "INVALID_LAUNCH_REQUEST" }, { status: 400 });
  const lesson = await ownedGeneratedLesson(generatedLessonId((await params).runId), actor.ownerId).catch(() => undefined);
  if (!lesson) return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  let session = await courseEvidenceSessionFor(actor.ownerId, lesson.id, "lesson");
  if (!session) {
    const profile = await learnerProfile(actor.ownerId);
    session = new LearnerSession(lesson, "lesson", profile!.mastery);
    await persistSession(session, actor.ownerId);
  }
  return NextResponse.json(buildSessionState(session, toPublicLesson(session.lesson)), { headers: { "Cache-Control": "no-store" } });
}
