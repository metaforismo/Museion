import { NextResponse } from "next/server";

import { cancelCompilerRun, getCompilerRunStatus } from "@/lib/compiler";
import { currentActor } from "@/lib/server/actor";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const actor = await currentActor();
  if (actor.kind !== "account") return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });
  const ownerId = actor.ownerId;
  try {
    const { runId } = await params;
    return NextResponse.json(await getCompilerRunStatus(runId, ownerId), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const actor = await currentActor();
  if (actor.kind !== "account") return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });
  const ownerId = actor.ownerId;
  return await cancelCompilerRun((await params).runId, ownerId)
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "COMPILER_RUN_NOT_CANCELLABLE" }, { status: 409 });
}
