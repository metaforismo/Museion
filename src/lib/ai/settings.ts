import { z } from "zod";

import { ModelRoutingPolicySchema } from "./model-routing";
import { isSitesRuntime, runtimeValue } from "@/lib/sites/runtime";

export const AiProviderSchema = z.enum(["codex", "offline", "openai-api", "openrouter-free"]);
export type AiProvider = z.infer<typeof AiProviderSchema>;

export const AiSettingsPatchSchema = z.object({
  provider: AiProviderSchema.optional(),
  familyFallback: z.boolean().optional(),
}).strict();

export interface AiSettings {
  provider: AiProvider;
  routingPolicy: "balanced";
  familyFallback: boolean;
}

const settingsGlobal = globalThis as unknown as { __museionAiSettings?: AiSettings };

export function getAiSettings(): AiSettings {
  settingsGlobal.__museionAiSettings ??= {
    provider: runtimeValue("MUSEION_AI_PROVIDER") === "openrouter-free" && runtimeValue("OPENROUTER_API_KEY") && runtimeValue("MUSEION_LIVE_AI_ENABLED") === "1"
      ? "openrouter-free"
      : process.env.MUSEION_LOCAL_AI === "1"
      ? "codex"
      : isSitesRuntime() && runtimeValue("OPENAI_API_KEY") && runtimeValue("MUSEION_LIVE_AI_ENABLED") !== "0"
        ? "openai-api"
        : "offline",
    routingPolicy: ModelRoutingPolicySchema.parse("balanced"),
    familyFallback: true,
  };
  return { ...settingsGlobal.__museionAiSettings };
}

export function updateAiSettings(patch: z.infer<typeof AiSettingsPatchSchema>): AiSettings {
  const current = getAiSettings();
  settingsGlobal.__museionAiSettings = { ...current, ...AiSettingsPatchSchema.parse(patch) };
  return getAiSettings();
}

export function codexSelected(): boolean {
  return getAiSettings().provider === "codex";
}

export function resetAiSettingsForTests(): void {
  delete settingsGlobal.__museionAiSettings;
}
