-- Seed data for local preview / first deploy.
-- Passwords below are PBKDF2 hashes (see functions/_lib/auth.js) for:
--   super-admin:  admin@youragency.com   / SuperSecret123!
--   shop sub-admin: owner@fashionhub.example / FashionHub123!
-- CHANGE THESE PASSWORDS after first login in production.

INSERT INTO admins (shop_id, email, password_hash, role) VALUES
  (NULL, 'admin@youragency.com',
   'pbkdf2$100000$27a085cd4f3a347ea4f0070a5431163e$5b1855c309d88093ac446cb17d9d1c278812c48f706af0a7a5a6d8b228b1be3a',
   'super_admin');

INSERT INTO shops (slug, name, logo_url, phone, address, whatsapp_number, instagram_url, facebook_url, other_social_url) VALUES
  ('fashion-hub', 'Fashion Hub',
   'https://picsum.photos/seed/fashionhub-logo/200/200',
   '+91 98765 43210',
   'Shop 14, Sadar Bazaar Road, Sonipat, Haryana 131001',
   '919876543210',
   'https://instagram.com/fashionhub.example',
   'https://facebook.com/fashionhub.example',
   NULL);

INSERT INTO admins (shop_id, email, password_hash, role) VALUES
  ((SELECT id FROM shops WHERE slug = 'fashion-hub'), 'owner@fashionhub.example',
   'pbkdf2$100000$64e16c55e7d58511e4a2a8ac7fcd1350$a93b091da7390b5ef257966015b7918f697bdf8b451627835b9ffd88ee51f1e2',
   'sub_admin');

INSERT INTO categories (shop_id, name, sort_order) VALUES
  ((SELECT id FROM shops WHERE slug = 'fashion-hub'), 'Kurtis', 1),
  ((SELECT id FROM shops WHERE slug = 'fashion-hub'), 'Sarees', 2),
  ((SELECT id FROM shops WHERE slug = 'fashion-hub'), 'Jeans', 3),
  ((SELECT id FROM shops WHERE slug = 'fashion-hub'), 'Tops', 4);

INSERT INTO products (shop_id, category_id, name, price, quantity_available, images, sort_order) VALUES
  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Kurtis'),
   'Ashwini Cotton Straight Kurti', 799, 24,
   '["https://picsum.photos/seed/kurti1-a/600/800","https://picsum.photos/seed/kurti1-b/600/800","https://picsum.photos/seed/kurti1-c/600/800"]', 1),

  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Kurtis'),
   'Meera Anarkali Kurti - Festive', 1349, 12,
   '["https://picsum.photos/seed/kurti2-a/600/800","https://picsum.photos/seed/kurti2-b/600/800"]', 2),

  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Kurtis'),
   'Rangoli Printed A-Line Kurti', 649, 30,
   '["https://picsum.photos/seed/kurti3-a/600/800","https://picsum.photos/seed/kurti3-b/600/800"]', 3),

  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Sarees'),
   'Banarasi Silk Saree - Wedding Edition', 3499, 8,
   '["https://picsum.photos/seed/saree1-a/600/800","https://picsum.photos/seed/saree1-b/600/800","https://picsum.photos/seed/saree1-c/600/800"]', 1),

  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Sarees'),
   'Chanderi Cotton Saree - Daily Wear', 1199, 16,
   '["https://picsum.photos/seed/saree2-a/600/800","https://picsum.photos/seed/saree2-b/600/800"]', 2),

  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Jeans'),
   'Highwaist Stretch Skinny Jeans', 999, 20,
   '["https://picsum.photos/seed/jeans1-a/600/800","https://picsum.photos/seed/jeans1-b/600/800"]', 1),

  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Jeans'),
   'Wide-Leg Denim Jeans - Light Wash', 1099, 14,
   '["https://picsum.photos/seed/jeans2-a/600/800","https://picsum.photos/seed/jeans2-b/600/800"]', 2),

  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Tops'),
   'Off-Shoulder Crepe Top', 549, 0,
   '["https://picsum.photos/seed/top1-a/600/800","https://picsum.photos/seed/top1-b/600/800"]', 1),

  ((SELECT id FROM shops WHERE slug = 'fashion-hub'),
   (SELECT id FROM categories WHERE shop_id = (SELECT id FROM shops WHERE slug = 'fashion-hub') AND name = 'Tops'),
   'Ribbed Knit Crop Top', 449, 25,
   '["https://picsum.photos/seed/top2-a/600/800","https://picsum.photos/seed/top2-b/600/800"]', 2);
