import { createClient } from './supabase-browser';
import { validateUpload } from './media-validation';
export async function uploadMedia(file, kind) {
  const input = { name: file.name, size: file.size, type: file.type, kind };
  validateUpload(input);
  const response = await fetch('/api/admin/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const upload = await response.json();
  if (!response.ok) throw new Error(upload.error);
  const { error } = await createClient().storage.from(upload.bucket).uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type });
  if (error) throw new Error('Unggahan gagal. Periksa koneksi dan coba lagi.');
  const completed = await fetch('/api/admin/media', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, path: upload.path }) });
  const result = await completed.json();
  if (!completed.ok) throw new Error(result.error);
  return result.media;
}
