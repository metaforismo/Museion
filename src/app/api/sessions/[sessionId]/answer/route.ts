import { NextResponse } from "next/server";
import { z } from "zod";

import { getOwnedSession } from "@/lib/server/session-access";

const AnswerCommandSchema = z.object({
  answer: z.string().trim().min(1).max(1_000),
  expectedStepId: z.string().min(1).max(200),
  expectedVersion: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = await getOwnedSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unknown session" }, { status: 404 });
  }
  const body = AnswerCommandSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid answer command" }, { status: 400 });

  let outcome;
  try {
    outcome = session.submitAnswer(body.data.answer, body.data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Session conflict" }, { status: 409 });
  }
  const step = session.lesson.steps.find((candidate) => candidate.id === outcome.stepId);
  if (!step) return NextResponse.json({ error: "Session step is unavailable" }, { status: 409 });

  return NextResponse.json({
    ...outcome,
    stepIndex: session.stepIndex,
    // The verified solution is revealed only AFTER the step is solved:
    // a worked explanation reinforces learning once the reasoning work
    // has been done — never before.
    solution: outcome.correct ? step.solution : null,
    stats: null,
  });
}
