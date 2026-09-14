const imageTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const fileExtensions = ['pdf', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
export function validateUpload({ name, size, type, kind }) {
  if (typeof name !== 'string' || name.length > 180 || !Number.isInteger(size) || size <= 0 || !['cover','file'].includes(kind)) throw new Error('File tidak valid.');
  const extension = name.split('.').pop().toLowerCase();
  const limit = kind === 'cover' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
  if (size > limit) throw new Error(kind === 'cover' ? 'Sampul maksimal 5 MB.' : 'File maksimal 50 MB.');
  if (kind === 'cover' ? imageTypes[extension] !== type : !fileExtensions.includes(extension)) throw new Error('Format file tidak didukung.');
  return { bucket: kind === 'cover' ? 'site-media' : 'product-files', extension };
}
