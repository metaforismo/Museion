import { NextResponse } from "next/server";

import { advanceCompilerRun } from "@/lib/compiler";
import { requireAccountActor } from "@/lib/server/actor";

export async function POST(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const actor = await requireAccountActor();
    const result = await advanceCompilerRun((await params).runId, actor.ownerId);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "COMPILER_RUN_NOT_FOUND";
    return NextResponse.json({ error: code }, { status: code === "SIGN_IN_REQUIRED" ? 401 : 404 });
  }
}
