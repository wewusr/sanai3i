import { createNodeDb } from './node-db.js';
import { migrate } from './migrate.js';
import { hashPassword } from '../lib/password.js';

const dbPath = process.env.DB_PATH ?? new URL('../../sanai3i.db', import.meta.url).pathname;

const TRADES = [
  { ar: 'سباك', en: 'Plumber', icon: '🚿' },
  { ar: 'كهربائي', en: 'Electrician', icon: '💡' },
  { ar: 'نجار', en: 'Carpenter', icon: '🪚' },
  { ar: 'حداد', en: 'Blacksmith', icon: '⚒️' },
  { ar: 'نقاش', en: 'Painter', icon: '🎨' },
  { ar: 'سيراميك', en: 'Tiler', icon: '🧱' },
  { ar: 'بناء', en: 'Mason', icon: '🏗️' },
  { ar: 'فني تكييف', en: 'AC Technician', icon: '❄️' },
  { ar: 'لحام', en: 'Welder', icon: '🔥' },
  { ar: 'قفالي', en: 'Locksmith', icon: '🔑' },
];

const TECHS = [
  { name: 'عم محمود السيد', email: 'm.sayed@tech.sanai3i.test', phone: '01000000001', trade: 0, area: 'المعادي', lat: 29.965, lng: 31.25, arrival: 20, bio: 'سباك محترف بخبرة 15 سنة، متوفر للطوارئ 24/7.' },
  { name: 'أحمد سامي', email: 'a.samy@tech.sanai3i.test', phone: '01000000002', trade: 1, area: 'مصر الجديدة', lat: 30.089, lng: 31.336, arrival: 30, bio: 'كهربائي منازل ومصانع، أعمال صيانة وإصلاح سريعة.' },
  { name: 'خالد حسن', email: 'k.hassan@tech.sanai3i.test', phone: '01000000003', trade: 2, area: 'الزمالك', lat: 30.056, lng: 31.22, arrival: 45, bio: 'نجار شاطر، مطابخ وأثاث مودرن وكلاسيك.' },
  { name: 'إبراهيم عادل', email: 'i.adel@tech.sanai3i.test', phone: '01000000004', trade: 3, area: 'العباسية', lat: 30.069, lng: 31.272, arrival: 40, bio: 'حداد أبواب وشبابيك وسلالم.' },
  { name: 'مصطفى كمال', email: 'm.kamal@tech.sanai3i.test', phone: '01000000005', trade: 4, area: 'المقطم', lat: 30.015, lng: 31.28, arrival: 35, bio: 'نقاش داخلي وخارجي، دهانات حديثة.' },
  { name: 'طارق فؤاد', email: 't.fouad@tech.sanai3i.test', phone: '01000000006', trade: 5, area: 'الفيوم', lat: 29.309, lng: 30.842, arrival: 60, bio: 'سيراميك ورخام بتشطيب ممتاز.' },
  { name: 'وليد النجار', email: 'w.naggar@tech.sanai3i.test', phone: '01000000007', trade: 6, area: 'حلوان', lat: 29.84, lng: 31.33, arrival: 50, bio: 'بناء وعمائر بالكامل، تشطيب تسليم مفتاح.' },
  { name: 'كريم مصطفى', email: 'k.mostafa@tech.sanai3i.test', phone: '01000000008', trade: 7, area: 'الشروق', lat: 30.12, lng: 31.64, arrival: 25, bio: 'تركيب وصيانة وتنظيف مكيفات.' },
  { name: 'فادي تامر', email: 'f.tamer@tech.sanai3i.test', phone: '01000000009', trade: 8, area: 'الهرم', lat: 29.98, lng: 31.13, arrival: 30, bio: 'لحام حديد واستانلس، جميع الأعمال المعدنية.' },
  { name: 'شريف رمزي', email: 's.ramzy@tech.sanai3i.test', phone: '01000000010', trade: 9, area: 'وسط البلد', lat: 30.05, lng: 31.24, arrival: 15, bio: 'قفالي سيارات وأبواب، فتح بدون تكسير.' },
];

const PASSWORD = 'password123';

async function main() {
  const db = createNodeDb(dbPath);
  await migrate(db);

  const existing = await db.get('SELECT COUNT(*) AS n FROM trades');
  if (existing && Number(existing.n) > 0) {
    console.log('Database already seeded — skipping. (Delete sanai3i.db to reseed.)');
    return;
  }

  const tradeIds: number[] = [];
  for (const t of TRADES) {
    const r = await db.run('INSERT INTO trades (name_ar, name_en, icon) VALUES (?, ?, ?)', [
      t.ar,
      t.en,
      t.icon,
    ]);
    tradeIds.push(Number(r.lastInsertRowid));
  }

  const passHash = await hashPassword(PASSWORD);

  const techIds: number[] = [];
  for (const t of TECHS) {
    const u = await db.run(
      `INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
       VALUES ('technician', ?, ?, ?, ?, ?, ?, ?, 1)`,
      [t.name, t.email, passHash, t.phone, t.area, t.lat, t.lng],
    );
    const uid = Number(u.lastInsertRowid);
    const tech = await db.run(
      `INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
       VALUES (?, ?, ?, 'on', ?)`,
      [uid, tradeIds[t.trade], t.bio, t.arrival],
    );
    techIds.push(Number(tech.lastInsertRowid));
  }

  const clientRes = await db.run(
    `INSERT INTO users (type, full_name, email, password_hash, phone, address, area, lat, lng, location_notice_seen)
     VALUES ('user', 'أحمد محمد', 'client@demo.sanai3i.test', ?, '01111111111', 'شارع التسعين، المعادي', 'المعادي', 29.97, 31.25, 1)`,
    [passHash],
  );
  const clientId = Number(clientRes.lastInsertRowid);

  // A completed booking + review for the first two technicians.
  const b1 = await db.run(
    `INSERT INTO bookings (user_id, technician_id, service_type, address, notes, status, requested_time)
     VALUES (?, ?, 'إصلاح صنبور', 'شارع التسعين، المعادي', 'الصنبور في المطبخ يقطر', 'completed', 'اليوم')`,
    [clientId, techIds[0]],
  );
  const b1Id = Number(b1.lastInsertRowid);
  await db.run(
    'INSERT INTO reviews (booking_id, technician_id, user_id, stars, comment) VALUES (?, ?, ?, 5, ?)',
    [b1Id, techIds[0], clientId, 'وصل بسرعة وشغل ممتاز 👌'],
  );
  await db.run(
    'UPDATE technicians SET review_count = 1, avg_rating = 5 WHERE id = ?',
    [techIds[0]],
  );

  const b2 = await db.run(
    `INSERT INTO bookings (user_id, technician_id, service_type, address, notes, status, requested_time)
     VALUES (?, ?, 'تبديل مفتاح', 'شارع التسعين، المعادي', 'مفتاح النور خربان', 'completed', 'غدا 10 صباحا')`,
    [clientId, techIds[1]],
  );
  const b2Id = Number(b2.lastInsertRowid);
  await db.run(
    'INSERT INTO reviews (booking_id, technician_id, user_id, stars, comment) VALUES (?, ?, ?, 4, ?)',
    [b2Id, techIds[1], clientId, 'أعمال جيدة والأسعار مناسبة.'],
  );
  await db.run(
    'UPDATE technicians SET review_count = 1, avg_rating = 4 WHERE id = ?',
    [techIds[1]],
  );

  const b3 = await db.run(
    `INSERT INTO bookings (user_id, technician_id, service_type, address, notes, status, requested_time)
     VALUES (?, ?, 'تركيب مكيف', 'شارع التسعين، المعادي', '', 'accepted', 'الجمعة')`,
    [clientId, techIds[7]],
  );
  void b3;

  console.log('Seeded Sanai3i demo data.');
  console.log('Demo client:  client@demo.sanai3i.test  / password123');
  console.log(`Demo tech:    ${TECHS[0].email}  / password123`);
  console.log('All sample technician passwords: password123');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
