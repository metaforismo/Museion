import { NextResponse } from "next/server";

import { JudgeTransferRequestSchema, updateJudgeTransfer } from "@/lib/judge";
import { readLearnerId } from "@/lib/server/learner";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const ownerId = await readLearnerId();
  if (!ownerId) return NextResponse.json({ error: "Unknown judge session" }, { status: 404 });
  const parsed = JudgeTransferRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid transfer request" }, { status: 400 });
  try {
    const { sessionId } = await params;
    return NextResponse.json(await updateJudgeTransfer({ sessionId, ownerId, ...parsed.data }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "TRANSFER_FAILED";
    const status = message === "JUDGE_SESSION_NOT_FOUND" ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
