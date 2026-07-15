import { NextResponse } from "next/server";

import { codexRuntimeStatus } from "@/lib/ai/codex-runtime";
import { BALANCED_COMPILER_ROUTING, BALANCED_TUTOR_MODEL } from "@/lib/ai/model-routing";
import { getAiSettings } from "@/lib/ai/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const [runtime, settings] = await Promise.all([codexRuntimeStatus(), Promise.resolve(getAiSettings())]);
  return NextResponse.json({
    runtime: runtime.installed ? "local" : "unavailable",
    enabled: runtime.enabled,
    installed: runtime.installed,
    authenticated: runtime.authenticated,
    codexVersion: runtime.version,
    provider: settings.provider,
    routingPolicy: settings.routingPolicy,
    familyFallback: settings.familyFallback,
    models: { compiler: BALANCED_COMPILER_ROUTING, tutor: BALANCED_TUTOR_MODEL },
    degradedReason: !runtime.enabled
      ? "LOCAL_AI_DISABLED"
      : !runtime.installed
        ? "CODEX_NOT_FOUND"
        : !runtime.authenticated
          ? "CODEX_NOT_AUTHENTICATED"
          : null,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const { localAiRequestAllowed } = await import("@/lib/ai/request-guard");
  if (!localAiRequestAllowed(request)) return NextResponse.json({ error: "LOCAL_AI_UNAVAILABLE" }, { status: 403 });
  const { AiSettingsPatchSchema, updateAiSettings } = await import("@/lib/ai/settings");
  const parsed = AiSettingsPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_AI_SETTINGS" }, { status: 400 });
  if (parsed.data.provider === "openai-api") {
    return NextResponse.json({ error: "API_PROVIDER_REQUIRES_SERVER_CONFIGURATION" }, { status: 409 });
  }
  return NextResponse.json(updateAiSettings(parsed.data), { headers: { "Cache-Control": "no-store" } });
}

