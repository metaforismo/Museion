import { NextResponse } from "next/server";

import { buildSessionState } from "@/lib/api-types";
import { toPublicLesson } from "@/lib/content";
import { getSession } from "@/lib/store";

/** Resume payload: everything the player needs to restore its view. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unknown session" }, { status: 404 });
  }
  return NextResponse.json(
    buildSessionState(session, toPublicLesson(session.lesson)),
  );
}
