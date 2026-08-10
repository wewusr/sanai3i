import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createNodeDb } from './db/node-db.js';
import { migrate } from './db/migrate.js';
import { createApp } from './app.js';

const dbFile = join(tmpdir(), `sanai3i-test-${Date.now()}.db`);
const db = createNodeDb(dbFile);
const secret = 'test-secret';
const app = createApp(db, { jwtSecret: secret, dev: true });

let userToken = '';
let techToken = '';
let bookingId = 0;

before(async () => {
  await migrate(db);
  // seed one trade
  await db.run("INSERT INTO trades (name_ar, name_en, icon) VALUES ('سباك', 'Plumber', '🚿')");
});

after(() => {
  rmSync(dbFile, { force: true });
});

async function req(method: string, path: string, body?: unknown, token?: string) {
  const res = await app.request(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as Record<string, any> | null;
  return { status: res.status, json };
}

test('signup user', async () => {
  const { status, json } = await req('POST', '/api/auth/signup', {
    type: 'user',
    fullName: 'محمود',
    email: 'user@test.dev',
    password: 'password123',
    address: 'شارع',
    area: 'الجيزة',
  });
  assert.equal(status, 200);
  userToken = json!.token as string;
  assert.equal(json!.user.type, 'user');
});

test('signup technician requires trade', async () => {
  const { status } = await req('POST', '/api/auth/signup', {
    type: 'technician',
    fullName: 'علي',
    email: 'tech@test.dev',
    password: 'password123',
  });
  assert.equal(status, 400);
});

test('signup technician', async () => {
  const { status, json } = await req('POST', '/api/auth/signup', {
    type: 'technician',
    fullName: 'علي',
    email: 'tech@test.dev',
    password: 'password123',
    tradeId: 1,
  });
  assert.equal(status, 200);
  techToken = json!.token as string;
  assert.equal(json!.user.technician.trade.nameEn, 'Plumber');
});

test('duplicate email rejected', async () => {
  const { status } = await req('POST', '/api/auth/signup', {
    type: 'user',
    fullName: 'محمود',
    email: 'user@test.dev',
    password: 'password123',
  });
  assert.equal(status, 409);
});

test('login wrong password rejected', async () => {
  const { status } = await req('POST', '/api/auth/login', {
    email: 'user@test.dev',
    password: 'wrong',
  });
  assert.equal(status, 401);
});

test('search technicians by trade name', async () => {
  const { status, json } = await req('GET', '/api/technicians?q=سباك');
  assert.equal(status, 200);
  const list = json!.technicians as unknown[];
  assert.equal(list.length, 1);
});

test('create booking then user cannot accept', async () => {
  const { status, json } = await req(
    'POST',
    '/api/bookings',
    { technicianId: 1, address: 'شارع النيل 5', serviceType: 'إصلاح' },
    userToken,
  );
  assert.equal(status, 201);
  bookingId = (json!.booking as { id: number }).id;

  const res2 = await req('PATCH', `/api/bookings/${bookingId}/status`, { status: 'accepted' }, userToken);
  assert.equal(res2.status, 400);
});

test('technician accepts booking, client info revealed', async () => {
  const beforeAccept = await req('GET', `/api/bookings/${bookingId}`, undefined, techToken);
  assert.equal(beforeAccept.json!.booking.client.phone, null);

  const { status, json } = await req(
    'PATCH',
    `/api/bookings/${bookingId}/status`,
    { status: 'accepted' },
    techToken,
  );
  assert.equal(status, 200);
  assert.equal(json!.booking.client.phone, '');
  assert.equal(json!.booking.status, 'accepted');
});

test('complete booking and rate', async () => {
  await req('PATCH', `/api/bookings/${bookingId}/status`, { status: 'started' }, techToken);
  await req('PATCH', `/api/bookings/${bookingId}/status`, { status: 'completed' }, techToken);

  const { status, json } = await req(
    'POST',
    `/api/bookings/${bookingId}/rate`,
    { stars: 5, comment: 'ممتاز' },
    userToken,
  );
  assert.equal(status, 200);
  assert.equal(json!.booking.rateable, false);

  const again = await req('POST', `/api/bookings/${bookingId}/rate`, { stars: 1 }, userToken);
  assert.equal(again.status, 409);
});

test('forgot + reset password', async () => {
  const { json } = await req('POST', '/api/auth/forgot-password', { email: 'user@test.dev' });
  const token = json!.devToken as string;
  assert.ok(token);

  const reset = await req('POST', '/api/auth/reset-password', {
    token,
    newPassword: 'newpassword1',
  });
  assert.equal(reset.status, 200);

  const login = await req('POST', '/api/auth/login', {
    email: 'user@test.dev',
    password: 'newpassword1',
  });
  assert.equal(login.status, 200);
});

test('change-password requires auth', async () => {
  const { status } = await req('POST', '/api/auth/change-password', {
    currentPassword: 'newpassword1',
    newPassword: 'password123',
  });
  assert.equal(status, 401);
});

test('protected bookings route rejects anonymous', async () => {
  const { status } = await req('GET', '/api/bookings');
  assert.equal(status, 401);
});
