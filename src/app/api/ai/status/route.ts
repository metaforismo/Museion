import { NextResponse } from "next/server";

import { codexRuntimeStatus } from "@/lib/ai/codex-runtime";
import { BALANCED_COMPILER_ROUTING, BALANCED_TUTOR_MODEL } from "@/lib/ai/model-routing";
import { getAiSettings } from "@/lib/ai/settings";
import { OPENROUTER_FREE_MODEL, openRouterConfigured } from "@/lib/maia/openrouter-provider";
import { compilerCapability } from "@/lib/ai/capabilities";
import { runtimeValue } from "@/lib/sites/runtime";
import { DEFAULT_COMPILER_MODEL } from "@/lib/compiler/providers/openai";

export const dynamic = "force-dynamic";

export async function GET() {
  const [runtime, settings] = await Promise.all([codexRuntimeStatus(), Promise.resolve(getAiSettings())]);
  const capability = compilerCapability(settings.provider, runtime, { liveAiEnabled: runtimeValue("MUSEION_LIVE_AI_ENABLED") !== "0", openAiConfigured: Boolean(runtimeValue("OPENAI_API_KEY")), openRouterConfigured: openRouterConfigured() });
  const compilerModel = runtimeValue("OPENAI_COMPILER_MODEL") || runtimeValue("OPENAI_MODEL") || DEFAULT_COMPILER_MODEL;
  return NextResponse.json({
    runtime: runtime.installed ? "local" : "unavailable",
    enabled: runtime.enabled,
    installed: runtime.installed,
    authenticated: runtime.authenticated,
    codexVersion: runtime.version,
    provider: settings.provider,
    openRouterConfigured: openRouterConfigured(),
    ...capability,
    routingPolicy: settings.routingPolicy,
    familyFallback: settings.familyFallback,
    models: { compiler: capability.compilerAvailable ? settings.provider === "codex" ? BALANCED_COMPILER_ROUTING : Object.fromEntries(Object.keys(BALANCED_COMPILER_ROUTING).map((stage) => [stage, settings.provider === "openrouter-free" ? OPENROUTER_FREE_MODEL : compilerModel])) : {}, tutor: settings.provider === "openrouter-free" ? OPENROUTER_FREE_MODEL : BALANCED_TUTOR_MODEL },
    degradedReason: settings.provider === "openrouter-free"
      ? openRouterConfigured() ? null : "OPENROUTER_NOT_CONFIGURED"
      : !runtime.enabled
      ? "LOCAL_AI_DISABLED"
      : !runtime.installed
        ? "CODEX_NOT_FOUND"
        : !runtime.authenticated
          ? "CODEX_NOT_AUTHENTICATED"
          : null,
  }, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request) {
  const { localAiSettingsRequestAllowed } = await import("@/lib/ai/request-guard");
  if (!localAiSettingsRequestAllowed(request)) return NextResponse.json({ error: "LOCAL_AI_UNAVAILABLE" }, { status: 403 });
  const { AiSettingsPatchSchema, updateAiSettings } = await import("@/lib/ai/settings");
  const parsed = AiSettingsPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_AI_SETTINGS" }, { status: 400 });
  if (parsed.data.provider === "openai-api") {
    return NextResponse.json({ error: "API_PROVIDER_REQUIRES_SERVER_CONFIGURATION" }, { status: 409 });
  }
  if (parsed.data.provider === "openrouter-free" && !openRouterConfigured()) {
    return NextResponse.json({ error: "API_PROVIDER_REQUIRES_SERVER_CONFIGURATION" }, { status: 409 });
  }
  if (parsed.data.provider === "codex" && process.env.MUSEION_LOCAL_AI !== "1") {
    return NextResponse.json({ error: "LOCAL_AI_DISABLED" }, { status: 409 });
  }
  updateAiSettings(parsed.data);
  return GET();
}
