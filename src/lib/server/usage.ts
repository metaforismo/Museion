import { sitesDatabase } from "@/lib/sites/database";

export const DAILY_MAIA_LIMIT = 20;
export const DAILY_COMPILER_LIMIT = 2;
export type UsageKind = "maia" | "compiler";

interface Usage { maiaTurns: number; compilerBuilds: number }
const memory = globalThis as typeof globalThis & { __museionDailyUsage?: Map<string, Usage> };
memory.__museionDailyUsage ??= new Map();

function day() { return new Date().toISOString().slice(0, 10); }

export async function usageFor(ownerId: string): Promise<Usage> {
  const db = sitesDatabase();
  if (!db) return memory.__museionDailyUsage!.get(`${ownerId}:${day()}`) ?? { maiaTurns: 0, compilerBuilds: 0 };
  const row = await db.prepare("SELECT maia_turns,compiler_builds FROM daily_usage WHERE owner_id=? AND day=? LIMIT 1").bind(ownerId, day()).first<{ maia_turns: number; compiler_builds: number }>();
  return { maiaTurns: row?.maia_turns ?? 0, compilerBuilds: row?.compiler_builds ?? 0 };
}

export async function consumeUsage(ownerId: string, kind: UsageKind): Promise<boolean> {
  const key = `${ownerId}:${day()}`;
  const db = sitesDatabase();
  const column = kind === "maia" ? "maia_turns" : "compiler_builds";
  const limit = kind === "maia" ? DAILY_MAIA_LIMIT : DAILY_COMPILER_LIMIT;
  if (!db) {
    const current = memory.__museionDailyUsage!.get(key) ?? { maiaTurns: 0, compilerBuilds: 0 };
    const count = kind === "maia" ? current.maiaTurns : current.compilerBuilds;
    if (count >= limit) return false;
    memory.__museionDailyUsage!.set(key, kind === "maia" ? { ...current, maiaTurns: count + 1 } : { ...current, compilerBuilds: count + 1 });
    return true;
  }
  const now = new Date().toISOString();
  const initialMaia = kind === "maia" ? 1 : 0;
  const initialCompiler = kind === "compiler" ? 1 : 0;
  const row = await db.prepare(`INSERT INTO daily_usage(owner_id,day,maia_turns,compiler_builds,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner_id,day) DO UPDATE SET ${column}=${column}+1,updated_at=excluded.updated_at WHERE ${column}<? RETURNING ${column} AS count`).bind(ownerId, day(), initialMaia, initialCompiler, now, limit).first<{ count: number }>();
  return Boolean(row);
}

export async function quotaView(ownerId: string) {
  const usage = await usageFor(ownerId);
  return { maia: { used: usage.maiaTurns, limit: DAILY_MAIA_LIMIT, remaining: Math.max(0, DAILY_MAIA_LIMIT - usage.maiaTurns) }, compiler: { used: usage.compilerBuilds, limit: DAILY_COMPILER_LIMIT, remaining: Math.max(0, DAILY_COMPILER_LIMIT - usage.compilerBuilds) } };
}

export function resetUsageForTests(): void { memory.__museionDailyUsage!.clear(); }
