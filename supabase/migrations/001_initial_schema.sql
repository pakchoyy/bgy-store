-- ============================================================
-- BGY Digital Store — Initial Schema Migration
-- Version: 001
-- Referensi: PRD v4 Section 6 (Database) & Section 9 (Keamanan)
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 1.1 categories
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  color       text DEFAULT '#16a34a',
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 1.2 products
CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,
  type            text CHECK (type IN ('free', 'paid')) DEFAULT 'free',
  sale_price      integer DEFAULT 0,
  original_price  integer,
  stock_type      text CHECK (stock_type IN ('unlimited', 'limited')) DEFAULT 'unlimited',
  stock_qty       integer,
  badge           text CHECK (badge IN ('baru', 'terlaris', 'diskon', 'gratis', 'premium', 'custom')),
  badge_custom    text,
  is_featured     boolean DEFAULT false,
  cover_path      text,
  preview_path    text,
  file_path       text,
  file_size       text,
  is_active       boolean DEFAULT false,
  sort_order      integer DEFAULT 0,
  download_count  integer DEFAULT 0,
  published_at    timestamptz,
  deleted_at      timestamptz,
  meta_title      text,
  meta_desc       text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 1.3 product_faqs
CREATE TABLE product_faqs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  question    text NOT NULL,
  answer      text NOT NULL,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 1.4 pages
CREATE TABLE pages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  content         text,
  is_active       boolean DEFAULT false,
  sort_order      integer DEFAULT 0,
  meta_title      text,
  meta_desc       text,
  robots_index    boolean DEFAULT true,
  robots_follow   boolean DEFAULT true,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 1.5 orders
CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid REFERENCES products(id) ON DELETE SET NULL,
  buyer_name       text NOT NULL,
  buyer_whatsapp   text NOT NULL,
  buyer_email      text,
  amount           integer,
  mayar_order_id   text UNIQUE,
  mayar_payment_id text,
  status           text CHECK (status IN ('pending', 'paid', 'failed', 'expired')) DEFAULT 'pending',
  download_token   text UNIQUE,
  token_expires_at timestamptz,
  downloaded_at    timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- 1.6 media
CREATE TABLE media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  path        text NOT NULL UNIQUE,
  url         text NOT NULL,
  size        integer,
  mime_type   text,
  created_at  timestamptz DEFAULT now()
);

-- 1.7 assets
CREATE TABLE assets (
  key         text PRIMARY KEY,
  label       text NOT NULL,
  media_id    uuid REFERENCES media(id) ON DELETE SET NULL,
  updated_at  timestamptz DEFAULT now()
);

-- 1.8 homepage_sections
CREATE TABLE homepage_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  label       text NOT NULL,
  is_visible  boolean DEFAULT true,
  sort_order  integer DEFAULT 0,
  config      jsonb
);

-- 1.9 navigation_items
CREATE TABLE navigation_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label        text NOT NULL,
  target_type  text CHECK (target_type IN ('page', 'product', 'category', 'external')),
  target_id    uuid,
  target_url   text,
  is_visible   boolean DEFAULT true,
  sort_order   integer DEFAULT 0
);

-- 1.10 settings
CREATE TABLE settings (
  key    text PRIMARY KEY,
  value  text
);

-- 1.11 links
CREATE TABLE links (
  key    text PRIMARY KEY,
  label  text NOT NULL,
  url    text
);

-- 1.12 contacts
CREATE TABLE contacts (
  key    text PRIMARY KEY,
  label  text NOT NULL,
  value  text
);

-- 1.13 footer_config
CREATE TABLE footer_config (
  key    text PRIMARY KEY,
  value  text
);

-- 1.14 footer_links
CREATE TABLE footer_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL,
  url        text NOT NULL,
  sort_order integer DEFAULT 0,
  is_visible boolean DEFAULT true
);

-- 1.15 notifications
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL,
  message    text NOT NULL,
  is_read    boolean DEFAULT false,
  payload    jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.16 error_logs
CREATE TABLE error_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL,
  message    text NOT NULL,
  detail     jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true AND is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_products_sort ON products(sort_order, created_at DESC);
CREATE INDEX idx_product_faqs_product ON product_faqs(product_id, sort_order);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_active ON pages(is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_orders_token ON orders(download_token);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_mayar ON orders(mayar_order_id);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_error_logs_type ON error_logs(type);
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);

-- ============================================================
-- 3. RLS POLICIES (PRD Section 9)
-- ============================================================

-- 3.1 Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- 3.2 Public read policies (anon)
CREATE POLICY "public read active products" ON products
FOR SELECT USING (
  is_active = true
  AND deleted_at IS NULL
  AND (published_at IS NULL OR published_at <= now())
);

CREATE POLICY "public read active product_faqs" ON product_faqs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_faqs.product_id
    AND products.is_active = true
    AND products.deleted_at IS NULL
  )
);

CREATE POLICY "public read categories" ON categories
FOR SELECT USING (true);

CREATE POLICY "public read active pages" ON pages
FOR SELECT USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "public read media" ON media
FOR SELECT USING (true);

CREATE POLICY "public read assets" ON assets
FOR SELECT USING (true);

CREATE POLICY "public read visible homepage_sections" ON homepage_sections
FOR SELECT USING (is_visible = true);

CREATE POLICY "public read visible navigation_items" ON navigation_items
FOR SELECT USING (is_visible = true);

CREATE POLICY "public read settings" ON settings
FOR SELECT USING (true);

CREATE POLICY "public read links" ON links
FOR SELECT USING (true);

CREATE POLICY "public read contacts" ON contacts
FOR SELECT USING (true);

CREATE POLICY "public read footer_config" ON footer_config
FOR SELECT USING (true);

CREATE POLICY "public read visible footer_links" ON footer_links
FOR SELECT USING (is_visible = true);

-- 3.3 Admin full access policies (authenticated Supabase user)
CREATE POLICY "admin all products" ON products
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all product_faqs" ON product_faqs
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all categories" ON categories
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all pages" ON pages
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all orders" ON orders
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all media" ON media
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all assets" ON assets
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all homepage_sections" ON homepage_sections
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all navigation_items" ON navigation_items
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all settings" ON settings
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all links" ON links
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all contacts" ON contacts
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all footer_config" ON footer_config
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all footer_links" ON footer_links
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all notifications" ON notifications
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin all error_logs" ON error_logs
FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. RPC FUNCTIONS
-- ============================================================

-- 4.1 increment_download_count
-- Digunakan oleh: POST /api/download/free
CREATE OR REPLACE FUNCTION increment_download_count(p_product_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE products
  SET download_count = download_count + 1
  WHERE id = p_product_id
  RETURNING download_count INTO new_count;

  RETURN new_count;
END;
$$;

-- 4.2 decrement_stock_qty
-- Digunakan oleh: POST /api/webhook/mayar (atomic, mencegah oversell)
CREATE OR REPLACE FUNCTION decrement_stock_qty(p_product_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_qty integer;
BEGIN
  UPDATE products
  SET stock_qty = stock_qty - 1
  WHERE id = p_product_id
    AND stock_type = 'limited'
    AND stock_qty > 0
  RETURNING stock_qty INTO new_qty;

  RETURN new_qty;
END;
$$;

-- ============================================================
-- 5. SEED DATA
-- ============================================================

-- 5.1 categories
INSERT INTO categories (name, slug, color, sort_order) VALUES
  ('Modul Ajar', 'modul-ajar', '#0ea5a0', 1),
  ('ATP', 'atp', '#8b5cf6', 2),
  ('Media Pembelajaran', 'media-pembelajaran', '#f59e0b', 3),
  ('Administrasi', 'administrasi', '#ef4444', 4),
  ('Lainnya', 'lainnya', '#6b7280', 5);

-- 5.2 settings
INSERT INTO settings (key, value) VALUES
  -- Umum
  ('site_name', 'Bantu Guru Yuk'),
  ('site_tagline', 'Toko Digital untuk Guru SD Indonesia'),
  -- Theme
  ('theme_primary_color', '#0ea5a0'),
  ('theme_secondary_color', '#0d7a8a'),
  ('theme_border_radius', 'rounded'),
  ('theme_font', 'Poppins'),
  -- Download
  ('download_traktir_url', 'https://mayar.id/bantuguruyuk'),
  ('download_promo_text', 'Dapatkan lebih banyak materi edukasi menarik lainnya di Bantu Guru Yuk!'),
  ('download_promo_cta_text', 'Lihat Produk Lainnya'),
  ('download_promo_cta_url', 'https://bantuguruyuk.web.id/produk'),
  ('download_countdown_duration', '5'),
  -- Maintenance
  ('maintenance_mode', 'false'),
  ('maintenance_message', 'Kami sedang melakukan perbaikan. Silakan kembali lagi nanti.'),
  -- SEO Global
  ('seo_meta_title', 'Bantu Guru Yuk — Toko Digital untuk Guru SD'),
  ('seo_meta_description', 'Download modul ajar, ATP, media pembelajaran, dan administrasi untuk guru SD Indonesia. Gratis dan berbayar.'),
  ('seo_template_product', '{judul_produk} | {nama_website}'),
  ('seo_template_category', 'Kategori {nama_kategori} | {nama_website}'),
  ('seo_template_page', '{judul_halaman} | {nama_website}'),
  -- Announcement
  ('announcement_active', 'false'),
  ('announcement_text', ''),
  ('announcement_url', ''),
  ('announcement_bg_color', '#0ea5a0'),
  ('announcement_text_color', '#ffffff'),
  ('announcement_start', ''),
  ('announcement_end', ''),
  -- Custom 404
  ('custom_404_title', 'Halaman Tidak Ditemukan'),
  ('custom_404_description', 'Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.'),
  ('custom_404_cta_text', 'Kembali ke Beranda'),
  ('custom_404_cta_url', '/'),
  ('custom_404_product_ids', '[]');

-- 5.3 links
INSERT INTO links (key, label, url) VALUES
  ('mayar', 'Mayar Payment', 'https://mayar.id/bantuguruyuk'),
  ('traktir_url', 'Traktir Kopi', 'https://mayar.id/bantuguruyuk'),
  ('whatsapp', 'WhatsApp', 'https://wa.me/6281234567890'),
  ('tiktok', 'TikTok', 'https://www.tiktok.com/@bantuguruyuk'),
  ('instagram', 'Instagram', 'https://www.instagram.com/bantuguruyuk'),
  ('youtube', 'YouTube', 'https://www.youtube.com/@bantuguruyuk'),
  ('telegram', 'Telegram', 'https://t.me/bantuguruyuk'),
  ('shopee', 'Shopee', ''),
  ('tokopedia', 'Tokopedia', ''),
  ('google_drive', 'Google Drive', '');

-- 5.4 contacts
INSERT INTO contacts (key, label, value) VALUES
  ('whatsapp', 'WhatsApp', '6281234567890'),
  ('email', 'Email', 'hello@bantuguruyuk.web.id'),
  ('tiktok', 'TikTok', '@bantuguruyuk'),
  ('instagram', 'Instagram', '@bantuguruyuk'),
  ('youtube', 'YouTube', '@bantuguruyuk'),
  ('telegram', 'Telegram', '@bantuguruyuk');

-- 5.5 assets
INSERT INTO assets (key, label) VALUES
  ('logo', 'Logo Utama'),
  ('logo_white', 'Logo Versi Putih'),
  ('logo_dark', 'Logo Versi Gelap'),
  ('favicon', 'Favicon'),
  ('default_cover', 'Cover Default Produk'),
  ('og_image', 'OG Image Default'),
  ('hero_bg', 'Background Hero Section'),
  ('placeholder_image', 'Gambar Placeholder'),
  ('no_image', 'Gambar Tidak Ada Gambar'),
  ('image_404', 'Ilustrasi Halaman 404'),
  ('promo_banner', 'Banner Promo Modal Download');

-- 5.6 homepage_sections
INSERT INTO homepage_sections (key, label, is_visible, sort_order, config) VALUES
  ('hero', 'Hero Section', true, 1, '{"title": "Bantu Guru Yuk", "subtitle": "Download modul ajar, ATP, media pembelajaran gratis untuk guru SD Indonesia", "cta_text": "Lihat Produk Gratis", "cta_url": "/free"}'),
  ('featured_products', 'Produk Unggulan', true, 2, '{}'),
  ('categories', 'Kategori', true, 3, '{}'),
  ('free_products', 'Produk Gratis Terbaru', true, 4, '{}'),
  ('promo_banner', 'Banner Promo', false, 5, '{}'),
  ('about', 'Tentang BGY', true, 6, '{"title": "Apa Itu Bantu Guru Yuk?", "content": "Bantu Guru Yuk adalah platform penyedia materi edukasi untuk guru SD Indonesia. Kami menyediakan modul ajar, ATP, media pembelajaran, dan administrasi sekolah secara gratis maupun berbayar."}');

-- 5.7 navigation_items
INSERT INTO navigation_items (label, target_type, target_url, is_visible, sort_order) VALUES
  ('Beranda', 'external', '/', true, 1),
  ('Gratis', 'external', '/free', true, 2),
  ('Produk', 'external', '/produk', true, 3),
  ('Tentang Kami', 'external', '/halaman/tentang-kami', true, 4),
  ('FAQ', 'external', '/halaman/faq', true, 5);

-- 5.8 footer_config
INSERT INTO footer_config (key, value) VALUES
  ('copyright_text', '© 2026 Bantu Guru Yuk. All rights reserved.'),
  ('description', 'Platform toko digital untuk guru SD Indonesia. Download modul ajar, ATP, media pembelajaran, dan administrasi sekolah.'),
  ('show_social_links', 'true');

-- ============================================================
-- 6. PG_CRON — Auto Purge Recycle Bin
-- ============================================================
-- Setiap hari jam 00:00 UTC, hapus permanen produk & halaman
-- yang sudah berada di recycle bin > 30 hari

SELECT cron.schedule(
  'purge-recycle-bin',
  '0 0 * * *',
  $$
  BEGIN
    -- Hapus file produk dari storage yang sudah expired
    -- (dihandle di application layer via service role)

    -- Hapus permanen produk yang sudah di recycle bin > 30 hari
    DELETE FROM products
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';

    -- Hapus permanen halaman yang sudah di recycle bin > 30 hari
    DELETE FROM pages
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';
  END;
  $$
);
