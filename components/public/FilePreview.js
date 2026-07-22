export default function FilePreview({ filePath, previewPath, mimeType, fileSize, fileName }) {
  const getFileIcon = () => {
    if (!mimeType) return 'file';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'zip';
    if (mimeType.includes('image') || mimeType.includes('png') || mimeType.includes('jpg') || mimeType.includes('jpeg')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('doc')) return 'doc';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || mimeType.includes('ppt')) return 'ppt';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('xls')) return 'xls';
    if (mimeType.includes('video') || mimeType.includes('mp4')) return 'video';
    return 'file';
  };

  const iconType = getFileIcon();

  const iconColors = {
    pdf: 'text-red-500 bg-red-50',
    zip: 'text-amber-500 bg-amber-50',
    image: 'text-blue-500 bg-blue-50',
    doc: 'text-indigo-500 bg-indigo-50',
    ppt: 'text-orange-500 bg-orange-50',
    xls: 'text-green-500 bg-green-50',
    video: 'text-purple-500 bg-purple-50',
    file: 'text-gray-500 bg-gray-50',
  };

  const colorClass = iconColors[iconType] || iconColors.file;

  const displayName = fileName || (filePath ? filePath.split('/').pop() : 'File');

  if (previewPath) {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <img
          src={previewPath}
          alt={displayName}
          className="w-full h-48 object-cover"
        />
        <div className="px-4 py-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900 truncate">{displayName}</span>
          </div>
          {fileSize && <span className="text-xs text-gray-400 flex-shrink-0">{fileSize}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {iconType === 'pdf' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
        {fileSize && <p className="text-xs text-gray-400">{fileSize}</p>}
      </div>
    </div>
  );
}
