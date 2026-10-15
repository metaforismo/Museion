/**
 * Server-only persistence boundary for deployment state.
 *
 * Local product development uses SQLite. Keyless unit tests deliberately
 * isolate their state in the bounded memory backend; durability tests opt
 * into a temporary database. Existing D1/Supabase adapters are retained.
 */

export type StateNamespace = "compiler_run" | "judge_session" | "learner_profile" | "learner_session";

export interface StateRecord<T> {
  namespace: StateNamespace;
  id: string;
  ownerId: string;
  payload: T;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StateBackend {
  readonly kind: "memory" | "supabase" | "d1" | "sqlite";
  get<T>(namespace: StateNamespace, id: string, ownerId: string): Promise<StateRecord<T> | undefined>;
  put<T>(record: StateRecord<T>): Promise<void>;
  compareAndPut<T>(record: StateRecord<T>, expectedUpdatedAt: string): Promise<boolean>;
  list<T>(namespace: StateNamespace, ownerId: string): Promise<StateRecord<T>[]>;
  delete(namespace: StateNamespace, id: string, ownerId: string): Promise<boolean>;
  prune(namespace: StateNamespace, now?: Date): Promise<void>;
}

import { sitesDatabase } from "@/lib/sites/database";
import { sitesEnv } from "@/lib/sites/runtime";

type StoredRecord = StateRecord<unknown>;

const globalMemory = globalThis as typeof globalThis & {
  __museionDurableState?: Map<string, StoredRecord>;
};
const memoryRecords = globalMemory.__museionDurableState ?? new Map<string, StoredRecord>();
globalMemory.__museionDurableState = memoryRecords;

function recordKey(namespace: StateNamespace, id: string): string {
  return `${namespace}:${id}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

class MemoryStateBackend implements StateBackend {
  readonly kind = "memory" as const;

  async get<T>(namespace: StateNamespace, id: string, ownerId: string): Promise<StateRecord<T> | undefined> {
    const record = memoryRecords.get(recordKey(namespace, id));
    if (!record || record.ownerId !== ownerId || Date.parse(record.expiresAt) <= Date.now()) return undefined;
    return clone(record) as StateRecord<T>;
  }

  async put<T>(record: StateRecord<T>): Promise<void> {
    memoryRecords.set(recordKey(record.namespace, record.id), clone(record) as StoredRecord);
  }

  async compareAndPut<T>(record: StateRecord<T>, expectedUpdatedAt: string): Promise<boolean> {
    const key = recordKey(record.namespace, record.id);
    const current = memoryRecords.get(key);
    if (
      !current ||
      current.ownerId !== record.ownerId ||
      current.updatedAt !== expectedUpdatedAt ||
      Date.parse(current.expiresAt) <= Date.now()
    ) return false;
    memoryRecords.set(key, clone(record) as StoredRecord);
    return true;
  }

  async list<T>(namespace: StateNamespace, ownerId: string): Promise<StateRecord<T>[]> {
    const now = Date.now();
    return [...memoryRecords.values()]
      .filter((record) => record.namespace === namespace && record.ownerId === ownerId && Date.parse(record.expiresAt) > now)
      .map((record) => clone(record) as StateRecord<T>);
  }

  async delete(namespace: StateNamespace, id: string, ownerId: string): Promise<boolean> {
    const key = recordKey(namespace, id);
    const record = memoryRecords.get(key);
    if (!record || record.ownerId !== ownerId) return false;
    return memoryRecords.delete(key);
  }

  async prune(namespace: StateNamespace, now = new Date()): Promise<void> {
    for (const [key, record] of memoryRecords) {
      if (record.namespace === namespace && Date.parse(record.expiresAt) <= now.getTime()) memoryRecords.delete(key);
    }
  }
}

interface D1StateRow {
  namespace: StateNamespace;
  id: string;
  owner_id: string;
  payload: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

function fromD1Row<T>(row: D1StateRow): StateRecord<T> {
  return { namespace: row.namespace, id: row.id, ownerId: row.owner_id, payload: JSON.parse(row.payload) as T, expiresAt: row.expires_at, createdAt: row.created_at, updatedAt: row.updated_at };
}

class D1StateBackend implements StateBackend {
  constructor(readonly kind: "d1" | "sqlite" = "d1") {}
  private db() { const db = sitesDatabase(); if (!db) throw new Error("SITES_DATABASE_UNAVAILABLE"); return db; }
  async get<T>(namespace: StateNamespace, id: string, ownerId: string) {
    const row = await this.db().prepare("SELECT namespace,id,owner_id,payload,expires_at,created_at,updated_at FROM museion_state WHERE namespace=? AND id=? AND owner_id=? AND expires_at>? LIMIT 1").bind(namespace, id, ownerId, new Date().toISOString()).first<D1StateRow>();
    return row ? fromD1Row<T>(row) : undefined;
  }
  async put<T>(record: StateRecord<T>): Promise<void> {
    await this.db().prepare("INSERT INTO museion_state(namespace,id,owner_id,payload,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(namespace,id) DO UPDATE SET owner_id=excluded.owner_id,payload=excluded.payload,expires_at=excluded.expires_at,updated_at=excluded.updated_at").bind(record.namespace, record.id, record.ownerId, JSON.stringify(record.payload), record.expiresAt, record.createdAt, record.updatedAt).run();
  }
  async compareAndPut<T>(record: StateRecord<T>, expectedUpdatedAt: string): Promise<boolean> {
    const result = await this.db().prepare("UPDATE museion_state SET payload=?,expires_at=?,updated_at=? WHERE namespace=? AND id=? AND owner_id=? AND updated_at=? AND expires_at>?").bind(JSON.stringify(record.payload), record.expiresAt, record.updatedAt, record.namespace, record.id, record.ownerId, expectedUpdatedAt, new Date().toISOString()).run();
    return Number(result.meta?.changes ?? 0) === 1;
  }
  async list<T>(namespace: StateNamespace, ownerId: string): Promise<StateRecord<T>[]> {
    const result = await this.db().prepare("SELECT namespace,id,owner_id,payload,expires_at,created_at,updated_at FROM museion_state WHERE namespace=? AND owner_id=? AND expires_at>? ORDER BY updated_at DESC").bind(namespace, ownerId, new Date().toISOString()).all<D1StateRow>();
    return (result.results ?? []).map(fromD1Row<T>);
  }
  async delete(namespace: StateNamespace, id: string, ownerId: string): Promise<boolean> {
    const result = await this.db().prepare("DELETE FROM museion_state WHERE namespace=? AND id=? AND owner_id=?").bind(namespace, id, ownerId).run();
    return Number(result.meta?.changes ?? 0) > 0;
  }
  async prune(namespace: StateNamespace, now = new Date()): Promise<void> {
    await this.db().prepare("DELETE FROM museion_state WHERE namespace=? AND expires_at<=?").bind(namespace, now.toISOString()).run();
  }
}

interface SupabaseRow {
  namespace: StateNamespace;
  id: string;
  owner_id: string;
  payload: unknown;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

function fromRow<T>(row: SupabaseRow): StateRecord<T> {
  return {
    namespace: row.namespace,
    id: row.id,
    ownerId: row.owner_id,
    payload: row.payload as T,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SupabaseStateBackend implements StateBackend {
  readonly kind = "supabase" as const;

  constructor(private readonly baseUrl: string, private readonly secret: string) {}

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("apikey", this.secret);
    headers.set("Content-Type", "application/json");
    if (!this.secret.startsWith("sb_secret_")) headers.set("Authorization", `Bearer ${this.secret}`);
    const response = await fetch(`${this.baseUrl}/rest/v1/museion_state${path}`, {
      ...init,
      cache: "no-store",
      headers,
    });
    if (!response.ok) throw new Error(`DURABLE_STATE_UNAVAILABLE:${response.status}`);
    return response;
  }

  private filters(namespace: StateNamespace, ownerId: string): string {
    return `namespace=eq.${encodeURIComponent(namespace)}&owner_id=eq.${encodeURIComponent(ownerId)}`;
  }

  async get<T>(namespace: StateNamespace, id: string, ownerId: string): Promise<StateRecord<T> | undefined> {
    const now = encodeURIComponent(new Date().toISOString());
    const response = await this.request(
      `?${this.filters(namespace, ownerId)}&id=eq.${encodeURIComponent(id)}&expires_at=gt.${now}&select=namespace,id,owner_id,payload,expires_at,created_at,updated_at&limit=1`,
    );
    const rows = await response.json() as SupabaseRow[];
    return rows[0] ? fromRow<T>(rows[0]) : undefined;
  }

  async put<T>(record: StateRecord<T>): Promise<void> {
    await this.request("?on_conflict=namespace,id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        namespace: record.namespace,
        id: record.id,
        owner_id: record.ownerId,
        payload: record.payload,
        expires_at: record.expiresAt,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      }),
    });
  }

  async compareAndPut<T>(record: StateRecord<T>, expectedUpdatedAt: string): Promise<boolean> {
    const response = await this.request(
      `?${this.filters(record.namespace, record.ownerId)}&id=eq.${encodeURIComponent(record.id)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          payload: record.payload,
          expires_at: record.expiresAt,
          updated_at: record.updatedAt,
        }),
      },
    );
    return ((await response.json()) as SupabaseRow[]).length === 1;
  }

  async list<T>(namespace: StateNamespace, ownerId: string): Promise<StateRecord<T>[]> {
    const now = encodeURIComponent(new Date().toISOString());
    const response = await this.request(
      `?${this.filters(namespace, ownerId)}&expires_at=gt.${now}&select=namespace,id,owner_id,payload,expires_at,created_at,updated_at`,
    );
    return ((await response.json()) as SupabaseRow[]).map(fromRow<T>);
  }

  async delete(namespace: StateNamespace, id: string, ownerId: string): Promise<boolean> {
    const response = await this.request(
      `?${this.filters(namespace, ownerId)}&id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE", headers: { Prefer: "return=representation" } },
    );
    return ((await response.json()) as SupabaseRow[]).length > 0;
  }

  async prune(namespace: StateNamespace, now = new Date()): Promise<void> {
    await this.request(
      `?namespace=eq.${encodeURIComponent(namespace)}&expires_at=lte.${encodeURIComponent(now.toISOString())}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );
  }
}

const memoryBackend = new MemoryStateBackend();
const d1Backend = new D1StateBackend();
const sqliteBackend = new D1StateBackend("sqlite");

export function stateBackend(): StateBackend {
  if (sitesDatabase()) return sitesEnv()?.DB ? d1Backend : sqliteBackend;
  const selected = process.env.MUSEION_STATE_BACKEND?.trim() || "memory";
  if (selected === "memory") return memoryBackend;
  if (selected !== "supabase") throw new Error("INVALID_STATE_BACKEND");

  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !secret) throw new Error("SUPABASE_STATE_NOT_CONFIGURED");
  try {
    new URL(baseUrl);
  } catch {
    throw new Error("SUPABASE_STATE_NOT_CONFIGURED");
  }
  return new SupabaseStateBackend(baseUrl, secret);
}

export function resetMemoryStateForTests(): void {
  memoryRecords.clear();
}
