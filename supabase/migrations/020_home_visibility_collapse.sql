-- 020: Atur produk yang tampil di Beranda + tombol "Lihat selengkapnya" per blok.

-- Produk: on/off tampil di Beranda (default tetap tampil).
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT true;

-- Blok: tampilkan maksimal N produk di bawah blok ini, sisanya dibuka lewat "Lihat selengkapnya".
-- NULL = tampilkan semua.
ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS collapse_after integer;
ALTER TABLE content_blocks DROP CONSTRAINT IF EXISTS content_blocks_collapse_after_check;
ALTER TABLE content_blocks ADD CONSTRAINT content_blocks_collapse_after_check
  CHECK (collapse_after IS NULL OR collapse_after BETWEEN 1 AND 50);
