INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('site-media', 'site-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('product-files', 'product-files', true, 52428800, ARRAY[
    'application/pdf',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read store uploads') THEN
    CREATE POLICY "Public read store uploads" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id IN ('site-media', 'product-files'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload store files') THEN
    CREATE POLICY "Authenticated upload store files" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id IN ('site-media', 'product-files'));
  END IF;
END $$;
