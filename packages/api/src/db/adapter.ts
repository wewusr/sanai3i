export interface Row {
  [key: string]: unknown;
}

export interface DbResult {
  changes: number;
  lastInsertRowid: number | bigint | undefined;
}

/** Minimal async SQLite surface shared by node:sqlite (local) and D1 (Cloudflare). */
export interface Db {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: unknown[]): Promise<DbResult>;
  get(sql: string, params?: unknown[]): Promise<Row | undefined>;
  all(sql: string, params?: unknown[]): Promise<Row[]>;
}

/** Normalize JS values into something both node:sqlite and D1 accept. */
export function normParams(params: unknown[] | undefined): unknown[] {
  return (params ?? []).map((p) => (p === undefined ? null : p));
}
