-- ============================================================
-- 014 — Optional school/institution on product reviews
-- ============================================================

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS reviewer_institution text;

NOTIFY pgrst, 'reload schema';
