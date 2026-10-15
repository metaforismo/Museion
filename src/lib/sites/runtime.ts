export interface D1Result<T = Record<string, unknown>> { results?: T[]; success: boolean; meta?: Record<string, unknown> }
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}
export interface D1DatabaseLike {
  prepare(query: string): D1Statement;
  batch<T = Record<string, unknown>>(statements: D1Statement[]): Promise<D1Result<T>[]>;
}
export interface R2ObjectLike { body: ReadableStream; httpMetadata?: { contentType?: string }; size: number }
export interface R2BucketLike {
  put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream | string, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  get(key: string): Promise<R2ObjectLike | null>;
  delete(keys: string | string[]): Promise<void>;
}
export interface SitesRuntimeEnv {
  DB?: D1DatabaseLike;
  UPLOADS?: R2BucketLike;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  MUSEION_AI_PROVIDER?: string;
  OPENAI_MODEL?: string;
  OPENAI_COMPILER_MODEL?: string;
  IDENTITY_PEPPER?: string;
  MUSEION_LIVE_AI_ENABLED?: string;
  MUSEION_MCP_PUBLIC_ENABLED?: string;
}

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

const runtime = globalThis as typeof globalThis & { __museionSitesEnv?: SitesRuntimeEnv; __museionExecutionContext?: ExecutionContextLike };

export function installSitesRuntime(env: Record<string, unknown>, ctx?: ExecutionContextLike): void {
  runtime.__museionSitesEnv = env as SitesRuntimeEnv;
  for (const key of ["OPENAI_API_KEY", "OPENROUTER_API_KEY", "MUSEION_AI_PROVIDER", "OPENAI_MODEL", "OPENAI_COMPILER_MODEL", "IDENTITY_PEPPER", "MUSEION_LIVE_AI_ENABLED", "MUSEION_MCP_PUBLIC_ENABLED"] as const) {
    const value = env[key];
    if (typeof value === "string") process.env[key] = value;
  }
  if (ctx) runtime.__museionExecutionContext = ctx;
}

export function sitesEnv(): SitesRuntimeEnv | null {
  return runtime.__museionSitesEnv ?? null;
}

export function isSitesRuntime(): boolean {
  return Boolean(runtime.__museionSitesEnv) || process.env.MUSEION_RUNTIME === "sites";
}

export function runtimeValue(key: keyof SitesRuntimeEnv): string | undefined {
  const value = sitesEnv()?.[key];
  if (typeof value === "string") return value;
  return process.env[key];
}

export function resetSitesRuntimeForTests(): void {
  delete runtime.__museionSitesEnv;
  delete runtime.__museionExecutionContext;
}
