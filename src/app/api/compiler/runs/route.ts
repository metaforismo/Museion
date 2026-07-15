import { NextResponse } from "next/server";

import { compilerFailurePayload, createCompilerRun, CompilerRunRequestSchema } from "@/lib/compiler";
import { resolveLearnerId, setLearnerCookie } from "@/lib/server/learner";

export async function POST(request: Request) {
  const parsed = CompilerRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_COMPILER_REQUEST" }, { status: 400 });
  const { learnerId, isNew } = await resolveLearnerId();
  try {
    const response = NextResponse.json(await createCompilerRun(learnerId, parsed.data.document, parsed.data.audience));
    response.headers.set("Cache-Control", "no-store");
    if (isNew) setLearnerCookie(response, learnerId);
    return response;
  } catch (error) {
    const payload = compilerFailurePayload(error);
    const status = payload.error === "LIVE_COMPILER_NOT_CONFIGURED" ? 503 : payload.error === "COMPILER_RUN_QUOTA_EXCEEDED" ? 429 : 422;
    return NextResponse.json(payload, { status });
  }
}
