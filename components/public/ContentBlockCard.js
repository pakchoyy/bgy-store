import { safeUrl } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize-html'

function blockBg(block) {
  const bg = (block.background_color || '').trim()
  if (bg === 'transparent') return 'transparent'
  return /^#[0-9a-f]{3,8}$/i.test(bg) ? bg : '#ffffff'
}

export default function ContentBlockCard({ block }) {
  const href = safeUrl(block.url)

  if (block.block_type === 'image') {
    const src = safeUrl(block.image_path)
    if (!src) return null
    const content = (
      <img
        src={src}
        alt={block.title || ''}
        loading="lazy"
        className="w-full h-auto rounded-2xl shadow-sm"
      />
    )
    return href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    ) : (
      content
    )
  }

  if (block.block_type === 'link') {
    if (!href) return null
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-14 items-center gap-3 bg-white rounded-2xl shadow-sm hover:shadow-md border border-white/60 transition-all p-4 active:scale-[0.98]"
      >
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0d7a8a]">
          ↗
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900 truncate">
          {block.title || href}
        </span>
      </a>
    )
  }

  if (block.block_type === 'text') {
    const html = sanitizeHtml(block.text_content || '')
    const plain = (block.text_content || '').replace(/<[^>]*>/g, '').trim()
    if (!block.title && !plain && !html.includes('<img')) return null
    const transparent = blockBg(block) === 'transparent'
    return (
      <div
        className={`rounded-2xl p-4 ${transparent ? '' : 'shadow-sm'}`}
        style={transparent ? undefined : { backgroundColor: blockBg(block) }}
      >
        {block.title && <h2 className="text-sm font-bold text-gray-900 mb-1">{block.title}</h2>}
        <div
          className="rich-content text-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    )
  }

  return null
}
