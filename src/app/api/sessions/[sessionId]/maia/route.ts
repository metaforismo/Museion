import { NextResponse } from "next/server";

import { maiaRespond } from "@/lib/maia/tutor";
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
  const body = (await request.json()) as { message?: string };
  if (typeof body.message !== "string" || body.message.trim() === "") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  return new Response(maiaRespond(session, body.message), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
