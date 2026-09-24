-- Voucher validation is public, but only active vouchers can be read.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vouchers' AND policyname = 'public can validate active vouchers'
  ) THEN
    CREATE POLICY "public can validate active vouchers" ON vouchers
    FOR SELECT USING (is_active = true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION increment_voucher_usage(p_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE vouchers
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE code = p_code AND is_active = true;
$$;

REVOKE EXECUTE ON FUNCTION increment_voucher_usage(text) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
