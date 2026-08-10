import { Hono } from 'hono';
import type { Db } from '../db/adapter.js';
import type { HonoEnv } from '../types.js';

export function tradesRoutes(db: Db): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  app.get('/', async (c) => {
    const rows = await db.all('SELECT * FROM trades ORDER BY id ASC');
    return c.json({
      trades: rows.map((r) => ({
        id: r.id,
        nameAr: r.name_ar,
        nameEn: r.name_en,
        icon: r.icon,
      })),
    });
  });

  return app;
}
