-- ============================================================
-- BGY Digital Store — Lynk-style appearance + product layouts
-- Version: 002
-- ============================================================

-- Per-product card layout (landscape | square | portrait | wide | compact)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS card_layout text
  CHECK (card_layout IN ('landscape', 'square', 'portrait', 'wide', 'compact'))
  DEFAULT 'landscape';

UPDATE products SET card_layout = 'landscape' WHERE card_layout IS NULL;

-- Appearance settings (profile, banner, about, social)
INSERT INTO settings (key, value) VALUES
  ('profile_name', 'Bantu Guru Yuk'),
  ('profile_handle', '@bgy'),
  ('profile_about', 'Toko digital guru — modul ajar, ATP, media pembelajaran.'),
  ('profile_avatar_url', ''),
  ('banner_url', ''),
  ('banner_enabled', 'true'),
  ('bg_color', '#0ea5a0'),
  ('bg_style', 'gradient'),
  ('social_links', '[{"id":"wa","platform":"whatsapp","url":"https://wa.me/6281234567890"},{"id":"tt","platform":"tiktok","url":"https://tiktok.com/@bantuguruyuk"},{"id":"ig","platform":"instagram","url":"https://instagram.com/bantuguruyuk"},{"id":"email","platform":"email","url":"mailto:hello@bantuguruyuk.web.id"}]')
ON CONFLICT (key) DO NOTHING;

-- Asset slots for profile/banner (optional media references)
INSERT INTO assets (key, label) VALUES
  ('profile_avatar', 'Profile Avatar'),
  ('store_banner', 'Store Banner')
ON CONFLICT (key) DO NOTHING;
