export interface PublicAiDiagnosticStatus {
  enabled: boolean;
  installed: boolean;
  authenticated: boolean;
  codexVersion: string | null;
  provider: "codex" | "offline" | "openai-api";
  familyFallback: boolean;
  models: {
    compiler: Record<string, string>;
    tutor: string;
  };
  degradedReason: string | null;
}

/**
 * Builds a support payload from fields that are already safe for the browser.
 * It deliberately has no place for credentials, prompts, source text, or chats.
 */
export function sanitizedAiDiagnostics(
  status: PublicAiDiagnosticStatus,
  capturedAt = new Date().toISOString(),
) {
  return {
    capturedAt,
    enabled: status.enabled,
    installed: status.installed,
    authenticated: status.authenticated,
    codexVersion: status.codexVersion,
    provider: status.provider,
    familyFallback: status.familyFallback,
    degradedReason: status.degradedReason,
    models: status.models,
  };
}
