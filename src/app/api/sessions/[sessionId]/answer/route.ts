import { NextResponse } from "next/server";

import { getSession } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unknown session" }, { status: 404 });
  }
  if (session.complete) {
    return NextResponse.json({ error: "Lesson already complete" }, { status: 409 });
  }
  const body = (await request.json()) as { answer?: string };
  if (typeof body.answer !== "string" || body.answer.trim() === "") {
    return NextResponse.json({ error: "Missing answer" }, { status: 400 });
  }
  const outcome = session.submitAnswer(body.answer);
  return NextResponse.json({ ...outcome, stepIndex: session.stepIndex });
}
