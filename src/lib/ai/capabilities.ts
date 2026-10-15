import type { AiProvider } from "./settings";

export interface CompilerCapabilityRuntime {
  enabled: boolean;
  installed: boolean;
  authenticated: boolean;
}

/** Configuration readiness, not a live-model quality or quota probe. */
export function compilerCapability(provider: AiProvider, runtime: CompilerCapabilityRuntime, configuration: { liveAiEnabled: boolean; openAiConfigured: boolean; openRouterConfigured?: boolean }) {
  if (!configuration.liveAiEnabled) return { compilerAvailable: false, compilerUnavailableReason: "LIVE_AI_DISABLED" };
  if (provider === "openrouter-free") return configuration.openRouterConfigured
    ? { compilerAvailable: true, compilerUnavailableReason: null }
    : { compilerAvailable: false, compilerUnavailableReason: "OPENROUTER_NOT_CONFIGURED" };
  if (provider === "offline") return { compilerAvailable: false, compilerUnavailableReason: "NO_COMPILER_CONNECTION" };
  if (provider === "openai-api") return configuration.openAiConfigured
    ? { compilerAvailable: true, compilerUnavailableReason: null }
    : { compilerAvailable: false, compilerUnavailableReason: "API_PROVIDER_NOT_CONFIGURED" };
  if (!runtime.enabled) return { compilerAvailable: false, compilerUnavailableReason: "LOCAL_AI_DISABLED" };
  if (!runtime.installed) return { compilerAvailable: false, compilerUnavailableReason: "CODEX_NOT_FOUND" };
  if (!runtime.authenticated) return { compilerAvailable: false, compilerUnavailableReason: "CODEX_NOT_AUTHENTICATED" };
  return { compilerAvailable: true, compilerUnavailableReason: null };
}
