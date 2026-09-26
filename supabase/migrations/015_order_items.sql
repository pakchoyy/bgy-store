-- ============================================================
-- 015 — Multi-product (cart) orders
-- orders.product_id keeps the first item so single-product flows keep working.
-- ============================================================

CREATE TABLE IF NOT EXISTS order_items (
  id          bigserial PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  title       text NOT NULL,
  price       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all order_items" ON order_items;
CREATE POLICY "admin all order_items" ON order_items
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

NOTIFY pgrst, 'reload schema';
