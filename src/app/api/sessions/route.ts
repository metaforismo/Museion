import { NextResponse } from "next/server";

import { buildSessionState } from "@/lib/api-types";
import { getLesson, toPublicLesson } from "@/lib/content";
import { buildPracticeLesson, hasPractice } from "@/lib/engine/practice";
import { LearnerSession, type SessionMode } from "@/lib/engine/session";
import { saveSession } from "@/lib/store";

interface CreateSessionBody {
  lessonId?: string;
  mode?: SessionMode;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSessionBody;
  const lesson = body.lessonId ? getLesson(body.lessonId) : undefined;
  if (!lesson) {
    return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });
  }

  const mode: SessionMode = body.mode === "practice" ? "practice" : "lesson";
  if (mode === "practice" && !hasPractice(lesson)) {
    return NextResponse.json(
      { error: "Lesson has no practice exercises" },
      { status: 400 },
    );
  }

  const sessionLesson =
    mode === "practice" ? buildPracticeLesson(lesson) : lesson;
  const session = new LearnerSession(sessionLesson, mode);
  saveSession(session);
  return NextResponse.json(
    buildSessionState(session, toPublicLesson(sessionLesson)),
  );
}
