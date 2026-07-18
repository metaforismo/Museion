import { NextResponse } from "next/server";

import { compilerFailurePayload, enqueueCompilerRun, CompilerRunRequestSchema } from "@/lib/compiler";
import { createSingleDocumentSourcePackManifest } from "@/lib/source";
import { resolveLearnerId, setLearnerCookie } from "@/lib/server/learner";

export async function POST(request: Request) {
  const parsed = CompilerRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_COMPILER_REQUEST" }, { status: 400 });
  const { learnerId, isNew } = await resolveLearnerId();
  try {
    const sourcePackManifest = await createSingleDocumentSourcePackManifest(parsed.data.document, parsed.data.rights);
    const response = NextResponse.json(
      await enqueueCompilerRun(
        learnerId,
        parsed.data.document,
        parsed.data.audience,
        parsed.data.templateId,
        parsed.data.requestId,
        sourcePackManifest,
      ),
      { status: 202 },
    );
    response.headers.set("Cache-Control", "no-store");
    if (isNew) setLearnerCookie(response, learnerId);
    return response;
  } catch (error) {
    const payload = compilerFailurePayload(error);
    const status = payload.error === "LIVE_COMPILER_NOT_CONFIGURED" ? 503 : ["COMPILER_RUN_QUOTA_EXCEEDED", "COMPILER_JOB_ALREADY_RUNNING"].includes(payload.error) ? 429 : 422;
    return NextResponse.json(payload, { status });
  }
}
