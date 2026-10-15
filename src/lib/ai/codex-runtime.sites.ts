import type { z } from "zod";

export function codexAvailable(): boolean { return false; }
export function localAiEnabled(): boolean { return false; }
export function modelUnavailable(): boolean { return true; }
export async function runCodexStructured<T extends z.ZodTypeAny>(): Promise<{ output: z.infer<T>; resolvedModel: string; responseId: string }> {
  throw new Error("LOCAL_CODEX_UNAVAILABLE_ON_SITES");
}
export async function beginCodexDeviceLogin(): Promise<never> { throw new Error("LOCAL_CODEX_UNAVAILABLE_ON_SITES"); }
export async function checkCodexDeviceLogin(): Promise<never> { throw new Error("LOCAL_CODEX_UNAVAILABLE_ON_SITES"); }
export async function cancelCodexDeviceLogin(): Promise<void> {}
export async function codexAuthStatus(): Promise<{ authenticated: false }> { return { authenticated: false }; }
export async function logoutCodex(): Promise<void> {}
export async function codexRuntimeStatus() { return { enabled: false, installed: false, authenticated: false, executable: null, version: null }; }
export interface CodexConnectionAttempt { id: string; status: "failed"; verificationUrl: null; userCode: null; createdAt: string; error: string }
export async function startCodexDeviceLogin(): Promise<CodexConnectionAttempt> { throw new Error("LOCAL_AI_UNAVAILABLE_ON_SITES"); }
export function getCodexConnectionAttempt(id: string): CodexConnectionAttempt | null { void id; return null; }
export function cancelCodexConnectionAttempt(id: string): boolean { void id; return false; }
