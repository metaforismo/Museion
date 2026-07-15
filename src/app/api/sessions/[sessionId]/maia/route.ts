import { NextResponse } from "next/server";

import { maiaRespond } from "@/lib/maia/tutor";
import { log } from "@/lib/server/log";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getSession } from "@/lib/store";

/** Max learner turns per session — past this, more talk is avoidance. */
const MAX_LEARNER_TURNS = 30;
/** Short-window limit: bounds bursts and API spend per session. */
const BURST_LIMIT = 6;
const BURST_WINDOW_MS = 60_000;

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

  const burst = checkRateLimit(`maia:${sessionId}`, BURST_LIMIT, BURST_WINDOW_MS);
  if (!burst.allowed) {
    log.warn("maia_rate_limited", {
      sessionId,
      retryAfterSeconds: burst.retryAfterSeconds,
    });
    return NextResponse.json(
      {
        error: `Maia needs a moment — try again in about ${burst.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(burst.retryAfterSeconds) },
      },
    );
  }

  const learnerTurns = session.chatHistory.filter((m) => m.role === "user").length;
  if (learnerTurns >= MAX_LEARNER_TURNS) {
    return NextResponse.json(
      {
        error:
          "We've talked a lot this session — time to trust your own reasoning. Try the step with what you've got.",
      },
      { status: 429 },
    );
  }

  log.info("maia_turn_started", { sessionId, learnerTurns });
  return new Response(maiaRespond(session, body.message), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
