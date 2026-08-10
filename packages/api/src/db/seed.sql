-- Sanai3i demo seed data for Cloudflare D1
-- Run once after loading src/db/schema.sql:
--   npx wrangler d1 execute sanai3i --remote --file=packages/api/src/db/seed.sql
-- Idempotent: safe to re-run (guarded with NOT EXISTS).
-- Demo password for every seeded account: password123

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'سباك', 'Plumber', '🚿'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Plumber');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'كهربائي', 'Electrician', '💡'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Electrician');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'نجار', 'Carpenter', '🪚'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Carpenter');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'حداد', 'Blacksmith', '⚒️'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Blacksmith');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'نقاش', 'Painter', '🎨'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Painter');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'سيراميك', 'Tiler', '🧱'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Tiler');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'بناء', 'Mason', '🏗️'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Mason');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'فني تكييف', 'AC Technician', '❄️'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'AC Technician');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'لحام', 'Welder', '🔥'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Welder');

INSERT INTO trades (name_ar, name_en, icon)
SELECT 'قفالي', 'Locksmith', '🔑'
WHERE NOT EXISTS (SELECT 1 FROM trades WHERE name_en = 'Locksmith');

-- Demo technicians
INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'عم محمود السيد', 'm.sayed@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000001', 'المعادي', 29.965, 31.25, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'm.sayed@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'أحمد سامي', 'a.samy@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000002', 'مصر الجديدة', 30.089, 31.336, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'a.samy@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'خالد حسن', 'k.hassan@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000003', 'الزمالك', 30.056, 31.22, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'k.hassan@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'إبراهيم عادل', 'i.adel@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000004', 'العباسية', 30.069, 31.272, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'i.adel@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'مصطفى كمال', 'm.kamal@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000005', 'المقطم', 30.015, 31.28, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'm.kamal@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'طارق فؤاد', 't.fouad@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000006', 'الفيوم', 29.309, 30.842, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 't.fouad@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'وليد النجار', 'w.naggar@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000007', 'حلوان', 29.84, 31.33, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'w.naggar@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'كريم مصطفى', 'k.mostafa@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000008', 'الشروق', 30.12, 31.64, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'k.mostafa@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'فادي تامر', 'f.tamer@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000009', 'الهرم', 29.98, 31.13, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'f.tamer@tech.sanai3i.test');

INSERT INTO users (type, full_name, email, password_hash, phone, area, lat, lng, location_notice_seen)
SELECT 'technician', 'شريف رمزي', 's.ramzy@tech.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01000000010', 'وسط البلد', 30.05, 31.24, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 's.ramzy@tech.sanai3i.test');

-- Link users to technician profiles
INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'سباك محترف بخبرة 15 سنة، متوفر للطوارئ 24/7.', 'on', 20
FROM users u, trades tr
WHERE u.email = 'm.sayed@tech.sanai3i.test' AND tr.name_en = 'Plumber'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'كهربائي منازل ومصانع، أعمال صيانة وإصلاح سريعة.', 'on', 30
FROM users u, trades tr
WHERE u.email = 'a.samy@tech.sanai3i.test' AND tr.name_en = 'Electrician'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'نجار شاطر، مطابخ وأثاث مودرن وكلاسيك.', 'on', 45
FROM users u, trades tr
WHERE u.email = 'k.hassan@tech.sanai3i.test' AND tr.name_en = 'Carpenter'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'حداد أبواب وشبابيك وسلالم.', 'on', 40
FROM users u, trades tr
WHERE u.email = 'i.adel@tech.sanai3i.test' AND tr.name_en = 'Blacksmith'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'نقاش داخلي وخارجي، دهانات حديثة.', 'on', 35
FROM users u, trades tr
WHERE u.email = 'm.kamal@tech.sanai3i.test' AND tr.name_en = 'Painter'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'سيراميك ورخام بتشطيب ممتاز.', 'on', 60
FROM users u, trades tr
WHERE u.email = 't.fouad@tech.sanai3i.test' AND tr.name_en = 'Tiler'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'بناء وعمائر بالكامل، تشطيب تسليم مفتاح.', 'on', 50
FROM users u, trades tr
WHERE u.email = 'w.naggar@tech.sanai3i.test' AND tr.name_en = 'Mason'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'تركيب وصيانة وتنظيف مكيفات.', 'on', 25
FROM users u, trades tr
WHERE u.email = 'k.mostafa@tech.sanai3i.test' AND tr.name_en = 'AC Technician'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'لحام حديد واستانلس، جميع الأعمال المعدنية.', 'on', 30
FROM users u, trades tr
WHERE u.email = 'f.tamer@tech.sanai3i.test' AND tr.name_en = 'Welder'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

INSERT INTO technicians (user_id, trade_id, bio, availability, approx_arrival_min)
SELECT u.id, tr.id, 'قفالي سيارات وأبواب، فتح بدون تكسير.', 'on', 15
FROM users u, trades tr
WHERE u.email = 's.ramzy@tech.sanai3i.test' AND tr.name_en = 'Locksmith'
  AND NOT EXISTS (SELECT 1 FROM technicians t WHERE t.user_id = u.id);

-- Demo client
INSERT INTO users (type, full_name, email, password_hash, phone, address, area, lat, lng, location_notice_seen)
SELECT 'user', 'أحمد محمد', 'client@demo.sanai3i.test', 'pbkdf2$210000$73616e616933692d736565642d73616c742d313662$fa6e8292e43efea6c2c09895b8e43fabf3652f8a64fb3ebb53e6d5d46b0dae88', '01111111111', 'شارع التسعين، المعادي', 'المعادي', 29.97, 31.25, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client@demo.sanai3i.test');

-- Completed booking + 5-star review for the plumber
INSERT INTO bookings (user_id, technician_id, service_type, address, notes, status, requested_time)
SELECT u.id, t.id, 'إصلاح صنبور', 'شارع التسعين، المعادي', 'الصنبور في المطبخ يقطر', 'completed', 'اليوم'
FROM users u, technicians t, users tu
WHERE u.email = 'client@demo.sanai3i.test' AND t.id = tu.id AND tu.email = 'm.sayed@tech.sanai3i.test'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.user_id = u.id AND b.technician_id = t.id AND b.service_type = 'إصلاح صنبور'
  );

INSERT INTO reviews (booking_id, technician_id, user_id, stars, comment)
SELECT b.id, b.technician_id, b.user_id, 5, 'وصل بسرعة وشغل ممتاز 👌'
FROM bookings b
JOIN users u ON u.id = b.user_id
JOIN technicians t ON t.id = b.technician_id
JOIN users tu ON tu.id = t.user_id
WHERE u.email = 'client@demo.sanai3i.test' AND tu.email = 'm.sayed@tech.sanai3i.test' AND b.service_type = 'إصلاح صنبور'
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id);

UPDATE technicians
SET review_count = (SELECT COUNT(*) FROM reviews r WHERE r.technician_id = technicians.id),
    avg_rating = (SELECT ROUND(AVG(stars), 1) FROM reviews r WHERE r.technician_id = technicians.id)
WHERE user_id = (SELECT id FROM users WHERE email = 'm.sayed@tech.sanai3i.test');

-- Completed booking + 4-star review for the electrician
INSERT INTO bookings (user_id, technician_id, service_type, address, notes, status, requested_time)
SELECT u.id, t.id, 'تبديل مفتاح', 'شارع التسعين، المعادي', 'مفتاح النور خربان', 'completed', 'غدا 10 صباحا'
FROM users u, technicians t, users tu
WHERE u.email = 'client@demo.sanai3i.test' AND t.id = tu.id AND tu.email = 'a.samy@tech.sanai3i.test'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.user_id = u.id AND b.technician_id = t.id AND b.service_type = 'تبديل مفتاح'
  );

INSERT INTO reviews (booking_id, technician_id, user_id, stars, comment)
SELECT b.id, b.technician_id, b.user_id, 4, 'أعمال جيدة والأسعار مناسبة.'
FROM bookings b
JOIN users u ON u.id = b.user_id
JOIN technicians t ON t.id = b.technician_id
JOIN users tu ON tu.id = t.user_id
WHERE u.email = 'client@demo.sanai3i.test' AND tu.email = 'a.samy@tech.sanai3i.test' AND b.service_type = 'تبديل مفتاح'
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id);

UPDATE technicians
SET review_count = (SELECT COUNT(*) FROM reviews r WHERE r.technician_id = technicians.id),
    avg_rating = (SELECT ROUND(AVG(stars), 1) FROM reviews r WHERE r.technician_id = technicians.id)
WHERE user_id = (SELECT id FROM users WHERE email = 'a.samy@tech.sanai3i.test');
