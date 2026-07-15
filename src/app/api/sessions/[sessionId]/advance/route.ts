import { NextResponse } from "next/server";
import { z } from "zod";

import { buildSessionState } from "@/lib/api-types";
import { toPublicLesson } from "@/lib/content";
import { getOwnedSession } from "@/lib/server/session-access";
import { log } from "@/lib/server/log";
import { getSessionLearner, recordCompletion } from "@/lib/store";

const AdvanceCommandSchema = z.object({ expectedStepId: z.string().min(1).max(200), expectedVersion: z.number().int().nonnegative(), idempotencyKey: z.string().uuid() }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getOwnedSession(sessionId);
  if (!session) return NextResponse.json({ error: "Unknown session" }, { status: 404 });
  const body = AdvanceCommandSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid advance command" }, { status: 400 });
  try {
    const outcome = session.advance(body.data);
    if (outcome.lessonComplete && !outcome.replayed) {
      const learnerId = getSessionLearner(sessionId);
      if (learnerId) {
        const lessonId = session.lesson.id.replace(/::practice$/, "");
        recordCompletion(learnerId, lessonId, session.mode);
        log.info("run_completed", { sessionId, lessonId, mode: session.mode, totalAttempts: session.stats().totalAttempts, hintsUsed: session.stats().hintsUsed });
      }
    }
    return NextResponse.json(buildSessionState(session, toPublicLesson(session.lesson)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Session conflict" }, { status: 409 });
  }
}
