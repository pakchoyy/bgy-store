const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function hasEmailSender() {
  const key = process.env.RESEND_API_KEY
  return !!key && !key.startsWith('your_')
}

export async function sendDownloadEmail({ to, buyerName, productTitle, downloadUrl, expiresAt }) {
  if (!hasEmailSender() || !to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { skipped: true }

  const from = process.env.EMAIL_FROM || 'Bantu Guru Yuk <onboarding@resend.dev>'
  const name = escapeHtml(buyerName || 'Bapak/Ibu')
  const title = escapeHtml(productTitle || 'produk kamu')
  const url = escapeHtml(downloadUrl)
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
    : null

  const html = `<!doctype html><html><body style="margin:0;background:#f0fdfa;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:28px">
<tr><td>
<p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:1px;color:#0d7a8a;text-transform:uppercase">Bantu Guru Yuk</p>
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3">Pembayaran berhasil 🎉</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569">Halo ${name}, terima kasih sudah membeli <strong>${title}</strong>. File kamu sudah siap diunduh.</p>
<a href="${url}" style="display:block;background:#10b981;color:#ffffff;text-decoration:none;text-align:center;font-weight:bold;font-size:15px;padding:14px 20px;border-radius:12px">Download Sekarang</a>
<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#64748b">${expiry ? `Link berlaku sampai ${escapeHtml(expiry)}. ` : ''}Simpan email ini supaya bisa download ulang. Kalau ada kendala, cukup balas email ini atau hubungi kami lewat WhatsApp.</p>
</td></tr></table>
</td></tr></table></body></html>`

  const text = `Halo ${buyerName || 'Bapak/Ibu'}, terima kasih sudah membeli ${productTitle || 'produk kamu'}.\nDownload file: ${downloadUrl}${expiry ? `\nLink berlaku sampai ${expiry}.` : ''}`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `File siap diunduh: ${productTitle || 'Bantu Guru Yuk'}`,
      html,
      text,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
    }),
  })
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${await response.text().catch(() => '')}`)
  }
  return { sent: true }
}

export async function sendAdminOrderEmail({ buyerName, buyerWhatsapp, title, amount, isTip }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL
  if (!hasEmailSender() || !to) return { skipped: true }
  const from = process.env.EMAIL_FROM || 'Bantu Guru Yuk <onboarding@resend.dev>'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'
  const rupiah = `Rp${Number(amount || 0).toLocaleString('id-ID')}`
  const subject = isTip ? `☕ Traktir kopi ${rupiah} dari ${buyerName || 'pendukung'}` : `🛒 Pesanan lunas ${rupiah}: ${title}`
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:480px">
<h2 style="margin:0 0 12px">${escapeHtml(subject)}</h2>
<p style="margin:0 0 4px"><b>Pembeli:</b> ${escapeHtml(buyerName || '-')}</p>
<p style="margin:0 0 4px"><b>WhatsApp:</b> ${escapeHtml(buyerWhatsapp || '-')}</p>
<p style="margin:0 0 4px"><b>Item:</b> ${escapeHtml(title || '-')}</p>
<p style="margin:0 0 16px"><b>Total:</b> ${escapeHtml(rupiah)}</p>
<a href="${escapeHtml(siteUrl)}/admin/pesanan" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;font-weight:bold;padding:10px 16px;border-radius:10px">Buka Admin Pesanan</a>
</div>`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: to.split(',').map((e) => e.trim()).filter(Boolean), subject, html }),
  })
  if (!response.ok) throw new Error(`Resend ${response.status}`)
  return { sent: true }
}

