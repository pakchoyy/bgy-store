-- 026: Nominal pilihan pembeli + waktu acara (webinar).
-- price_options: pilihan nominal tetap (mis. {20000,40000,50000}); kosong = tidak ada pilihan tetap.
-- allow_custom_price: pembeli boleh isi nominal sendiri, minimal min_price (dan minimal Rp1.000).
-- event_at: tanggal & jam acara; dipakai untuk hitung mundur dan halaman Webinar.
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_options integer[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_custom_price boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_price integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS event_at timestamptz;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_min_price_check;
ALTER TABLE products ADD CONSTRAINT products_min_price_check CHECK (min_price IS NULL OR min_price >= 0);
CREATE INDEX IF NOT EXISTS idx_products_event_at ON products(event_at) WHERE event_at IS NOT NULL;

NOTIFY pgrst, 'reload schema';

-- Pengunjung (anon) hanya boleh membaca kolom tertentu: izinkan kolom baru ini (data publik).
GRANT SELECT (price_options, allow_custom_price, min_price, event_at) ON products TO anon;
NOTIFY pgrst, 'reload schema';
