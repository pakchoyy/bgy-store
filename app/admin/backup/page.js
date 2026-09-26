function Card({ title, description, href, label }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <a href={href} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {label}
      </a>
    </div>
  )
}

export default function AdminBackup() {
  const month = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }).slice(0, 7)
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Backup Data</h1>
        <p className="mt-0.5 text-sm text-gray-500">Simpan salinan data toko supaya aman kalau terjadi kesalahan.</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <strong>Saran:</strong> unduh backup lengkap <strong>sebulan sekali</strong> dan sebelum perubahan besar, lalu simpan di Google Drive.
        Supabase versi gratis tidak membuat backup otomatis. File produk (PDF, dll.) tetap aman di Supabase Storage; simpan juga file aslinya di laptop/Drive.
      </div>

      <Card
        title="Backup lengkap (JSON)"
        description="Semua produk, FAQ, kategori, halaman, menu, pesanan, voucher, review, dan pengaturan dalam satu file. Dipakai untuk memulihkan data."
        href="/api/admin/backup"
        label="Unduh Backup Lengkap"
      />
      <Card
        title="Semua pesanan (Excel)"
        description="Daftar semua pesanan dan traktir, siap dibuka di Excel atau Google Sheets."
        href="/api/admin/orders-export"
        label="Unduh Pesanan"
      />
      <Card
        title="Laporan bulan ini (Excel)"
        description="Ringkasan pemasukan, produk terlaris, dan transaksi bulan berjalan. Bulan lain bisa dipilih di menu Analytics."
        href={`/api/admin/report?month=${month}`}
        label="Unduh Laporan"
      />
    </div>
  )
}
