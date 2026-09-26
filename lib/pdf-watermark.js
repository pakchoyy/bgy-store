import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

export const MAX_WATERMARK_BYTES = 4 * 1024 * 1024

const ascii = (text) => String(text || '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim()

export async function watermarkPdf(bytes, { name, email }) {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const owner = [ascii(name), ascii(email)].filter(Boolean).join(' - ') || 'Pembeli'
  const footer = `Lisensi pribadi: ${owner} | Bantu Guru Yuk | Dilarang disebarluaskan`.slice(0, 160)

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize()
    const size = Math.max(6, Math.min(8, width / 80))
    const textWidth = font.widthOfTextAtSize(footer, size)
    page.drawText(footer, {
      x: Math.max(12, (width - textWidth) / 2),
      y: 10,
      size,
      font,
      color: rgb(0.45, 0.45, 0.45),
      opacity: 0.8,
    })
    const mark = ascii(name) || 'Bantu Guru Yuk'
    const markSize = Math.min(38, width / 14)
    page.drawText(mark.slice(0, 40), {
      x: width * 0.18,
      y: height * 0.4,
      size: markSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.08,
      rotate: degrees(35),
    })
  }
  return pdf.save()
}
