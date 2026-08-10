import type { Db } from './db/adapter.js';

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  NODE_ENV?: string;
}

export interface HonoEnv {
  Bindings: Env;
  Variables: {
    uid: number;
    role: 'user' | 'technician';
  };
}

export type Role = 'user' | 'technician';

export interface TradeRow {
  id: number;
  nameAr: string;
  nameEn: string;
  icon: string;
}

export interface UserRow {
  id: number;
  type: Role;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  lat: number | null;
  lng: number | null;
  lang: string;
  theme: string;
  location_notice_seen: number;
}

export interface TechnicianRow {
  id: number;
  user_id: number;
  trade_id: number;
  bio: string;
  availability: 'on' | 'off';
  approx_arrival_min: number;
  avg_rating: number;
  review_count: number;
}

export interface PublicProfile {
  id: number;
  type: Role;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  lang: string;
  theme: string;
  technician: {
    id: number;
    trade: TradeRow | null;
    bio: string;
    availability: 'on' | 'off';
    approxArrivalMin: number;
    avgRating: number;
    reviewCount: number;
  } | null;
}

/** Build the public profile shape shared across auth/me/dashboard endpoints. */
export async function publicProfile(db: Db, uid: number): Promise<PublicProfile | null> {
  const u = (await db.get('SELECT * FROM users WHERE id = ?', [uid])) as UserRow | undefined;
  if (!u) return null;
  const t = (await db.get('SELECT * FROM technicians WHERE user_id = ?', [uid])) as
    | TechnicianRow
    | undefined;
  let tradeNormalized: TradeRow | null = null;
  if (t) {
    const row = (await db.get('SELECT * FROM trades WHERE id = ?', [t.trade_id])) as
      | { id: number; name_ar: string; name_en: string; icon: string }
      | undefined;
    if (row) tradeNormalized = { id: row.id, nameAr: row.name_ar, nameEn: row.name_en, icon: row.icon };
  }
  return {
    id: u.id,
    type: u.type,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    area: u.area,
    lang: u.lang,
    theme: u.theme,
    technician: t
      ? {
          id: t.id,
          trade: tradeNormalized,
          bio: t.bio,
          availability: t.availability,
          approxArrivalMin: t.approx_arrival_min,
          avgRating: t.avg_rating,
          reviewCount: t.review_count,
        }
      : null,
  };
}
