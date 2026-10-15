import { NextResponse } from "next/server";
import { z } from "zod";

import { buildSessionState } from "@/lib/api-types";
import { ownedGeneratedLesson } from "@/lib/compiler/lesson-adapter";
import { getLesson, toPublicLesson } from "@/lib/content";
import { buildPracticeLesson, hasPractice } from "@/lib/engine/practice";
import { LearnerSession, type SessionMode } from "@/lib/engine/session";
import { requireAccountActor } from "@/lib/server/actor";
import { log } from "@/lib/server/log";
import { learnerProfile, persistSession, unfinishedSessionFor, courseEvidenceSessionFor } from "@/lib/server/session-repository";

export const dynamic = "force-dynamic";

const CreateSessionBodySchema = z.object({
  lessonId: z.string().min(1).max(160),
  mode: z.enum(["lesson", "practice"]).default("lesson"),
  restart: z.boolean().optional(),
}).strict();

export async function GET(request: Request) {
  let actor;
  try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 }); }
  const query = new URL(request.url).searchParams;
  const parsed = CreateSessionBodySchema.safeParse({ lessonId: query.get("lessonId"), mode: query.get("mode") ?? "lesson" });
  if (!parsed.success) return NextResponse.json({ error: "Invalid session request" }, { status: 400 });
  const lesson = getLesson(parsed.data.lessonId) ?? await ownedGeneratedLesson(parsed.data.lessonId, actor.ownerId).catch(() => undefined);
  if (!lesson) return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });
  const session = lesson.generatedFrom ? await courseEvidenceSessionFor(actor.ownerId, lesson.id, parsed.data.mode) : await unfinishedSessionFor(actor.ownerId, lesson.id, parsed.data.mode);
  return NextResponse.json({ session: session ? buildSessionState(session, toPublicLesson(session.lesson)) : null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = CreateSessionBodySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid session request" }, { status: 400 });
  const body = parsed.data;
  let actor;
  try { actor = await requireAccountActor(); } catch { return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 }); }
  const lesson = getLesson(body.lessonId) ?? await ownedGeneratedLesson(body.lessonId, actor.ownerId).catch(() => undefined);
  if (!lesson) {
    return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });
  }

  const mode: SessionMode = body.mode;
  if (mode === "practice" && !hasPractice(lesson)) {
    return NextResponse.json(
      { error: "Lesson has no practice exercises" },
      { status: 400 },
    );
  }

  if (lesson.generatedFrom && !body.restart) {
    const existing = await courseEvidenceSessionFor(actor.ownerId, lesson.id, mode);
    if (existing) return NextResponse.json(buildSessionState(existing, toPublicLesson(existing.lesson)), { headers: { "Cache-Control": "no-store" } });
  }

  const learnerId = actor.ownerId;
  const profile = await learnerProfile(learnerId);

  const sessionLesson =
    mode === "practice" ? buildPracticeLesson(lesson) : lesson;
  // The session shares the profile's mastery model, so scaffolding
  // fades across sessions and lessons, not just within one run.
  const session = new LearnerSession(sessionLesson, mode, profile!.mastery);
  if (lesson.generatedFrom && body.restart) session.events.push({ kind: "course_restarted", ts: Date.now() });
  await persistSession(session, learnerId);
  log.info("session_created", {
    sessionId: session.sessionId,
    lessonId: lesson.id,
    mode,
  });

  const response = NextResponse.json(
    buildSessionState(session, toPublicLesson(sessionLesson)),
  );
  return response;
}
