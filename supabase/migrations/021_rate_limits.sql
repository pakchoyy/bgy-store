-- 021: Rate limit bersama untuk semua server Vercel (anti brute force login).
CREATE TABLE IF NOT EXISTS rate_limits (
  key       text PRIMARY KEY,
  count     integer NOT NULL DEFAULT 0,
  reset_at  timestamptz NOT NULL
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;  -- tanpa policy: anon/authenticated tidak bisa baca/tulis

-- Tambah 1 hitungan secara atomik; kembalikan true bila sudah melewati batas.
CREATE OR REPLACE FUNCTION hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO rate_limits AS r (key, count, reset_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
    SET count    = CASE WHEN r.reset_at < now() THEN 1 ELSE r.count + 1 END,
        reset_at = CASE WHEN r.reset_at < now() THEN now() + make_interval(secs => p_window_seconds) ELSE r.reset_at END
  RETURNING count INTO v_count;

  -- bersih-bersih ringan
  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day';
  END IF;

  RETURN v_count > p_limit;
END $$;

REVOKE ALL ON FUNCTION hit_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION hit_rate_limit(text, integer, integer) TO service_role;
