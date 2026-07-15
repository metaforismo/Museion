import { NextResponse } from "next/server";

import { getSession } from "@/lib/store";

export async function POST(
  _request: Request,
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
  const hint = session.requestHint();
  return NextResponse.json({ hint, granted: hint !== null });
}
