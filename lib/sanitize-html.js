const BLOCKED_TAGS = 'script|style|iframe|frame|frameset|object|embed|applet|link|meta|base|form|input|button|textarea|select|svg|math|template|noscript'

export function sanitizeHtml(html) {
  if (typeof html !== 'string' || !html) return ''
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(new RegExp(`<(${BLOCKED_TAGS})\\b[\\s\\S]*?<\\/\\1\\s*>`, 'gi'), '')
    .replace(new RegExp(`<\\/?(${BLOCKED_TAGS})\\b[^>]*>`, 'gi'), '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src|xlink:href|formaction|action)\s*=\s*("|')?\s*(javascript|vbscript|data):[^"'\s>]*("|')?/gi, '')
    .replace(/\s+style\s*=\s*("[^"]*expression\([^"]*"|'[^']*expression\([^']*')/gi, '')
}
