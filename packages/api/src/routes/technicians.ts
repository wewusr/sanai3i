import { Hono } from 'hono';
import { z } from 'zod';
import type { Db, Row } from '../db/adapter.js';
import type { HonoEnv } from '../types.js';
import { authMiddleware, requireTechnician } from '../lib/auth.js';
import { boundingBox, distanceKm } from '../lib/util.js';

const techUpdateSchema = z.object({
  tradeId: z.coerce.number().int().positive().optional(),
  bio: z.string().max(500).optional(),
  availability: z.enum(['on', 'off']).optional(),
  approxArrivalMin: z.coerce.number().int().min(5).max(600).optional(),
  area: z.string().max(120).optional(),
  lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  lng: z.coerce.number().min(-180).max(180).nullable().optional(),
});

interface TechRow extends Row {
  technician_id: number;
  user_id: number;
  full_name: string;
  area: string | null;
  phone: string;
  email: string;
  lat: number | null;
  lng: number | null;
  trade_id: number;
  name_ar: string;
  name_en: string;
  icon: string;
  bio: string;
  availability: 'on' | 'off';
  approx_arrival_min: number;
  avg_rating: number;
  review_count: number;
}

function shapeTech(r: TechRow, distanceKmVal?: number | null) {
  return {
    id: r.technician_id,
    fullName: r.full_name,
    area: r.area ?? '',
    phone: r.phone ?? '',
    trade: { id: r.trade_id, nameAr: r.name_ar, nameEn: r.name_en, icon: r.icon },
    bio: r.bio,
    availability: r.availability,
    approxArrivalMin: r.approx_arrival_min,
    avgRating: r.avg_rating,
    reviewCount: r.review_count,
    distanceKm: distanceKmVal !== undefined ? distanceKmVal : null,
  };
}

const SELECT_TECH = `
  SELECT tc.id AS technician_id, tc.user_id, u.full_name, u.area, u.lat, u.lng, u.phone, u.email,
         tc.trade_id, tr.name_ar, tr.name_en, tr.icon,
         tc.bio, tc.availability, tc.approx_arrival_min, tc.avg_rating, tc.review_count
  FROM technicians tc
  JOIN users u ON u.id = tc.user_id
  JOIN trades tr ON tr.id = tc.trade_id
`;

export function techniciansRoutes(db: Db, secret: string): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  app.get('/', async (c) => {
    const q = c.req.query('q')?.trim() ?? '';
    const trade = c.req.query('trade');
    const latRaw = c.req.query('lat');
    const lngRaw = c.req.query('lng');
    const radiusRaw = c.req.query('radius');

    const lat = latRaw !== undefined ? Number(latRaw) : NaN;
    const lng = lngRaw !== undefined ? Number(lngRaw) : NaN;
    const radius = radiusRaw !== undefined ? Number(radiusRaw) : NaN;
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const hasRadius = Number.isFinite(radius) && radius > 0;

    const where: string[] = [];
    const params: unknown[] = [];

    if (trade && trade !== 'all') {
      where.push('tc.trade_id = ?');
      params.push(Number(trade));
    }
    if (q) {
      where.push(
        '(LOWER(u.full_name) LIKE ? OR LOWER(tr.name_ar) LIKE ? OR LOWER(tr.name_en) LIKE ?)',
      );
      const like = `%${q.toLowerCase()}%`;
      params.push(like, like, like);
    }
    if (hasCoords && hasRadius) {
      const box = boundingBox(lat, lng, radius);
      where.push(
        'u.lat IS NOT NULL AND u.lng IS NOT NULL AND u.lat BETWEEN ? AND ? AND u.lng BETWEEN ? AND ?',
      );
      params.push(box.minLat, box.maxLat, box.minLng, box.maxLng);
    }

    const sql = `${SELECT_TECH}
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY (tc.availability = 'on') DESC, tc.avg_rating DESC, u.full_name ASC
      LIMIT 100`;

    let rows = (await db.all(sql, params)) as TechRow[];

    if (hasCoords) {
      const withDist = rows.map((r) => ({
        ...r,
        distance_km:
          r.lat !== null && r.lng !== null ? distanceKm(lat, lng, r.lat, r.lng) : null,
      }));
      rows = hasRadius
        ? withDist.filter((r) => r.distance_km !== null && (r.distance_km as number) <= radius)
        : withDist;
      rows.sort((a, b) => {
        if ((a.availability === 'on') !== (b.availability === 'on')) {
          return a.availability === 'on' ? -1 : 1;
        }
        const ad = (a.distance_km as number | null) ?? Infinity;
        const bd = (b.distance_km as number | null) ?? Infinity;
        return ad - bd;
      });
      return c.json({
        technicians: rows.map((r) => shapeTech(r, r.distance_km as number | null)),
        query: { hasCoords },
      });
    }

    return c.json({ technicians: rows.map((r) => shapeTech(r)) });
  });

  app.get('/me', authMiddleware(secret), async (c) => {
    const forbidden = await requireTechnician(c);
    if (forbidden) return forbidden;
    const uid = c.get('uid');
    const row = (await db.get(`${SELECT_TECH} WHERE tc.user_id = ?`, [uid])) as
      | TechRow
      | undefined;
    if (!row) return c.json({ error: 'Technician profile not found' }, 404);
    return c.json({ technician: shapeTech(row) });
  });

  app.put('/me', authMiddleware(secret), async (c) => {
    const forbidden = await requireTechnician(c);
    if (forbidden) return forbidden;
    const uid = c.get('uid');

    const body = await c.req.json().catch(() => null);
    const res = techUpdateSchema.safeParse(body);
    if (!res.success) {
      return c.json({ error: res.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }
    const data = res.data;

    const tech = await db.get('SELECT id FROM technicians WHERE user_id = ?', [uid]);
    if (!tech) return c.json({ error: 'Technician profile not found' }, 404);

    if (data.tradeId !== undefined) {
      const trade = await db.get('SELECT id FROM trades WHERE id = ?', [data.tradeId]);
      if (!trade) return c.json({ error: 'Unknown trade' }, 400);
    }

    const tSets: string[] = [];
    const tParams: unknown[] = [];
    const set = (col: string, v: unknown) => {
      if (v === undefined) return;
      tSets.push(`${col} = ?`);
      tParams.push(v);
    };
    set('trade_id', data.tradeId);
    set('bio', data.bio);
    set('availability', data.availability);
    set('approx_arrival_min', data.approxArrivalMin);
    if (tSets.length) {
      tParams.push(uid);
      await db.run(`UPDATE technicians SET ${tSets.join(', ')} WHERE user_id = ?`, tParams);
    }

    const uSets: string[] = [];
    const uParams: unknown[] = [];
    if (data.area !== undefined) {
      uSets.push('area = ?');
      uParams.push(data.area);
    }
    if (data.lat !== undefined) {
      uSets.push('lat = ?');
      uParams.push(data.lat);
    }
    if (data.lng !== undefined) {
      uSets.push('lng = ?');
      uParams.push(data.lng);
    }
    if (uSets.length) {
      uParams.push(uid);
      await db.run(`UPDATE users SET ${uSets.join(', ')} WHERE id = ?`, uParams);
    }

    const row = (await db.get(`${SELECT_TECH} WHERE tc.user_id = ?`, [uid])) as TechRow;
    return c.json({ technician: shapeTech(row) });
  });

  app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'Not found' }, 404);

    const row = (await db.get(`${SELECT_TECH} WHERE tc.id = ?`, [id])) as TechRow | undefined;
    if (!row) return c.json({ error: 'Technician not found' }, 404);

    const reviews = await db.all(
      `SELECT r.stars, r.comment, r.created_at, u.full_name AS reviewer
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.technician_id = ? ORDER BY r.created_at DESC`,
      [id],
    );

    return c.json({
      technician: shapeTech(row),
      reviews: reviews.map((r) => ({
        stars: r.stars,
        comment: r.comment,
        createdAt: r.created_at,
        reviewer: r.reviewer,
      })),
    });
  });

  return app;
}
