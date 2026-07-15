import { NextResponse } from "next/server";

import { JudgeCreateRequestSchema } from "@/lib/judge";
import { createJudgeSession } from "@/lib/judge";
import { getPrivateCompilerRun } from "@/lib/compiler";
import { readLearnerId } from "@/lib/server/learner";

const SUPPORTED = new Set(["explanation", "prediction-choice", "sequence-builder", "range-explorer", "state-trace"]);

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const ownerId = await readLearnerId();
  if (!ownerId) return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  const parsed = JudgeCreateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_LAUNCH_REQUEST" }, { status: 400 });
  try {
    const record = getPrivateCompilerRun((await params).runId, ownerId);
    const lessonBlockIds = record.result.artifact.lessons.flatMap((lesson) => lesson.blockIds);
    if (record.result.artifact.lessons.length !== 1 || lessonBlockIds.some((id) => !SUPPORTED.has(record.result.artifact.blocks[id]?.kind))) {
      return NextResponse.json({ error: "GENERATED_ROUTE_UNSUPPORTED_BLOCKS" }, { status: 409 });
    }
    return NextResponse.json(createJudgeSession(ownerId, parsed.data.clientRunId, record.result.artifact));
  } catch (error) {
    if (error instanceof Error && error.message === "JUDGE_SESSION_QUOTA_EXCEEDED") {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: "COMPILER_RUN_NOT_FOUND" }, { status: 404 });
  }
}
