import { NextResponse } from "next/server";

import { startCodexDeviceLogin } from "@/lib/ai/codex-runtime";
import { localAiRequestAllowed } from "@/lib/ai/request-guard";

export async function POST(request: Request) {
  if (!localAiRequestAllowed(request)) return NextResponse.json({ error: "LOCAL_AI_UNAVAILABLE" }, { status: 403 });
  try {
    return NextResponse.json(await startCodexDeviceLogin(), { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CODEX_CONNECTION_FAILED" }, { status: 503 });
  }
}
