export function csvCell(value) {
  let text = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = `'${text}`
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const csvRow = (...values) => values.map(csvCell).join(';')

export function csvResponse(lines, filename) {
  return new Response(`﻿${lines.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
