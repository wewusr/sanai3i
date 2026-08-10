import { serve } from '@hono/node-server';
import { createNodeDb } from './db/node-db.js';
import { migrate } from './db/migrate.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const dbPath =
  process.env.DB_PATH ?? new URL('../sanai3i.db', import.meta.url).pathname;
const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me';

const db = createNodeDb(dbPath);
await migrate(db);

const app = createApp(db, { jwtSecret, dev: true });

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Sanai3i API listening on http://localhost:${info.port}`);
});
