import { NextResponse } from "next/server";

import { createJudgeSession, JudgeCreateRequestSchema } from "@/lib/judge";
import { resolveLearnerId, setLearnerCookie } from "@/lib/server/learner";

export async function POST(request: Request) {
  const parsed = JudgeCreateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid judge session request" }, { status: 400 });
  const { learnerId, isNew } = await resolveLearnerId();
  let session;
  try {
    session = createJudgeSession(learnerId, parsed.data.clientRunId);
  } catch (error) {
    if (error instanceof Error && error.message === "JUDGE_SESSION_QUOTA_EXCEEDED") {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }
  const response = NextResponse.json(session);
  response.headers.set("Cache-Control", "no-store");
  if (isNew) setLearnerCookie(response, learnerId);
  return response;
}
