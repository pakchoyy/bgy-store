-- ============================================================
-- 017 — Scheduled flash sale price
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_price integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_ends_at timestamptz;

GRANT SELECT (flash_price, flash_ends_at) ON products TO anon;

NOTIFY pgrst, 'reload schema';
