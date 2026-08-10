import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Db } from './db/adapter.js';
import type { HonoEnv } from './types.js';
import { authRoutes } from './routes/auth.js';
import { tradesRoutes } from './routes/trades.js';
import { techniciansRoutes } from './routes/technicians.js';
import { bookingsRoutes } from './routes/bookings.js';
import { geoRoutes } from './routes/geo.js';

export interface AppOptions {
  jwtSecret: string;
  /** When true, forgot-password returns the reset token in the response (local dev). */
  dev?: boolean;
}

/** Build the Hono app against any Db (node:sqlite locally, D1 on Cloudflare). */
export function createApp(db: Db, opts: AppOptions): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  app.use('*', cors());

  app.get('/', (c) => c.json({ name: 'Sanai3i API', version: '0.1.0' }));
  app.notFound((c) => c.json({ error: 'Not found' }, 404));

  app.route('/api/auth', authRoutes(db, opts.jwtSecret, opts.dev ?? false));
  app.route('/api/trades', tradesRoutes(db));
  app.route('/api/technicians', techniciansRoutes(db, opts.jwtSecret));
  app.route('/api/bookings', bookingsRoutes(db, opts.jwtSecret));
  app.route('/api/geo', geoRoutes());

  return app;
}
