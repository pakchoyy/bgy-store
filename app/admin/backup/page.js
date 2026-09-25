export default function AdminBackup() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">System Backup</h1>
        <p className="text-sm text-gray-500 mt-0.5">Unduh salinan data toko dalam format JSON</p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-2">Export Data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Mengunduh produk, kategori, halaman, pesanan, voucher, dan pengaturan sebagai satu file JSON.
          Berguna sebagai cadangan sebelum melakukan perubahan besar.
        </p>
        <a
          href="/api/admin/backup"
          download
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Unduh Backup (JSON)
        </a>
      </div>
    </div>
  )
}
