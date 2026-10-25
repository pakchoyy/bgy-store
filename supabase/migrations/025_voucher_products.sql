-- 025: Voucher bisa dibatasi ke produk tertentu. NULL / kosong = semua produk.
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS product_ids uuid[];

NOTIFY pgrst, 'reload schema';
