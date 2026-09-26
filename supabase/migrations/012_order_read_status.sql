-- ============================================================
-- 012 — Order read status for the admin order badge
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_unread ON orders(created_at) WHERE admin_read_at IS NULL;

NOTIFY pgrst, 'reload schema';
