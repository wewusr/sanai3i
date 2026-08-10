import { Hono } from 'hono';
import type { HonoEnv } from '../types.js';

const cache = new Map<string, { at: number; data: unknown }>();

/**
 * IP-geolocation fallback.
 * On Cloudflare we use request headers + the free ipwho.is API (no key).
 * The frontend uses this only when the browser GPS is unavailable.
 */
export function geoRoutes(): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  app.get('/ip', async (c) => {
    const ip =
      c.req.header('cf-connecting-ip') ??
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      '';

    const cached = cache.get(ip || 'default');
    if (cached && Date.now() - cached.at < 60 * 60 * 1000) return c.json(cached.data);

    try {
      const resp = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
        headers: { Accept: 'application/json' },
      });
      const j = (await resp.json()) as {
        success?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
        country?: string;
        country_code?: string;
      };

      const data = {
        lat: j.success && typeof j.latitude === 'number' ? j.latitude : null,
        lng: j.success && typeof j.longitude === 'number' ? j.longitude : null,
        city: j.city ?? null,
        country: j.country ?? null,
        countryCode: j.country_code ?? null,
        method: 'ip' as const,
        approximate: true,
      };
      cache.set(ip || 'default', { at: Date.now(), data });
      return c.json(data);
    } catch {
      const data = {
        lat: null,
        lng: null,
        city: null,
        country: c.req.header('cf-ipcountry') ?? null,
        countryCode: c.req.header('cf-ipcountry') ?? null,
        method: 'ip' as const,
        approximate: true,
      };
      return c.json(data);
    }
  });

  return app;
}
