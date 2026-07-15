import { NextResponse } from "next/server";

import { dispatchJudgeAction, JudgeActionRequestSchema } from "@/lib/judge";
import { readLearnerId } from "@/lib/server/learner";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const ownerId = await readLearnerId();
  if (!ownerId) return NextResponse.json({ error: "Unknown judge session" }, { status: 404 });
  const parsed = JudgeActionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid runtime action" }, { status: 400 });
  try {
    const { sessionId } = await params;
    return NextResponse.json(dispatchJudgeAction({ sessionId, ownerId, ...parsed.data }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "RUNTIME_ACTION_FAILED";
    const status = message === "JUDGE_SESSION_NOT_FOUND" ? 404 : message === "TRANSFER_ALREADY_STARTED" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
