/** Narrow declarations for the Node >=22.13 builtin used by our server.
 * The existing @types/node 20 package does not include node:sqlite yet. */
declare module "node:sqlite" {
  type SqlValue = string | number | bigint | Uint8Array | null;
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      get(...values: SqlValue[]): unknown;
      all(...values: SqlValue[]): unknown[];
      run(...values: SqlValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    };
    close(): void;
  }
}
