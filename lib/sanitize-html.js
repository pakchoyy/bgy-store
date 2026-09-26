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

export function sanitizeHtml(html) {
  if (typeof html !== 'string' || !html) return ''
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(new RegExp(`<(${BLOCKED_TAGS})\\b[\\s\\S]*?<\\/\\1\\s*>`, 'gi'), '')
    .replace(new RegExp(`<\\/?(${BLOCKED_TAGS})\\b[^>]*>`, 'gi'), '')
    .replace(/([\s/"'])on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '$1')
    .replace(URL_ATTRS, (match, lead, attr, _quoted, dq, sq, bare) => (unsafeUrl(dq ?? sq ?? bare ?? '') ? lead : match))
    .replace(/\s+style\s*=\s*("[^"]*"|'[^']*')/gi, (match) => (/expression\(|url\(\s*['"]?\s*javascript:/i.test(match) ? '' : match))
}
