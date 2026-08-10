import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { Db, Row } from './adapter.js';

/** Node.js local adapter built on the built-in node:sqlite module (no native deps). */
export function createNodeDb(path: string): Db {
  const sqlite = new DatabaseSync(path);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const sqlInputs = (params: unknown[]): SQLInputValue[] => params as SQLInputValue[];

  return {
    async exec(sql) {
      sqlite.exec(sql);
    },
    async run(sql, params = []) {
      const res = sqlite.prepare(sql).run(...sqlInputs(params));
      return { changes: Number(res.changes), lastInsertRowid: res.lastInsertRowid };
    },
    async get(sql, params = []) {
      return (sqlite.prepare(sql).get(...sqlInputs(params)) as Row | undefined) ?? undefined;
    },
    async all(sql, params = []) {
      return sqlite.prepare(sql).all(...sqlInputs(params)) as Row[];
    },
  };
}
