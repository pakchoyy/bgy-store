-- 024: Indeks agar query admin & webhook cepat (hemat CPU Supabase), plus pembersihan data lama.
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_mayar_payment ON orders(mayar_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_paid_product ON orders(product_id) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_analytics_events_product ON analytics_events(product_id) WHERE product_id IS NOT NULL;

-- Hapus catatan kunjungan lebih dari 1 tahun (statistik admin hanya memakai 15-30 hari terakhir).
-- Aman dijalankan ulang kapan saja.
DELETE FROM analytics_events WHERE created_at < now() - interval '365 days';
DELETE FROM error_logs WHERE created_at < now() - interval '90 days';
