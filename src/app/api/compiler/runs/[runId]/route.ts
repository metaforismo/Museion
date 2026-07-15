import { NextResponse } from "next/server";

import { cancelCompilerRun, getCompilerRunStatus } from "@/lib/compiler";
import { readLearnerId } from "@/lib/server/learner";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const ownerId = await readLearnerId();
  if (!ownerId) return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  try {
    const { runId } = await params;
    return NextResponse.json(await getCompilerRunStatus(runId, ownerId), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const ownerId = await readLearnerId();
  if (!ownerId) return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  return cancelCompilerRun((await params).runId, ownerId)
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "COMPILER_RUN_NOT_CANCELLABLE" }, { status: 409 });
}
