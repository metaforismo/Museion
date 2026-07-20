import { NextResponse } from "next/server";
import { z } from "zod";

import { maiaRespond } from "@/lib/maia/tutor";
import { BoundedTtlCache } from "@/lib/server/bounded-cache";
import { log } from "@/lib/server/log";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getOwnedSession } from "@/lib/server/session-access";

/** Max learner turns per session — past this, more talk is avoidance. */
const MAX_LEARNER_TURNS = 30;
/** Short-window limit: bounds bursts and API spend per session. */
const BURST_LIMIT = 6;
const BURST_WINDOW_MS = 60_000;

/**
 * Live widget state reported with the message. Bounded and typed here,
 * then cross-checked against the active step server-side — an invalid
 * or mismatched report is dropped, never trusted.
 */
const ActivitySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("graph"),
    a: z.number().finite().min(-100).max(100),
    h: z.number().finite().min(-100).max(100),
    k: z.number().finite().min(-100).max(100),
  }).strict(),
  z.object({
    kind: z.literal("recursion"),
    slots: z.record(z.string().min(1).max(60), z.string().min(1).max(60)),
  }).strict(),
]);

const MaiaCommandSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  expectedStepId: z.string().min(1).max(200),
  expectedVersion: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
  activity: ActivitySchema.optional(),
}).strict();

/** Idempotency cache size — bounds memory while covering realistic burst traffic. */
const MAIA_IDEMPOTENCY_MAX_ENTRIES = 500;
/** How long a completed turn stays replayable under the same idempotency key. */
const MAIA_IDEMPOTENCY_TTL_MS = 10 * 60_000;

type MaiaResult = Awaited<ReturnType<typeof maiaRespond>> & { sessionVersion: number };
const globalMaia = globalThis as unknown as { __museionMaiaCommands?: BoundedTtlCache<Promise<MaiaResult>> };
const maiaCommands = globalMaia.__museionMaiaCommands ?? new BoundedTtlCache<Promise<MaiaResult>>({
  maxEntries: MAIA_IDEMPOTENCY_MAX_ENTRIES,
  ttlMs: MAIA_IDEMPOTENCY_TTL_MS,
});
globalMaia.__museionMaiaCommands = maiaCommands;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = await getOwnedSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unknown session" }, { status: 404 });
  }
  const body = MaiaCommandSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid Maia command" }, { status: 400 });
  const commandKey = `${sessionId}:${body.data.idempotencyKey}`;
  const existing = maiaCommands.get(commandKey);
  if (existing) return NextResponse.json(await existing, { headers: { "Cache-Control": "no-store" } });
  if (session.complete) {
    return NextResponse.json({ error: "Lesson already complete" }, { status: 409 });
  }
  try {
    session.assertCurrent(body.data.expectedStepId, body.data.expectedVersion);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Session conflict" }, { status: 409 });
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
  const pending = maiaRespond(session, body.data.message, undefined, request.signal, body.data.activity ?? null)
    .then((delivery) => ({ ...delivery, sessionVersion: session.version }));
  maiaCommands.set(commandKey, pending);
  try {
    return NextResponse.json(await pending, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    maiaCommands.delete(commandKey);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Maia request failed" }, { status: 409 });
  }
}
