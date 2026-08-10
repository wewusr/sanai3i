import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../types.js';
import { verifyToken } from './jwt.js';

export function authMiddleware(secret: string) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const header = c.req.header('Authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return c.json({ error: 'Unauthorized' }, 401);
    const payload = await verifyToken(secret, token);
    if (!payload) return c.json({ error: 'Invalid or expired token' }, 401);
    c.set('uid', payload.uid);
    c.set('role', payload.role);
    await next();
  });
}

/** Technicians-only gate, used after authMiddleware. */
export async function requireTechnician(c: {
  get: (key: 'role') => 'user' | 'technician';
  json: (body: unknown, status?: number) => Response;
}) {
  if (c.get('role') !== 'technician') {
    return c.json({ error: 'Technician account required' }, 403);
  }
  return null;
}
