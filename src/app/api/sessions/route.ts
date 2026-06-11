import { NextResponse } from "next/server";

import { getLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import { saveSession } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { lessonId?: string };
  const lesson = body.lessonId ? getLesson(body.lessonId) : undefined;
  if (!lesson) {
    return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });
  }
  const session = new LearnerSession(lesson);
  saveSession(session);
  return NextResponse.json({
    sessionId: session.sessionId,
    lessonId: lesson.id,
    stepIndex: session.stepIndex,
  });
}
