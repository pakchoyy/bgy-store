-- 019: Pendekkan slug produk lama jadi 10 karakter acak.
-- Link lama tetap jalan: slug lama disimpan dan dialihkan otomatis ke slug baru.
-- Aman dijalankan ulang (produk yang slug-nya sudah <= 10 karakter dilewati).

CREATE TABLE IF NOT EXISTS product_slug_redirects (
  old_slug   text PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_slug_redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read slug redirects" ON product_slug_redirects;
CREATE POLICY "Public read slug redirects" ON product_slug_redirects FOR SELECT USING (true);

DO $$
DECLARE
  p record;
  new_slug text;
  chars constant text := 'abcdefghijklmnopqrstuvwxyz0123456789';
BEGIN
  FOR p IN SELECT id, slug FROM products WHERE length(slug) > 10 LOOP
    LOOP
      SELECT string_agg(substr(chars, 1 + floor(random() * 36)::int, 1), '') INTO new_slug
      FROM generate_series(1, 10);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM products WHERE slug = new_slug)
            AND NOT EXISTS (SELECT 1 FROM product_slug_redirects WHERE old_slug = new_slug);
    END LOOP;

    INSERT INTO product_slug_redirects (old_slug, product_id) VALUES (p.slug, p.id)
    ON CONFLICT (old_slug) DO NOTHING;
    UPDATE products SET slug = new_slug WHERE id = p.id;
  END LOOP;
END $$;

-- Cek hasil: SELECT r.old_slug, p.slug AS slug_baru, p.title FROM product_slug_redirects r JOIN products p ON p.id = r.product_id;
