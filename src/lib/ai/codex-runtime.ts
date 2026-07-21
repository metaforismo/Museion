import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { z } from "zod";

import type { Gpt56Model } from "./model-routing";

const MACOS_BUNDLED_CODEX = "/Applications/ChatGPT.app/Contents/Resources/codex";
const MAX_PROCESS_OUTPUT_BYTES = 128 * 1024;
const DEFAULT_TIMEOUT_MS = 90_000;

export type CodexRuntimeErrorCode =
  | "LOCAL_AI_DISABLED"
  | "CODEX_NOT_FOUND"
  | "CODEX_NOT_AUTHENTICATED"
  | "CODEX_MODEL_UNAVAILABLE"
  | "CODEX_TIMEOUT"
  | "CODEX_CANCELLED"
  | "CODEX_OUTPUT_TOO_LARGE"
  | "CODEX_INVALID_OUTPUT"
  | "CODEX_EXECUTION_FAILED";

export class CodexRuntimeError extends Error {
  constructor(readonly code: CodexRuntimeErrorCode, message: string) {
    super(message);
    this.name = "CodexRuntimeError";
  }
}

export function localAiEnabled(): boolean {
  return process.env.MUSEION_LOCAL_AI === "1";
}

async function executable(pathname: string): Promise<boolean> {
  try {
    return (await runProcess(pathname, ["--version"], { timeoutMs: 4_000 })).code === 0;
  } catch {
    return false;
  }
}

export async function findCodexExecutable(): Promise<string | null> {
  const configured = process.env.MUSEION_CODEX_BIN?.trim();
  if (configured && await executable(configured)) return configured;
  if (await executable("codex")) return "codex";
  return await executable(MACOS_BUNDLED_CODEX) ? MACOS_BUNDLED_CODEX : null;
}

interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runProcess(
  executablePath: string,
  args: string[],
  options: { input?: string; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(executablePath, args, {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let outputBytes = 0;
    const finishReject = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      child.kill("SIGKILL");
      reject(error);
    };
    const collect = (kind: "stdout" | "stderr", chunk: Buffer) => {
      outputBytes += chunk.byteLength;
      if (outputBytes > MAX_PROCESS_OUTPUT_BYTES) {
        finishReject(new CodexRuntimeError("CODEX_OUTPUT_TOO_LARGE", "Codex returned more diagnostic output than allowed."));
        return;
      }
      if (kind === "stdout") stdout += chunk.toString("utf8");
      else stderr += chunk.toString("utf8");
    };
    child.stdout.on("data", (chunk: Buffer) => collect("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => collect("stderr", chunk));
    child.on("error", () => finishReject(new CodexRuntimeError("CODEX_EXECUTION_FAILED", "The Codex process could not start.")));
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      resolve({ code: code ?? 1, stdout, stderr });
    });
    const abort = () => finishReject(new CodexRuntimeError("CODEX_CANCELLED", "The Codex request was cancelled."));
    options.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => finishReject(new CodexRuntimeError("CODEX_TIMEOUT", "Codex did not finish within the allowed time.")), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    if (options.input !== undefined) child.stdin.end(options.input);
    else child.stdin.end();
  });
}

function safeDiagnostic(result: ProcessResult): string {
  return `${result.stderr}\n${result.stdout}`.replace(/\s+/g, " ").trim().slice(0, 500);
}

function classifyFailure(result: ProcessResult): CodexRuntimeError {
  const diagnostic = safeDiagnostic(result).toLowerCase();
  if (/not logged in|login required|authentication|unauthorized/.test(diagnostic)) {
    return new CodexRuntimeError("CODEX_NOT_AUTHENTICATED", "Connect a ChatGPT account in Settings before using live AI.");
  }
  if (/model.*(not available|unsupported|not found)|unknown model/.test(diagnostic)) {
    return new CodexRuntimeError("CODEX_MODEL_UNAVAILABLE", "The requested GPT-5.6 model is not available for this account.");
  }
  return new CodexRuntimeError("CODEX_EXECUTION_FAILED", "Codex could not complete the structured request.");
}

export async function codexRuntimeStatus(): Promise<{
  enabled: boolean;
  installed: boolean;
  authenticated: boolean;
  executable: string | null;
  version: string | null;
}> {
  const enabled = localAiEnabled();
  const executablePath = await findCodexExecutable();
  if (!executablePath) return { enabled, installed: false, authenticated: false, executable: null, version: null };
  const [status, version] = await Promise.all([
    runProcess(executablePath, ["login", "status"], { timeoutMs: 8_000 }).catch(() => null),
    runProcess(executablePath, ["--version"], { timeoutMs: 8_000 }).catch(() => null),
  ]);
  return {
    enabled,
    installed: true,
    authenticated: status?.code === 0 && /logged in/i.test(`${status.stdout} ${status.stderr}`),
    executable: executablePath,
    version: version?.code === 0 ? version.stdout.trim().slice(0, 100) : null,
  };
}

export async function runCodexStructured<T extends z.ZodType>(options: {
  model: Gpt56Model;
  schema: T;
  schemaName: string;
  prompt: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<{ output: z.infer<T>; resolvedModel: string; responseId: string }> {
  if (!localAiEnabled()) throw new CodexRuntimeError("LOCAL_AI_DISABLED", "Local ChatGPT AI is disabled on this runtime.");
  const executablePath = await findCodexExecutable();
  if (!executablePath) throw new CodexRuntimeError("CODEX_NOT_FOUND", "Install Codex or the ChatGPT desktop app to use live AI.");
  const workdir = await mkdtemp(path.join(tmpdir(), "museion-codex-"));
  const schemaPath = path.join(/*turbopackIgnore: true*/ workdir, `${options.schemaName}.schema.json`);
  const outputPath = path.join(/*turbopackIgnore: true*/ workdir, "final.json");
  try {
    await writeFile(schemaPath, JSON.stringify(z.toJSONSchema(options.schema)), { encoding: "utf8", mode: 0o600 });
    const result = await runProcess(executablePath, [
      "-a", "never",
      "exec",
      "--ephemeral",
      "--ignore-user-config",
      "--ignore-rules",
      "--sandbox", "read-only",
      "--skip-git-repo-check",
      "--color", "never",
      "--model", options.model,
      "--cd", workdir,
      "--output-schema", schemaPath,
      "--output-last-message", outputPath,
      "-",
    ], { input: options.prompt, signal: options.signal, timeoutMs: options.timeoutMs });
    if (result.code !== 0) throw classifyFailure(result);
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(/*turbopackIgnore: true*/ outputPath, "utf8"));
    } catch {
      throw new CodexRuntimeError("CODEX_INVALID_OUTPUT", "Codex returned no valid structured output.");
    }
    return {
      output: options.schema.parse(raw),
      resolvedModel: options.model,
      responseId: `codex_${crypto.randomUUID()}`,
    };
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export function modelUnavailable(error: unknown): boolean {
  return error instanceof CodexRuntimeError && error.code === "CODEX_MODEL_UNAVAILABLE";
}

export interface CodexConnectionAttempt {
  id: string;
  status: "pending" | "connected" | "failed" | "cancelled" | "expired";
  verificationUrl: string | null;
  userCode: string | null;
  createdAt: string;
  error: string | null;
}

interface PrivateConnectionAttempt extends CodexConnectionAttempt {
  child: ChildProcessWithoutNullStreams | null;
}

const connectionGlobal = globalThis as unknown as {
  __museionCodexConnection?: PrivateConnectionAttempt;
};

function publicAttempt(attempt: PrivateConnectionAttempt): CodexConnectionAttempt {
  return {
    id: attempt.id,
    status: attempt.status,
    verificationUrl: attempt.verificationUrl,
    userCode: attempt.userCode,
    createdAt: attempt.createdAt,
    error: attempt.error,
  };
}

export function parseCodexDeviceLoginOutput(diagnostic: string): {
  verificationUrl: string | null;
  userCode: string | null;
} {
  return {
    verificationUrl: diagnostic.match(/https:\/\/[^\s]+/i)?.[0]?.replace(/[),.;]+$/, "") ?? null,
    // Current Codex releases use four characters before the separator and
    // between four and eight after it. Older releases emitted 4-4 groups.
    userCode: diagnostic.match(/\b[A-Z0-9]{4}-[A-Z0-9]{4,8}\b/)?.[0] ?? null,
  };
}

export async function startCodexDeviceLogin(): Promise<CodexConnectionAttempt> {
  if (!localAiEnabled()) throw new CodexRuntimeError("LOCAL_AI_DISABLED", "Local ChatGPT AI is disabled on this runtime.");
  const existing = connectionGlobal.__museionCodexConnection;
  if (existing?.status === "pending") return publicAttempt(existing);
  const executablePath = await findCodexExecutable();
  if (!executablePath) throw new CodexRuntimeError("CODEX_NOT_FOUND", "Install Codex or the ChatGPT desktop app first.");
  const child = spawn(executablePath, ["login", "--device-auth"], {
    env: process.env,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stdin.end();
  const attempt: PrivateConnectionAttempt = {
    id: crypto.randomUUID(),
    status: "pending",
    verificationUrl: null,
    userCode: null,
    createdAt: new Date().toISOString(),
    error: null,
    child,
  };
  connectionGlobal.__museionCodexConnection = attempt;
  let diagnostic = "";
  const collect = (chunk: Buffer) => {
    if (diagnostic.length >= 16_384) return;
    diagnostic += chunk.toString("utf8").slice(0, 16_384 - diagnostic.length);
    const parsed = parseCodexDeviceLoginOutput(diagnostic);
    attempt.verificationUrl ??= parsed.verificationUrl;
    attempt.userCode ??= parsed.userCode;
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);
  child.on("error", () => {
    attempt.status = "failed";
    attempt.error = "The Codex login process could not start.";
    attempt.child = null;
  });
  child.on("close", (code) => {
    if (attempt.status === "cancelled") return;
    attempt.status = code === 0 ? "connected" : "failed";
    attempt.error = code === 0 ? null : "The ChatGPT connection was not completed.";
    attempt.child = null;
  });
  return publicAttempt(attempt);
}

export function getCodexConnectionAttempt(id: string): CodexConnectionAttempt | null {
  const attempt = connectionGlobal.__museionCodexConnection;
  if (attempt?.status === "pending" && Date.now() - Date.parse(attempt.createdAt) > 10 * 60_000) {
    attempt.status = "expired";
    attempt.error = "The device-login attempt expired. Start a new connection attempt.";
    attempt.child?.kill("SIGTERM");
    attempt.child = null;
  }
  return attempt?.id === id ? publicAttempt(attempt) : null;
}

export function cancelCodexConnectionAttempt(id: string): boolean {
  const attempt = connectionGlobal.__museionCodexConnection;
  if (!attempt || attempt.id !== id || attempt.status !== "pending") return false;
  attempt.status = "cancelled";
  attempt.error = null;
  attempt.child?.kill("SIGTERM");
  attempt.child = null;
  return true;
}

export async function logoutCodex(): Promise<void> {
  if (!localAiEnabled()) throw new CodexRuntimeError("LOCAL_AI_DISABLED", "Local ChatGPT AI is disabled on this runtime.");
  const executablePath = await findCodexExecutable();
  if (!executablePath) throw new CodexRuntimeError("CODEX_NOT_FOUND", "Codex is not installed.");
  const result = await runProcess(executablePath, ["logout"], { timeoutMs: 10_000 });
  if (result.code !== 0) throw classifyFailure(result);
}
