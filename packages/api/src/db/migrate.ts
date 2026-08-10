import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Db } from './adapter.js';

const here = dirname(fileURLToPath(import.meta.url));

/** Applies the idempotent schema to any Db (used locally; D1 runs the same file via wrangler). */
export async function migrate(db: Db): Promise<void> {
  const sql = readFileSync(join(here, 'schema.sql'), 'utf8');
  await db.exec(sql);
}
