import type { CompilerProvider, CompilerStage, ProviderStageResult } from "../contracts";

/** Hosted Sites use the OpenAI API; local Codex device auth stays self-host-only. */
export class CodexCompilerProvider implements CompilerProvider {
  readonly id = "codex-unavailable-on-sites";
  readonly mode = "live" as const;
  constructor(familyFallback?: string) { void familyFallback; }
  async run(stage: CompilerStage, input: unknown, signal: AbortSignal): Promise<ProviderStageResult> {
    void stage; void input; void signal;
    throw new Error("LOCAL_CODEX_UNAVAILABLE_ON_SITES");
  }
}
