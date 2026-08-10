import { createD1Db } from './db/d1-db.js';
import { createApp } from './app.js';
import type { Env } from './types.js';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const db = createD1Db(env.DB);
    const app = createApp(db, {
      jwtSecret: env.JWT_SECRET ?? 'dev-secret-change-me',
      dev: (env.NODE_ENV ?? 'development') !== 'production',
    });
    return app.fetch(request, env, ctx);
  },
};
