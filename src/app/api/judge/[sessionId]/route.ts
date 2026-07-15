import { NextResponse } from "next/server";

import { deleteJudgeSession, getJudgeSession } from "@/lib/judge";
import { readLearnerId } from "@/lib/server/learner";

function unavailable() {
  return NextResponse.json({ error: "Unknown judge session" }, { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const ownerId = await readLearnerId();
  if (!ownerId) return unavailable();
  try {
    const { sessionId } = await params;
    const response = NextResponse.json(getJudgeSession(sessionId, ownerId));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return unavailable();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const ownerId = await readLearnerId();
  if (!ownerId) return unavailable();
  try {
    const { sessionId } = await params;
    deleteJudgeSession(sessionId, ownerId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return unavailable();
  }
}
