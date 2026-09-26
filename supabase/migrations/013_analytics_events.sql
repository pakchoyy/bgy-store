-- ============================================================
-- 013 — Storefront views & clicks for the admin dashboard
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id          bigserial PRIMARY KEY,
  event_type  text NOT NULL CHECK (event_type IN ('view', 'click')),
  path        text CHECK (char_length(path) <= 300),
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read analytics" ON analytics_events;
CREATE POLICY "admin read analytics" ON analytics_events
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "admin delete analytics" ON analytics_events;
CREATE POLICY "admin delete analytics" ON analytics_events
  FOR DELETE USING (is_admin());

-- Visitors log events through /api/track (service role). This policy only
-- matters when the service role key is missing.
DROP POLICY IF EXISTS "public insert analytics" ON analytics_events;
CREATE POLICY "public insert analytics" ON analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (event_type IN ('view', 'click'));

GRANT INSERT ON analytics_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE analytics_events_id_seq TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
