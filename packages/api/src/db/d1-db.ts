import type { Db, Row } from './adapter.js';

/** Cloudflare D1 adapter (SQLite under the hood, async first()). */
export function createD1Db(db: D1Database): Db {
  return {
    async exec(sql) {
      await db.exec(sql);
    },
    async run(sql, params = []) {
      const res = await db.prepare(sql).bind(...params).run();
      return {
        changes: Number(res.meta.changes ?? 0),
        lastInsertRowid: Number(res.meta.last_row_id ?? 0),
      };
    },
    async get(sql, params = []) {
      return (await db.prepare(sql).bind(...params).first()) as Row | undefined;
    },
    async all(sql, params = []) {
      const res = await db.prepare(sql).bind(...params).all();
      return res.results as Row[];
    },
  };
}
