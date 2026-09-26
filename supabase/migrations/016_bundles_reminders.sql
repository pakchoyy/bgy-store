-- ============================================================
-- 016 — Product bundles and payment reminders
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS bundle_product_ids uuid[];
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

NOTIFY pgrst, 'reload schema';
