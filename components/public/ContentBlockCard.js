export default function ContentBlockCard({ block }) {
  if (block.block_type === 'image' && block.image_path) {
    const content = (
      <img
        src={block.image_path}
        alt={block.title || ''}
        className="w-full h-auto rounded-2xl shadow-sm"
      />
    )
    return block.url ? (
      <a href={block.url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    ) : (
      content
    )
  }

  if (block.block_type === 'link') {
    return (
      <a
        href={block.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-white rounded-2xl shadow-sm hover:shadow-md border border-white/60 transition-all p-4 active:scale-[0.98]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0d7a8a]">
          ↗
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900 truncate">
            {block.title || block.url}
          </span>
        </span>
      </a>
    )
  }

  if (block.block_type === 'text') {
    return (
      <div
        className="rounded-2xl p-4 shadow-sm"
        style={{ backgroundColor: block.background_color || '#ffffff' }}
      >
        {block.title && <h3 className="text-sm font-bold text-gray-900 mb-1">{block.title}</h3>}
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {block.text_content}
        </div>
      </div>
    )
  }

  return null
}
