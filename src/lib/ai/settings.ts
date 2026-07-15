import { z } from "zod";

import { ModelRoutingPolicySchema } from "./model-routing";

export const AiProviderSchema = z.enum(["codex", "offline", "openai-api"]);
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
    provider: process.env.MUSEION_LOCAL_AI === "1" ? "codex" : "offline",
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
