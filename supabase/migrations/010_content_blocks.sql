-- ============================================================
-- Content Blocks — simple Lynk-style blocks (text/image/link)
-- Rendered on the storefront interleaved with products by sort_order.
-- Version: 010
-- ============================================================

CREATE TABLE content_blocks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type        text CHECK (block_type IN ('text', 'image', 'link')) NOT NULL,
  title             text,
  url               text,
  text_content      text,
  background_color  text DEFAULT '#ffffff',
  image_path        text,
  sort_order        integer DEFAULT 0,
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_content_blocks_sort ON content_blocks(sort_order);
CREATE INDEX idx_content_blocks_active ON content_blocks(is_active);

ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active content_blocks" ON content_blocks
FOR SELECT USING (is_active = true);

CREATE POLICY "admin all content_blocks" ON content_blocks
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

NOTIFY pgrst, 'reload schema';
