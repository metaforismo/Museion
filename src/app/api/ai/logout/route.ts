import { NextResponse } from "next/server";

import { logoutCodex } from "@/lib/ai/codex-runtime";
import { localAiRequestAllowed } from "@/lib/ai/request-guard";

export async function POST(request: Request) {
  if (!localAiRequestAllowed(request)) return NextResponse.json({ error: "LOCAL_AI_UNAVAILABLE" }, { status: 403 });
  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null;
  if (body?.confirmation !== "LOG_OUT_CODEX_GLOBALLY") {
    return NextResponse.json({ error: "CONFIRMATION_REQUIRED" }, { status: 400 });
  }
  try {
    await logoutCodex();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "LOGOUT_FAILED" }, { status: 503 });
  }
}
