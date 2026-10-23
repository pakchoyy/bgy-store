-- 022: Tambahan jumlah terjual (penjualan di luar toko, mis. kode aktivasi dari aplikasi lain).
-- Angka yang tampil di kartu = pesanan lunas di toko + sold_manual.
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_manual integer NOT NULL DEFAULT 0;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sold_manual_check;
ALTER TABLE products ADD CONSTRAINT products_sold_manual_check CHECK (sold_manual >= 0);
