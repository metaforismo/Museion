import { NextResponse } from "next/server";

import { cancelCodexConnectionAttempt, getCodexConnectionAttempt } from "@/lib/ai/codex-runtime";
import { localAiRequestAllowed } from "@/lib/ai/request-guard";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  if (!localAiRequestAllowed(request)) return NextResponse.json({ error: "LOCAL_AI_UNAVAILABLE" }, { status: 403 });
  const attempt = getCodexConnectionAttempt((await params).attemptId);
  return attempt
    ? NextResponse.json(attempt, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: "CONNECTION_ATTEMPT_NOT_FOUND" }, { status: 404 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  if (!localAiRequestAllowed(request)) return NextResponse.json({ error: "LOCAL_AI_UNAVAILABLE" }, { status: 403 });
  return cancelCodexConnectionAttempt((await params).attemptId)
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "CONNECTION_ATTEMPT_NOT_FOUND" }, { status: 404 });
}

