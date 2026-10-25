-- 023: Ambil 1 jatah voucher secara atomik (anti rebutan). true = berhasil, false = jatah habis / nonaktif.
CREATE OR REPLACE FUNCTION claim_voucher_use(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vouchers
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE code = p_code
    AND is_active = true
    AND (max_uses IS NULL OR max_uses = 0 OR used_count < max_uses);
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION claim_voucher_use(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_voucher_use(text) TO service_role;

NOTIFY pgrst, 'reload schema';

-- Kembalikan 1 jatah bila pesanan gratis gagal diproses.
CREATE OR REPLACE FUNCTION release_voucher_use(p_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE vouchers SET used_count = GREATEST(used_count - 1, 0), updated_at = now() WHERE code = p_code;
$$;
REVOKE ALL ON FUNCTION release_voucher_use(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION release_voucher_use(text) TO service_role;
NOTIFY pgrst, 'reload schema';
