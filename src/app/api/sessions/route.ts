import { NextResponse } from "next/server";
import { z } from "zod";

import { buildSessionState } from "@/lib/api-types";
import { getLesson, toPublicLesson } from "@/lib/content";
import { buildPracticeLesson, hasPractice } from "@/lib/engine/practice";
import { LearnerSession, type SessionMode } from "@/lib/engine/session";
import { resolveLearnerId, setLearnerCookie } from "@/lib/server/learner";
import { log } from "@/lib/server/log";
import { getOrCreateProfile, saveSession } from "@/lib/store";

const CreateSessionBodySchema = z.object({
  lessonId: z.string().min(1).max(160),
  mode: z.enum(["lesson", "practice"]).default("lesson"),
}).strict();

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = CreateSessionBodySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid session request" }, { status: 400 });
  const body = parsed.data;
  const lesson = body.lessonId ? getLesson(body.lessonId) : undefined;
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

  const { learnerId, isNew } = await resolveLearnerId();
  const profile = getOrCreateProfile(learnerId);

  const sessionLesson =
    mode === "practice" ? buildPracticeLesson(lesson) : lesson;
  // The session shares the profile's mastery model, so scaffolding
  // fades across sessions and lessons, not just within one run.
  const session = new LearnerSession(sessionLesson, mode, profile.mastery);
  saveSession(session, learnerId);
  log.info("session_created", {
    sessionId: session.sessionId,
    lessonId: lesson.id,
    mode,
    newLearner: isNew,
  });

  const response = NextResponse.json(
    buildSessionState(session, toPublicLesson(sessionLesson)),
  );
  if (isNew) setLearnerCookie(response, learnerId);
  return response;
}
