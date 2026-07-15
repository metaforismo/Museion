import { NextResponse } from "next/server";
import { z } from "zod";

import { GPT56_MODELS } from "@/lib/ai/model-routing";
import { runCodexStructured } from "@/lib/ai/codex-runtime";
import { localAiRequestAllowed } from "@/lib/ai/request-guard";

const CheckSchema = z.object({ ok: z.literal(true) }).strict();

export async function POST(request: Request) {
  if (!localAiRequestAllowed(request)) return NextResponse.json({ error: "LOCAL_AI_UNAVAILABLE" }, { status: 403 });
  const results = [];
  for (const model of Object.values(GPT56_MODELS)) {
    const started = performance.now();
    try {
      const result = await runCodexStructured({
        model,
        schema: CheckSchema,
        schemaName: "museion_connection_check",
        prompt: "Return {\"ok\":true}. Do not use tools or perform any other action.",
        signal: request.signal,
        timeoutMs: 30_000,
      });
      results.push({ model, available: true, resolvedModel: result.resolvedModel, durationMs: Math.round(performance.now() - started) });
    } catch (error) {
      results.push({ model, available: false, error: error instanceof Error && "code" in error ? String((error as { code: unknown }).code) : "CHECK_FAILED", durationMs: Math.round(performance.now() - started) });
    }
  }
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}

