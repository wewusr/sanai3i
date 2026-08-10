import { createNodeDb } from './node-db.js';
import { migrate } from './migrate.js';

const dbPath = process.env.DB_PATH ?? joinDbPath();

async function main() {
  const db = createNodeDb(dbPath);
  await migrate(db);
  console.log(`Sanai3i database ready at ${dbPath}`);
}

function joinDbPath(): string {
  return new URL('../../sanai3i.db', import.meta.url).pathname;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
