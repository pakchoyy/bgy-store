-- ===================================================================
-- BGY Store — Schema Sync Migration
-- Fixes: meta_desc→meta_description rename, add missing columns, triggers
-- ===================================================================

-- 1. Rename meta_desc → meta_description (root cause of PGRST204 error)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'meta_desc'
  ) THEN
    ALTER TABLE products RENAME COLUMN meta_desc TO meta_description;
  END IF;
END $$;

-- 2. Add card_layout column (from migration 002, made idempotent)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS card_layout text
  CHECK (card_layout IN ('landscape', 'square', 'portrait', 'wide', 'compact'))
  DEFAULT 'landscape';

-- 3. Add missing media reference columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mime_type text;

-- 4. updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_products_updated_at'
  ) THEN
    CREATE TRIGGER set_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 5. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 6. Seed appearance settings (from migration 002, made idempotent)
INSERT INTO settings (key, value) VALUES
  ('profile_name', 'Bantu Guru Yuk'),
  ('profile_handle', '@bgy'),
  ('profile_about', 'Toko digital guru — modul ajar, ATP, media pembelajaran.'),
  ('profile_avatar_url', ''),
  ('banner_url', ''),
  ('banner_enabled', 'true'),
  ('bg_color', '#0ea5a0'),
  ('bg_style', 'gradient'),
  ('social_links', '[]')
ON CONFLICT (key) DO NOTHING;

INSERT INTO assets (key, label) VALUES
  ('profile_avatar', 'Profile Avatar'),
  ('store_banner', 'Store Banner')
ON CONFLICT (key) DO NOTHING;
