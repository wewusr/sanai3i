import { Hono } from 'hono';
import { z } from 'zod';
import type { Db, Row } from '../db/adapter.js';
import type { HonoEnv } from '../types.js';
import { authMiddleware } from '../lib/auth.js';

const createSchema = z.object({
  technicianId: z.coerce.number().int().positive(),
  serviceType: z.string().max(120).optional().default(''),
  address: z.string().min(5).max(300),
  notes: z.string().max(1000).optional().default(''),
  requestedTime: z.string().max(60).optional().default(''),
});

const statusSchema = z.object({
  status: z.enum(['accepted', 'declined', 'started', 'completed', 'cancelled']),
});

const rateSchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default(''),
});

interface BookingRow extends Row {
  id: number;
  user_id: number;
  technician_id: number;
  service_type: string;
  address: string;
  notes: string;
  status: 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled' | 'declined';
  requested_time: string;
  created_at: string;
}

const REVEALED = new Set(['accepted', 'started', 'completed']);

async function bookingShape(
  db: Db,
  b: BookingRow,
  viewerUid: number,
): Promise<{ booking: Record<string, unknown>; allowed: boolean }> {
  const tech = (await db.get(
    `SELECT tc.id AS technician_id, tc.user_id, tc.availability, u.full_name, u.phone, u.area,
            tr.icon, tr.name_ar, tr.name_en
     FROM technicians tc
     JOIN users u ON u.id = tc.user_id
     JOIN trades tr ON tr.id = tc.trade_id
     WHERE tc.id = ?`,
    [b.technician_id],
  )) as Record<string, unknown> | undefined;

  if (!tech) return { booking: {}, allowed: false };

  const client = (await db.get('SELECT id, full_name, phone, address FROM users WHERE id = ?', [
    b.user_id,
  ])) as Record<string, unknown> | undefined;
  if (!client) return { booking: {}, allowed: false };

  const isClient = b.user_id === viewerUid;
  const isTech = Number(tech.user_id) === viewerUid;
  if (!isClient && !isTech) return { booking: {}, allowed: false };

  const reveal = REVEALED.has(b.status);
  const review = await db.get('SELECT id FROM reviews WHERE booking_id = ?', [b.id]);

  const booking = {
    id: b.id,
    status: b.status,
    serviceType: b.service_type,
    notes: b.notes,
    requestedTime: b.requested_time,
    createdAt: b.created_at,
    address: isClient ? b.address : isTech && reveal ? b.address : null,
    technician: {
      id: tech.technician_id,
      fullName: tech.full_name,
      area: tech.area,
      availability: tech.availability,
      trade: { icon: tech.icon, nameAr: tech.name_ar, nameEn: tech.name_en },
      phone: isClient && reveal ? tech.phone : isTech ? tech.phone : null,
    },
    client: {
      id: client.id,
      fullName: client.full_name,
      phone: isTech && reveal ? client.phone : null,
    },
    rateable: isClient && b.status === 'completed' && !review,
    reviewed: !!review,
  };

  return { booking, allowed: true };
}

export function bookingsRoutes(db: Db, secret: string): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();
  app.use('*', authMiddleware(secret));

  app.post('/', async (c) => {
    if (c.get('role') !== 'user') return c.json({ error: 'User account required' }, 403);

    const body = await c.req.json().catch(() => null);
    const res = createSchema.safeParse(body);
    if (!res.success) return c.json({ error: res.error.issues[0]?.message ?? 'Invalid input' }, 400);
    const data = res.data;

    const tech = await db.get('SELECT id FROM technicians WHERE id = ?', [data.technicianId]);
    if (!tech) return c.json({ error: 'Technician not found' }, 404);

    const inserted = await db.run(
      `INSERT INTO bookings (user_id, technician_id, service_type, address, notes, requested_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [c.get('uid'), data.technicianId, data.serviceType, data.address, data.notes, data.requestedTime],
    );
    const booking = (await db.get('SELECT * FROM bookings WHERE id = ?', [
      Number(inserted.lastInsertRowid),
    ])) as BookingRow;

    const shaped = await bookingShape(db, booking, c.get('uid'));
    return c.json({ booking: shaped.booking }, 201);
  });

  app.get('/', async (c) => {
    const status = c.req.query('status');
    const role = c.get('role');

    let rows: BookingRow[];
    if (role === 'technician') {
      rows = (await db.all(
        `SELECT b.* FROM bookings b
         JOIN technicians tc ON tc.id = b.technician_id
         WHERE tc.user_id = ? ${status ? 'AND b.status = ?' : ''}
         ORDER BY b.created_at DESC`,
        status ? [c.get('uid'), status] : [c.get('uid')],
      )) as BookingRow[];
    } else {
      rows = (await db.all(
        `SELECT * FROM bookings WHERE user_id = ? ${status ? 'AND status = ?' : ''}
         ORDER BY created_at DESC`,
        status ? [c.get('uid'), status] : [c.get('uid')],
      )) as BookingRow[];
    }

    const bookings: Record<string, unknown>[] = [];
    for (const b of rows) {
      const shaped = await bookingShape(db, b, c.get('uid'));
      if (shaped.allowed) bookings.push(shaped.booking);
    }
    return c.json({ bookings });
  });

  app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'Not found' }, 404);
    const b = (await db.get('SELECT * FROM bookings WHERE id = ?', [id])) as
      | BookingRow
      | undefined;
    if (!b) return c.json({ error: 'Booking not found' }, 404);

    const shaped = await bookingShape(db, b, c.get('uid'));
    if (!shaped.allowed) return c.json({ error: 'Forbidden' }, 403);
    return c.json({ booking: shaped.booking });
  });

  app.patch('/:id/status', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json().catch(() => null);
    const res = statusSchema.safeParse(body);
    if (!res.success) return c.json({ error: res.error.issues[0]?.message ?? 'Invalid input' }, 400);
    const next = res.data.status;

    const b = (await db.get('SELECT * FROM bookings WHERE id = ?', [id])) as
      | BookingRow
      | undefined;
    if (!b) return c.json({ error: 'Booking not found' }, 404);

    const role = c.get('role');
    const uid = c.get('uid');

    // Authorize + validate transition
    const transitions: Record<string, Record<string, string[]>> = {
      user: { pending: ['cancelled'] },
      technician: { pending: ['accepted', 'declined'], accepted: ['started'], started: ['completed'] },
    };

    if (role === 'technician') {
      const tech = await db.get('SELECT user_id FROM technicians WHERE id = ?', [b.technician_id]);
      if (!tech || tech.user_id !== uid) return c.json({ error: 'Forbidden' }, 403);
    } else if (b.user_id !== uid) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const allowed = transitions[role]?.[b.status] ?? [];
    if (!allowed.includes(next)) {
      return c.json({ error: `Cannot change status from ${b.status} to ${next}` }, 400);
    }

    await db.run('UPDATE bookings SET status = ? WHERE id = ?', [next, id]);
    const updated = (await db.get('SELECT * FROM bookings WHERE id = ?', [id])) as BookingRow;
    const shaped = await bookingShape(db, updated, uid);
    return c.json({ booking: shaped.booking });
  });

  app.post('/:id/rate', async (c) => {
    if (c.get('role') !== 'user') return c.json({ error: 'User account required' }, 403);

    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json().catch(() => null);
    const res = rateSchema.safeParse(body);
    if (!res.success) return c.json({ error: res.error.issues[0]?.message ?? 'Invalid input' }, 400);

    const b = (await db.get('SELECT * FROM bookings WHERE id = ?', [id])) as
      | BookingRow
      | undefined;
    if (!b) return c.json({ error: 'Booking not found' }, 404);
    if (b.user_id !== c.get('uid')) return c.json({ error: 'Forbidden' }, 403);
    if (b.status !== 'completed') return c.json({ error: 'Only completed bookings can be rated' }, 400);

    const existing = await db.get('SELECT id FROM reviews WHERE booking_id = ?', [id]);
    if (existing) return c.json({ error: 'Already reviewed' }, 409);

    await db.run(
      'INSERT INTO reviews (booking_id, technician_id, user_id, stars, comment) VALUES (?, ?, ?, ?, ?)',
      [id, b.technician_id, b.user_id, res.data.stars, res.data.comment],
    );

    await db.run(
      `UPDATE technicians
       SET review_count = review_count + 1,
           avg_rating = ((avg_rating * review_count) + ?) / (review_count + 1)
       WHERE id = ?`,
      [res.data.stars, b.technician_id],
    );

    const shaped = await bookingShape(db, b, c.get('uid'));
    return c.json({ booking: shaped.booking });
  });

  return app;
}
