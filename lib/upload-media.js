import { createClient } from './supabase-browser';
import { validateUpload } from './media-validation';
const COMPRESSIBLE = /^image\/(jpeg|png|webp)$/;
const MAX_SIDE = 1600;

async function compressImage(file) {
  if (typeof window === 'undefined' || !COMPRESSIBLE.test(file.type) || file.size < 250 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

export async function uploadMedia(originalFile, kind) {
  const file = kind === 'cover' ? await compressImage(originalFile) : originalFile;
  const input = { name: file.name, size: file.size, type: file.type, kind };
  validateUpload(input);
  const response = await fetch('/api/admin/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const upload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(upload.error || 'Tautan unggah tidak dapat dibuat.');
  if (typeof upload.bucket !== 'string' || typeof upload.path !== 'string' || typeof upload.token !== 'string') {
    throw new Error('Server belum mengirim data unggah yang lengkap. Coba lagi atau hubungi admin.');
  }
  const { error } = await createClient().storage.from(upload.bucket).uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type });
  if (error) throw new Error('Unggahan gagal. Periksa koneksi dan coba lagi.');
  const completed = await fetch('/api/admin/media', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, path: upload.path }) });
  const result = await completed.json().catch(() => ({}));
  if (!completed.ok) throw new Error(result.error || 'Informasi file gagal disimpan.');
  if (typeof result.media?.url !== 'string' || !result.media.url) throw new Error('Alamat file hasil unggah tidak valid.');
  return result.media;
}
