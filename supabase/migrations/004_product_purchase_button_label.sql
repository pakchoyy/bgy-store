ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_button_label text NOT NULL DEFAULT 'Beli Sekarang'
  CHECK (purchase_button_label IN ('Beli Sekarang', 'Pesan Sekarang', 'Dapatkan Sekarang'));

NOTIFY pgrst, 'reload schema';
