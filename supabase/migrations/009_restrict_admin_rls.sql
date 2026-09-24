-- Restrict admin database access to users with app_metadata.role = 'admin'.
-- The older bootstrap policies used auth.role() = 'authenticated', which is too broad
-- if a non-admin Supabase user ever receives a session.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

DO $$
DECLARE
  table_name text;
  tables text[] := ARRAY[
    'products',
    'product_faqs',
    'categories',
    'pages',
    'orders',
    'media',
    'assets',
    'homepage_sections',
    'navigation_items',
    'settings',
    'links',
    'contacts',
    'footer_config',
    'footer_links',
    'notifications',
    'error_logs',
    'vouchers'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'admin all ' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (is_admin()) WITH CHECK (is_admin())',
      'admin all ' || table_name,
      table_name
    );
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
