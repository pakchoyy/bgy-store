const BLOCKED_TAGS = 'script|style|iframe|frame|frameset|object|embed|applet|link|meta|base|form|input|button|textarea|select|svg|math|template|noscript'
const URL_ATTRS = /([\s/"'])(href|src|xlink:href|formaction|action|poster|background)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16) || 32))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(Number(dec) || 32))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;|&newline;/gi, '')
}

function unsafeUrl(value) {
  const normalized = decodeEntities(value).replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase()
  return /^(javascript|vbscript|data):/.test(normalized)
}

const YOUTUBE_IFRAME = /<iframe\b[^>]*?\ssrc\s*=\s*["']https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{6,20})[^"']*["'][^>]*>\s*<\/iframe\s*>/gi
const VIDEO_MARK = /\uE000YT:([A-Za-z0-9_-]{6,20})\uE001/g

export function sanitizeHtml(html) {
  if (typeof html !== 'string' || !html) return ''
  return html
    .replace(/[\uE000\uE001]/g, '')
    .replace(YOUTUBE_IFRAME, (_, id) => `\uE000YT:${id}\uE001`)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(new RegExp(`<(${BLOCKED_TAGS})\\b[\\s\\S]*?<\\/\\1\\s*>`, 'gi'), '')
    .replace(new RegExp(`<\\/?(${BLOCKED_TAGS})\\b[^>]*>`, 'gi'), '')
    .replace(/([\s/"'])on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '$1')
    .replace(URL_ATTRS, (match, lead, attr, _quoted, dq, sq, bare) => (unsafeUrl(dq ?? sq ?? bare ?? '') ? lead : match))
    .replace(/\s+style\s*=\s*("[^"]*"|'[^']*')/gi, (match) => (/expression\(|url\(\s*['"]?\s*javascript:/i.test(match) ? '' : match))
    .replace(VIDEO_MARK, (_, id) => `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video YouTube" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`)
}
