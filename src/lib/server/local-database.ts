import { chmodSync, mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, resolve } from "node:path";

import type { D1DatabaseLike, D1Result, D1Statement } from "@/lib/sites/runtime";
import { AUTH_VERIFICATION_SCHEMA, LOCAL_SCHEMA, LOCAL_SCHEMA_VERSION } from "./local-schema";

type SqlValue = string | number | bigint | Uint8Array | null;
interface NativeDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    get(...values: SqlValue[]): unknown;
    all(...values: SqlValue[]): unknown[];
    run(...values: SqlValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  };
  close(): void;
}

class LocalStatement implements D1Statement {
  constructor(readonly database: NativeDatabase, readonly query: string, readonly values: SqlValue[] = []) {}
  bind(...values: unknown[]): D1Statement {
    if (values.some((value) => value !== null && !["string", "number", "bigint"].includes(typeof value) && !(value instanceof Uint8Array))) throw new Error("INVALID_SQL_VALUE");
    return new LocalStatement(this.database, this.query, values as SqlValue[]);
  }
  async first<T>(): Promise<T | null> { return (this.database.prepare(this.query).get(...this.values) as T | undefined) ?? null; }
  async all<T>(): Promise<D1Result<T>> { return { success: true, results: this.database.prepare(this.query).all(...this.values) as T[] }; }
  execute<T>(): D1Result<T> {
    const result = this.database.prepare(this.query).run(...this.values);
    return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
  }
  async run<T>(): Promise<D1Result<T>> { return this.execute<T>(); }
}

export class LocalDatabase implements D1DatabaseLike {
  private readonly native: NativeDatabase;
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.native = new DatabaseSync(path);
    this.native.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;");
    this.native.exec("CREATE TABLE IF NOT EXISTS local_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
    const migration = this.native.prepare("SELECT version FROM local_migrations WHERE version=?").get(LOCAL_SCHEMA_VERSION);
    if (!migration) {
      this.native.exec("BEGIN IMMEDIATE");
      try {
        this.native.exec(LOCAL_SCHEMA);
        this.native.exec(AUTH_VERIFICATION_SCHEMA);
        this.native.prepare("INSERT INTO local_migrations(version,applied_at) VALUES(?,?)").run(LOCAL_SCHEMA_VERSION, new Date().toISOString());
        this.native.exec("COMMIT");
      } catch (error) { this.native.exec("ROLLBACK"); throw error; }
    }
    if (path !== ":memory:") chmodSync(path, 0o600);
  }
  prepare(query: string): D1Statement { return new LocalStatement(this.native, query); }
  async batch<T>(statements: D1Statement[]): Promise<D1Result<T>[]> {
    this.native.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => {
        if (!(statement instanceof LocalStatement) || statement.database !== this.native) throw new Error("INVALID_SQL_BATCH");
        return statement.execute<T>();
      });
      this.native.exec("COMMIT");
      return results;
    } catch (error) { this.native.exec("ROLLBACK"); throw error; }
  }
  close(): void { this.native.close(); }
}

const globalDatabase = globalThis as typeof globalThis & { __museionLocalDb?: { path: string; db: LocalDatabase } };

export function localDatabase(): LocalDatabase {
  const configured = process.env.MUSEION_DATABASE_PATH ?? "./data/museion.sqlite";
  const path = configured === ":memory:" ? configured : resolve(configured);
  if (globalDatabase.__museionLocalDb?.path !== path) {
    globalDatabase.__museionLocalDb?.db.close();
    globalDatabase.__museionLocalDb = { path, db: new LocalDatabase(path) };
  }
  return globalDatabase.__museionLocalDb.db;
}

export function closeLocalDatabase(): void {
  globalDatabase.__museionLocalDb?.db.close();
  delete globalDatabase.__museionLocalDb;
}
