import { NextResponse } from "next/server";
import { z } from "zod";

import { getOwnedSession } from "@/lib/server/session-access";

const HintCommandSchema = z.object({ expectedStepId: z.string().min(1).max(200), expectedVersion: z.number().int().nonnegative(), idempotencyKey: z.string().uuid() }).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = await getOwnedSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unknown session" }, { status: 404 });
  }
  const body = HintCommandSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid hint command" }, { status: 400 });
  try {
    const outcome = session.requestHintOutcome(body.data);
    return NextResponse.json({
      ...outcome,
      granted: outcome.hint !== null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Session conflict" }, { status: 409 });
  }
}
