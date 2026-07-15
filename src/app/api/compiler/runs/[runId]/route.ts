import { NextResponse } from "next/server";

import { getCompilerRun } from "@/lib/compiler";
import { readLearnerId } from "@/lib/server/learner";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const ownerId = await readLearnerId();
  if (!ownerId) return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  try {
    const { runId } = await params;
    return NextResponse.json(getCompilerRun(runId, ownerId), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  }
}
