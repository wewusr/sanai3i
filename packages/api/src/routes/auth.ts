import { Hono } from 'hono';
import { z } from 'zod';
import type { Db } from '../db/adapter.js';
import type { HonoEnv, PublicProfile } from '../types.js';
import { publicProfile } from '../types.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { randomToken, sha256Hex } from '../lib/util.js';
import { authMiddleware } from '../lib/auth.js';

const signupSchema = z.object({
  type: z.enum(['user', 'technician']),
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  phone: z.string().max(30).optional().default(''),
  address: z.string().max(300).optional().default(''),
  area: z.string().max(120).optional().default(''),
  tradeId: z.coerce.number().int().positive().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

const updateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  area: z.string().max(120).optional(),
  lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  lng: z.coerce.number().min(-180).max(180).nullable().optional(),
  lang: z.enum(['ar', 'en']).optional(),
  theme: z.enum(['auto', 'light', 'dark']).optional(),
  locationNoticeSeen: z.coerce.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(8).max(200),
});

function parse<T>(schema: z.ZodType<T>, body: unknown): { data?: T; error?: string } {
  const res = schema.safeParse(body);
  if (!res.success) {
    const first = res.error.issues[0];
    return { error: first ? first.message : 'Invalid input' };
  }
  return { data: res.data };
}

export function authRoutes(db: Db, secret: string, dev: boolean): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  app.post('/signup', async (c) => {
    const { data, error } = parse(signupSchema, await c.req.json().catch(() => null));
    if (!data) return c.json({ error: error ?? 'Invalid input' }, 400);

    if (data.type === 'technician') {
      if (!data.tradeId) return c.json({ error: 'Trade is required for technician accounts' }, 400);
      const trade = await db.get('SELECT id FROM trades WHERE id = ?', [data.tradeId]);
      if (!trade) return c.json({ error: 'Unknown trade' }, 400);
    }

    const exists = await db.get('SELECT id FROM users WHERE email = ?', [data.email.toLowerCase()]);
    if (exists) return c.json({ error: 'An account with this email already exists' }, 409);

    const passwordHash = await hashPassword(data.password);
    const res = await db.run(
      `INSERT INTO users (type, full_name, email, password_hash, phone, address, area)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.type,
        data.fullName,
        data.email.toLowerCase(),
        passwordHash,
        data.phone,
        data.address,
        data.area,
      ],
    );
    const uid = Number(res.lastInsertRowid);

    if (data.type === 'technician') {
      await db.run(
        'INSERT INTO technicians (user_id, trade_id) VALUES (?, ?)',
        [uid, data.tradeId],
      );
    }

    const token = await signToken(secret, { uid, role: data.type });
    const profile = await publicProfile(db, uid);
    return c.json({ token, user: profile });
  });

  app.post('/login', async (c) => {
    const { data, error } = parse(loginSchema, await c.req.json().catch(() => null));
    if (!data) return c.json({ error: error ?? 'Invalid input' }, 400);

    const row = await db.get('SELECT * FROM users WHERE email = ?', [data.email.toLowerCase()]);
    if (!row) return c.json({ error: 'Invalid email or password' }, 401);

    const ok = await verifyPassword(data.password, row.password_hash as string);
    if (!ok) return c.json({ error: 'Invalid email or password' }, 401);

    const role = row.type as 'user' | 'technician';
    const token = await signToken(secret, { uid: row.id as number, role });
    const profile = (await publicProfile(db, row.id as number)) as PublicProfile;
    return c.json({ token, user: profile });
  });

  app.use('/me', authMiddleware(secret));
  app.use('/change-password', authMiddleware(secret));

  app.get('/me', async (c) => {
    const uid = c.get('uid');
    const profile = await publicProfile(db, uid);
    if (!profile) return c.json({ error: 'User not found' }, 404);
    return c.json({ user: profile });
  });

  app.put('/me', async (c) => {
    const uid = c.get('uid');
    const { data, error } = parse(updateSchema, await c.req.json().catch(() => null));
    if (!data) return c.json({ error: error ?? 'Invalid input' }, 400);

    const sets: string[] = [];
    const params: unknown[] = [];
    const set = (col: string, v: unknown) => {
      if (v === undefined) return;
      sets.push(`${col} = ?`);
      params.push(v === null ? null : v);
    };
    set('full_name', data.fullName);
    set('phone', data.phone);
    set('address', data.address);
    set('area', data.area);
    set('lat', data.lat);
    set('lng', data.lng);
    set('lang', data.lang);
    set('theme', data.theme);
    set('location_notice_seen', data.locationNoticeSeen === true ? 1 : undefined);

    if (sets.length > 0) {
      params.push(uid);
      await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    const profile = await publicProfile(db, uid);
    return c.json({ user: profile });
  });

  app.post('/change-password', async (c) => {
    const uid = c.get('uid');
    const { data, error } = parse(changePasswordSchema, await c.req.json().catch(() => null));
    if (!data) return c.json({ error: error ?? 'Invalid input' }, 400);

    const row = await db.get('SELECT password_hash FROM users WHERE id = ?', [uid]);
    if (!row) return c.json({ error: 'User not found' }, 404);

    const ok = await verifyPassword(data.currentPassword, row.password_hash as string);
    if (!ok) return c.json({ error: 'Current password is incorrect' }, 400);

    const passwordHash = await hashPassword(data.newPassword);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, uid]);
    return c.json({ ok: true });
  });

  app.post('/forgot-password', async (c) => {
    const { data, error } = parse(forgotSchema, await c.req.json().catch(() => null));
    if (!data) return c.json({ error: error ?? 'Invalid input' }, 400);

    const row = await db.get('SELECT id FROM users WHERE email = ?', [data.email.toLowerCase()]);
    if (!row) {
      // Don't leak whether an email exists; always return ok.
      return c.json({ ok: true, devToken: dev ? 'no-such-user' : undefined });
    }

    const token = randomToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db.run('DELETE FROM reset_tokens WHERE user_id = ?', [row.id]);
    await db.run(
      'INSERT INTO reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [row.id, sha256Hex(token), expires],
    );

    // In production this would be emailed via Resend etc.
    return c.json({ ok: true, devToken: dev ? token : undefined });
  });

  app.post('/reset-password', async (c) => {
    const { data, error } = parse(resetSchema, await c.req.json().catch(() => null));
    if (!data) return c.json({ error: error ?? 'Invalid input' }, 400);

    const row = await db.get(
      'SELECT * FROM reset_tokens WHERE token_hash = ? AND expires_at > ?',
      [sha256Hex(data.token), new Date().toISOString()],
    );
    if (!row) return c.json({ error: 'Invalid or expired token' }, 400);

    const passwordHash = await hashPassword(data.newPassword);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      row.user_id,
    ]);
    await db.run('DELETE FROM reset_tokens WHERE id = ?', [row.id]);
    return c.json({ ok: true });
  });

  return app;
}
