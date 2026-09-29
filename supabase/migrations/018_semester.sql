-- ============================================================
-- 018 — Product semester label (hide per semester from the store)
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS semester smallint CHECK (semester IN (1, 2));

GRANT SELECT (semester) ON products TO anon;

NOTIFY pgrst, 'reload schema';
