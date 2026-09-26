export default function WhatsAppBuyButton({ waUrl, product, className = '' }) {
  if (!waUrl || !product) return null
  const text = `Halo Pak Choy, saya mau beli *${product.title}* (Rp${Number(product.sale_price || 0).toLocaleString('id-ID')}) lewat WhatsApp. Bagaimana caranya?`
  const href = `${waUrl}${waUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`
  return (
    <div className={className}>
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />atau<span className="h-px flex-1 bg-slate-200" />
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z" /></svg>
        Beli via WhatsApp
      </a>
      <p className="mt-1.5 text-center text-xs text-slate-500">Tidak punya QRIS/e-wallet atau bingung? Chat admin, kami bantu.</p>
    </div>
  )
}
