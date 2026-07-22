# UserFlow — BGY Digital Store
**Referensi:** PRD Final v4.0
**Dibuat:** Juli 2026
**Status:** Final — Siap Implementasi

---

## Konvensi

- **[P]** = Pengunjung (publik, belum tentu login)
- **[B]** = Pembeli (pengunjung yang melakukan pembelian)
- **[A]** = Admin (Pak Choy, sudah login)
- `→` = navigasi / aksi berikutnya
- `✓` = kondisi berhasil
- `✗` = kondisi gagal / error
- `[DB]` = interaksi dengan database/API
- `[EXT]` = keluar ke layanan eksternal (Mayar, WhatsApp, dll)

---

## BAGIAN 1 — ALUR PENGUNJUNG (PUBLIK)

---

### UF-01 · Kunjungi Halaman Home

```
[P] Buka bantuguruyuk.web.id
  → [DB] Cek settings: maintenance_mode
  → Jika true → tampilkan Halaman Maintenance (UF-M1)
  → Jika false → lanjut

  → [DB] Ambil: homepage_sections (is_visible=true, urut sort_order)
  → [DB] Ambil: navigation_items (is_visible=true, urut sort_order)
  → [DB] Ambil: settings (announcement, footer, theme)
  → [DB] Ambil: produk is_featured=true, is_active=true (untuk seksi Produk Unggulan)
  → [DB] Ambil: produk free terbaru (untuk seksi Produk Gratis Terbaru)
  → [DB] Ambil: kategori aktif (untuk seksi Kategori)

  → Render halaman:
    - Announcement Bar (jika aktif dan dalam masa aktif)
    - Navbar (dari navigation_items)
    - Seksi homepage sesuai urutan dan visibilitas
    - Footer (dari footer_config + footer_links)

  [P] Klik menu navigasi → UF-02 / UF-03 / UF-07 / UF-09
  [P] Klik CTA hero → UF-02 atau UF-03
  [P] Klik card produk unggulan → UF-04
  [P] Klik card produk gratis → UF-02 lanjut ke detail atau langsung UF-FD1
```

---

### UF-02 · Jelajah Halaman Free Download

```
[P] Buka /free
  → [DB] Ambil: produk type='free', is_active=true, deleted_at IS NULL
           ORDER BY sort_order ASC, created_at DESC
  → [DB] Ambil: kategori yang punya produk free aktif

  → Render grid card produk:
    - Cover, judul, deskripsi singkat, ukuran file
    - Badge kategori (warna dari kategori)
    - Badge produk (jika badge IS NOT NULL)
    - Tombol "Download Gratis"

  [P] Ketik di search box
    → [DB] Full-text search produk free
    → Update grid hasil

  [P] Klik filter kategori
    → Filter grid by kategori
    → URL update: /free?category=slug

  [P] Klik "Download Gratis" pada card → UF-FD1
```

---

### UF-FD1 · Alur Download Gratis (Modal)

```
[P] Klik "Download Gratis"
  → Modal Phase 1 muncul (animasi fade-in)
  → Tampil: judul file, ukuran, dua tombol

  PILIHAN A: [P] Klik "☕ Traktir Kopi"
    → [EXT] Buka traktir_url (dari Link Manager) di tab baru
    → [DB] POST /api/download/free { product_id }
             → Increment download_count (RPC atomic)
             → Generate signed URL (expire 1 jam)
             → Return { url }
    → Jeda 2 detik (sambil tab Mayar terbuka)
    → Trigger download via anchor click (url dari API)
    → Modal tutup
    ✓ File terdownload, tab Mayar terbuka

  PILIHAN B: [P] Klik "Tidak dulu, langsung download"
    → Modal berganti Phase 2 (animasi slide)
    → Tampil:
      - Banner promo (dari assets key: promo_banner)
      - Teks promo (dari settings: download_promo_text)
      - Tombol CTA promo (teks + URL dari settings)
      - Countdown bar mengecil
      - Teks: "Download otomatis dalam {n} detik..."

    [P] (Opsional) Klik tombol CTA promo
      → [EXT] Buka bantuguruyuk.web.id (atau URL CTA dari settings) di tab baru
      → Countdown tetap berjalan

    → Countdown habis (default 5 detik, bisa diatur 3–10 detik)
    → [DB] POST /api/download/free { product_id }
             → Increment download_count (RPC atomic)
             → Generate signed URL
             → Return { url }
    → Trigger download
    → Modal tutup
    ✓ File terdownload

  KLIK DI LUAR MODAL (Phase 1 saja):
    → Modal tutup tanpa download
```

---

### UF-03 · Jelajah Halaman Produk Berbayar

```
[P] Buka /produk
  → [DB] Ambil: produk type='paid', is_active=true, deleted_at IS NULL
           ORDER BY sort_order ASC, created_at DESC
  → [DB] Ambil: kategori aktif

  → Render grid card:
    - Cover
    - Badge produk (jika ada)
    - Badge "Sold Out" (jika stock_type='limited' dan stock_qty=0)
    - Judul, deskripsi singkat
    - PriceBlock:
        Jika original_price IS NOT NULL dan original_price > sale_price:
          → Tampil: harga coret (original_price) + harga jual (sale_price) + badge "Hemat X%"
        Jika tidak:
          → Tampil: sale_price saja
    - Tombol "Lihat Detail"
        Jika Sold Out → tombol abu-abu, tidak bisa diklik

  [P] Filter kategori / search → filter grid
  [P] Klik "Lihat Detail" → UF-04
```

---

### UF-04 · Halaman Detail Produk Berbayar

```
[P] Buka /produk/[slug]
  → [DB] Ambil: produk by slug (is_active=true, deleted_at IS NULL)
  → [DB] Ambil: product_faqs by product_id ORDER BY sort_order ASC
  → [DB] Ambil: produk terkait by category_id (P1)

  → Render:
    - Cover (fallback: assets key default_cover)
    - Badge produk + Badge Sold Out (jika relevan)
    - Judul + badge kategori
    - PriceBlock (sama dengan UF-03)
    - StockIndicator:
        unlimited → tidak tampil
        limited + qty > 0 → "Sisa {qty} item"
        limited + qty = 0 → "Sold Out"
    - Deskripsi (render HTML dari Tiptap)
    - FilePreview:
        PDF → PDF.js render 2–3 halaman pertama (lazy load)
        Gambar → <img> preview
        Lainnya → placeholder ikon tipe file + nama file
    - FAQ accordion (dari product_faqs)
    - Tombol Share: WhatsApp | Telegram | Copy Link
    - Tombol "Beli Sekarang":
        Sold Out → disabled, teks "Sold Out"
        Tersedia → aktif
    - StickyBuyBar (mobile):
        Muncul saat tombol "Beli Sekarang" utama keluar viewport
        Hilang saat tombol kembali terlihat
        Tidak muncul jika Sold Out

  [P] Klik WhatsApp Share
    → [EXT] Buka wa.me/?text={judul + URL produk} di tab baru

  [P] Klik Telegram Share
    → [EXT] Buka t.me/share/url?url={URL}&text={judul} di tab baru

  [P] Klik Copy Link
    → navigator.clipboard.writeText(URL produk)
    → Tampilkan toast "Link disalin!"

  [P] Klik "Beli Sekarang" atau tombol di StickyBuyBar → UF-05
```

---

### UF-05 · Checkout Produk Berbayar

```
[P] Klik "Beli Sekarang"
  → Tampilkan form checkout (modal atau section inline):
    - Nama (input teks, wajib)
    - Nomor WhatsApp (input teks, wajib, format: 08xx atau 62xx)
    - Email (input email, opsional)
    - Ringkasan: nama produk + PriceBlock
    - Tombol "Lanjut Bayar"

  [P] Isi form → klik "Lanjut Bayar"
    → Validasi client-side: nama tidak kosong, WhatsApp tidak kosong
    → [DB] POST /api/checkout
             body: { product_id, buyer_name, buyer_whatsapp, buyer_email }

             Server:
             → Validasi input: buyer_name & buyer_whatsapp wajib
             → Cek produk: is_active=true, type='paid'
             → Cek stok:
                 unlimited → lanjut
                 limited + qty > 0 → lanjut
                 limited + qty = 0 → ✗ return 400 { error: "Produk ini sudah habis terjual." }
             → [EXT] POST Mayar API: buat payment link
                       { amount: sale_price, name: title, customer: { name, phone: whatsapp, email } }
             → [DB] INSERT orders (pending, buyer_name, buyer_whatsapp, buyer_email, mayar_order_id)
             → Return { payment_url }

    ✓ Sukses → frontend redirect ke payment_url (Mayar)
    ✗ Stok habis → tampil pesan error inline, tombol "Beli" tetap nonaktif
    ✗ Error lain → tampil pesan "Terjadi kesalahan. Coba beberapa saat lagi."
```

---

### UF-06 · Pembayaran di Mayar & Konfirmasi

```
[B] Di halaman Mayar (eksternal):
  → Lihat ringkasan pesanan: nama produk, harga (sale_price)
  → Pilih metode bayar (QRIS, transfer, e-wallet, dll)
  → Selesaikan pembayaran

  SKENARIO A: Bayar Berhasil
    → [EXT] Mayar kirim POST ke /api/webhook/mayar
             { mayar_order_id, status: 'paid', payment_id }

             Server webhook:
             → Verifikasi X-Mayar-Signature (HMAC SHA256)
             → Cek idempotent: jika order sudah paid → return 200
             → Jika stock_type='limited': decrement stock_qty via RPC (atomic)
             → Update order:
                 status = 'paid'
                 mayar_payment_id = payment_id
                 download_token = uuid()
                 token_expires_at = now() + 24 jam
             → INSERT notifications (type: 'new_order')
             → Return 200

    → [EXT] Mayar redirect pembeli ke /terima-kasih?token={download_token}
    → UF-07

  SKENARIO B: Bayar Dibatalkan / Timeout
    → [EXT] Mayar redirect ke /terima-kasih?token=... (token belum valid — status masih pending)
    → UF-07 → tampil pesan "Pembayaran belum dikonfirmasi" + link hubungi admin

  SKENARIO C: Webhook Gagal (signature tidak valid)
    → [DB] Catat ke error_logs
    → Return 401
    → Order tetap pending, pembeli tidak dapat link download
    → Admin dapat generate ulang link dari /admin/pesanan
```

---

### UF-07 · Halaman Terima Kasih & Download Berbayar

```
[B] Buka /terima-kasih?token={download_token}
  → [DB] Server: cari order by download_token
  → Validasi:
      status = 'paid' → ✓
      token_expires_at > now() → ✓

  ✓ Token valid:
    → Render: "Terima kasih, {buyer_name}! Pembelian berhasil."
    → Tampilkan: nama produk, tombol "Download Sekarang"
    → Tampilkan: 3 produk aktif lain sebagai rekomendasi

    [B] Klik "Download Sekarang"
      → [DB] GET /api/download?token={token}
               → Validasi ulang (status + expire)
               → [DB] Generate Supabase signed URL (expire 1 jam)
               → Update downloaded_at (hanya pertama kali)
               → Redirect ke signed URL
      ✓ File terdownload

  ✗ Token tidak valid / expired / status bukan paid:
    → Tampilkan: "Link download tidak valid atau sudah kedaluwarsa."
    → Tampilkan: tombol "Hubungi Admin via WhatsApp" → [EXT] wa.me/{whatsapp dari Contact Manager}
```

---

### UF-08 · Search & Filter Kategori

```
[P] Buka /cari?q={keyword}&type={free|paid}&category={slug}
  → [DB] Full-text search: produk aktif yang cocok dengan keyword
  → Filter by type dan/atau kategori jika ada parameter
  → Render hasil: card produk (sama dengan UF-02 / UF-03)
  → Jika kosong: tampil "Tidak ada hasil untuk '{keyword}'"

[P] Buka /kategori/[slug]
  → [DB] Ambil: kategori by slug
  → [DB] Ambil: semua produk aktif di kategori tersebut (free + paid)
  → Render grid: card produk campuran free dan paid
```

---

### UF-09 · Halaman CMS Pages

```
[P] Buka /halaman/[slug]
  → [DB] Ambil: page by slug (is_active=true, deleted_at IS NULL)
  → ✗ Tidak ditemukan → render 404
  → ✓ Render konten HTML dari Tiptap
  → Meta SEO dari meta_title/meta_desc, fallback SEO Template
```

---

### UF-M1 · Halaman Maintenance

```
[P] Akses URL apapun (kecuali /admin/*)
  → middleware.js cek settings: maintenance_mode = 'true'
  → Redirect ke halaman maintenance
  → Tampil: pesan dari maintenance_message
  → Tidak ada navigasi / link ke halaman lain

[A] Akses /admin/* → tidak terpengaruh maintenance mode, lanjut normal
```

---

## BAGIAN 2 — ALUR ADMIN

---

### UF-A01 · Login Admin

```
[A] Buka /login
  → Tampil form: email + password
  → Klik "Masuk"
  → [DB] Supabase Auth signInWithPassword
  → ✓ Berhasil → redirect ke /admin
  → ✗ Gagal → tampil pesan "Email atau password salah"

[A] Akses /admin/* tanpa sesi
  → admin/layout.jsx cek sesi via supabase-server.js
  → ✗ Tidak ada sesi → redirect ke /login
```

---

### UF-A02 · Dashboard Utama

```
[A] Buka /admin
  → [DB] Ambil: count produk aktif
  → [DB] Ambil: sum download_count semua produk
  → [DB] Ambil: sum amount orders status=paid bulan ini
  → [DB] Ambil: count orders created_at=hari ini
  → [DB] Ambil: 5 orders terbaru
  → [DB] Ambil: 5 produk order by download_count DESC

  → Render: Summary Cards + Quick Actions + Feed Terbaru

  [A] Cmd+K (Global Search)
    → Input search terbuka
    → Ketik keyword → [DB] search realtime: produk, orders, halaman, kategori
    → Klik hasil → navigasi ke halaman terkait

  [A] Klik Quick Action "+ Tambah Produk" → UF-A03b
  [A] Klik Quick Action "Pesanan Terbaru" → UF-A10
```

---

### UF-A03 · Kelola Produk — Tabel

```
[A] Buka /admin/produk
  → [DB] Ambil: semua produk (termasuk draft), ORDER BY sort_order ASC, created_at DESC
  → Render tabel: Cover | Judul | Kategori | Tipe | Harga Jual | Stok | Status | Download | Kelengkapan | Aksi

  [A] Search judul → filter tabel realtime
  [A] Filter tipe / kategori / status / stok → filter tabel
  [A] Drag & drop baris → [DB] UPDATE sort_order batch
  [A] Toggle publish langsung di tabel → [DB] UPDATE is_active
  [A] Quick Edit (judul / sale_price / original_price / kategori) → [DB] UPDATE produk
  [A] Centang beberapa → Bulk Actions: Publish / Unpublish / Hapus / Export CSV
      Hapus → [DB] UPDATE deleted_at = now() (soft delete → masuk Recycle Bin)
  [A] Klik "+ Tambah Produk" → UF-A03b
  [A] Klik "Edit" → UF-A03c
```

---

### UF-A03b · Tambah / Edit Produk

```
[A] Buka /admin/produk/baru atau /admin/produk/[id]/edit
  → Jika edit: [DB] Ambil data produk + product_faqs

  FORM:

  [Identitas]
  → Input Judul → auto-generate slug (debounce 500ms)
  → Input Slug (editable, validasi unik realtime)

  [Konten]
  → Tiptap Editor (deskripsi):
      Toolbar: H2/H3/H4 | Bold | Italic | Underline |
               BulletList | OrderedList | TaskList |
               Blockquote | HorizontalRule | Table |
               Link | Image | YouTube | Callout
      Image di editor: pilih dari Media Library atau upload baru
  → FAQ Editor (sub-section):
      Daftar FAQ dengan accordion
      Tombol "+ Tambah FAQ"
      Setiap item: input Pertanyaan + textarea Jawaban + tombol Hapus
      Drag & drop untuk urutan

  [Klasifikasi]
  → Dropdown Kategori
  → Radio Tipe: Free / Paid

  → Badge Produk (dropdown multi-pilih):
      Baru | Terlaris | Diskon | Gratis | Premium | Custom
      Jika "Custom" dipilih → muncul input label (maks. 20 karakter)

  → Toggle ⭐ Produk Unggulan (is_featured)

  [Harga — muncul hanya jika Tipe = Paid]
  → Input Sale Price / Harga Jual (Rupiah, wajib jika paid)
  → Input Original Price / Harga Asli (Rupiah, opsional)
  → Preview harga otomatis di bawah field:
      Jika original_price > sale_price:
        → Tampil simulasi: harga coret + harga jual + "Hemat X% (Rp Y)"
      Jika tidak:
        → Tampil sale_price saja

  [Stok]
  → Radio Stok: Unlimited / Limited
  → Jika Limited: input jumlah stok (integer ≥ 1)
  → Jika edit dan limited: tampil "Stok saat ini: {stock_qty}"

  [Media]
  → Upload Cover Image (dari Media Library atau upload baru)
  → Upload File Produk + Replace File (jika sudah ada)
    → Estimasi ukuran tampil saat file dipilih
  → Upload Gambar Preview opsional

  [Publish]
  → Toggle Status: Aktif / Draft
  → (P1) Jadwal Terbit: date + time picker

  [SEO]
  → Input Meta Title (default dari SEO Template: "{judul} | {site_name}")
  → Input Meta Description
  → SEO Preview live

  [Auto Save]
  → Setiap 30 detik → simpan ke localStorage key: draft_product_[id]
  → Saat halaman dimuat: cek draft di localStorage, tawarkan restore jika ada
  → Draft dihapus saat simpan berhasil

  [Aksi]
  → Tombol "Simpan" → [DB] INSERT/UPDATE produk + product_faqs
      ✓ Berhasil → redirect ke /admin/produk + toast "Produk disimpan"
      ✗ Gagal → tampil pesan error
  → Tombol "Preview" → buka /produk/[slug]?preview=true di tab baru
      (server: bypass is_active check jika ada query preview=true + sesi admin)
```

---

### UF-A04 · Kelola Kategori

```
[A] Buka /admin/kategori
  → Tabel: Nama | Slug | Warna Badge | Jumlah Produk | Urutan | Aksi
  → Drag & drop → [DB] UPDATE sort_order batch
  → Edit inline: klik nama/slug/warna → input muncul → blur → [DB] UPDATE
  → Hapus:
      Jika ada produk aktif → ✗ tampil error "Tidak bisa hapus, masih ada produk aktif"
      Jika kosong → [DB] DELETE kategori

  [A] Klik "+ Tambah Kategori"
    → Form inline muncul di atas tabel: Nama | Slug (auto) | Color picker
    → Simpan → [DB] INSERT
```

---

### UF-A05 · Kelola Halaman (CMS)

```
[A] Buka /admin/halaman
  → Tabel: Judul | Slug | Status | Terakhir Diperbarui | Aksi
  → Toggle publish dari tabel → [DB] UPDATE is_active
  → Bulk Actions: Publish / Unpublish / Hapus

[A] Tambah / Edit Halaman
  → Form: Judul → auto slug | Konten (Tiptap) | Status | Meta SEO | SEO Preview live
  → Simpan → [DB] INSERT/UPDATE pages
  → (P1) Duplicate Page → [DB] INSERT pages (copy konten, slug baru: "{slug}-copy")
```

---

### UF-A06 · Homepage Section Manager

```
[A] Buka /admin/homepage
  → [DB] Ambil: homepage_sections ORDER BY sort_order
  → Render daftar seksi: label | toggle show/hide | drag handle

  [A] Toggle show/hide → [DB] UPDATE is_visible
  [A] Drag & drop → [DB] UPDATE sort_order batch
  [A] Klik seksi untuk edit konten
    → Panel/modal terbuka: form sesuai tipe seksi
      Hero: judul, subjudul, teks CTA, URL CTA, gambar bg (dari Asset Manager)
      Produk Unggulan: otomatis tampilkan produk is_featured=true (tidak ada form konten)
      Kategori: otomatis dari tabel categories (tidak ada form konten)
      Produk Gratis Terbaru: otomatis dari produk free terbaru (tidak ada form konten)
      Banner Promo: upload gambar (Media Library), teks, URL
      Tentang BGY: judul, teks, gambar
    → Simpan → [DB] UPDATE homepage_sections.config (jsonb)
```

---

### UF-A07 · Navigation Manager

```
[A] Buka /admin/navigation
  → [DB] Ambil: navigation_items ORDER BY sort_order
  → Render daftar: label | tujuan | status | drag handle | aksi

  [A] Drag & drop → [DB] UPDATE sort_order batch
  [A] Toggle show/hide → [DB] UPDATE is_visible
  [A] Edit item:
    → Input Label
    → Dropdown Target Type: Halaman / Produk / Kategori / URL Eksternal
    → Jika Halaman → dropdown pilih dari pages aktif
    → Jika Produk → dropdown pilih dari products aktif
    → Jika Kategori → dropdown pilih dari categories
    → Jika URL Eksternal → input teks URL
    → Simpan → [DB] UPDATE
  [A] Hapus → [DB] DELETE
  [A] "+ Tambah Menu" → form inline
```

---

### UF-A08 · Theme, Footer, Announcement, Media, Assets, Links, Contacts

```
[A] /admin/theme
  → Form: Logo | Logo Putih | Favicon | Primary Color | Secondary Color | Border Radius | Font
  → Perubahan langsung preview (CSS variables di-update di DOM)
  → Simpan → [DB] UPDATE settings (key prefix: theme_*)

[A] /admin/footer
  → Form: copyright, deskripsi, email, WhatsApp, alamat, link sosmed, link tambahan (drag & drop)
  → Preview footer live di bawah form
  → Simpan → [DB] UPDATE footer_config + footer_links

[A] /admin/announcement
  → Form: toggle aktif, teks, URL, warna latar, warna teks, tanggal mulai/akhir
  → Preview bar live
  → Simpan → [DB] UPDATE settings (key prefix: announcement_*)

[A] /admin/media
  → Grid file: klik file → panel detail (nama, ukuran, tipe, URL, Copy URL, Hapus)
  → Upload: drag & drop atau klik → [DB] upload ke Supabase Storage bucket 'media' → INSERT media
  → Hapus: [DB] delete dari Storage + DELETE media

[A] /admin/assets
  → Grid slot aset: klik "Replace" → buka Media Library picker
  → Pilih dari library atau upload baru → [DB] UPDATE assets.media_id

[A] /admin/links
  → Tabel key-value: klik nilai → edit inline → [DB] UPDATE/INSERT links
  → "+ Tambah Link" → form: key + label + URL

[A] /admin/contacts
  → Form field per kontak → [DB] UPDATE contacts
```

---

### UF-A09 · Settings, SEO, Custom 404

```
[A] /admin/settings
  → Tab Umum: site_name, site_tagline → simpan → [DB] UPDATE settings
  → Tab Download: traktir_url, promo text, promo CTA, countdown duration → simpan
  → Tab Maintenance: toggle on/off, pesan → simpan
      Aktifkan maintenance → middleware langsung blokir rute publik

[A] /admin/seo
  → Tab SEO Global: meta_title default, meta_description default, OG Image (Asset Manager)
    → SEO Preview live (simulasi Google Search card)
  → Tab SEO Template: edit template produk/kategori/halaman → simpan
  → Tab Robots: toggle global + per halaman (robots_index, robots_follow)
  → Tab Sitemap: tombol "Regenerate" → [DB] clear cache ISR sitemap → tampil timestamp

[A] /admin/custom-404
  → Form: judul, deskripsi, teks CTA, URL CTA
  → Pilih produk rekomendasi (maks. 3, dropdown multi-select)
  → Gambar ilustrasi (Asset Manager key: image_404)
  → Preview tampilan 404
  → Simpan → [DB] UPDATE settings (key prefix: custom_404_*)
```

---

### UF-A10 · Kelola Pesanan

```
[A] Buka /admin/pesanan
  → [DB] Ambil: orders ORDER BY created_at DESC
  → Tabel: Nama Pembeli | WhatsApp | Email | Produk | Harga | Status | Tanggal | Aksi

  [A] Filter by status / tanggal range → filter tabel
  [A] Search by nama / WA / email / mayar_order_id
  [A] Klik baris pesanan → halaman detail:
      Semua field order
      Tombol "Generate Ulang Link Download":
        → [DB] UPDATE download_token = uuid(), token_expires_at = now() + 24h
        → Tampilkan URL: /terima-kasih?token={token_baru}
        → Tombol Copy URL
  [A] Bulk: centang beberapa → Export CSV
```

---

### UF-A11 · Recycle Bin (P1)

```
[A] Buka /admin/recycle-bin
  → [DB] Ambil: produk + halaman WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC
  → Tabel: Judul | Tipe | Tanggal Dihapus | Aksi

  [A] Klik "Restore"
    → [DB] UPDATE deleted_at = NULL, is_active = false (kembali jadi draft)
    → Toast "Produk/Halaman dikembalikan ke Draft"

  [A] Klik "Hapus Permanen"
    → Konfirmasi dialog
    → [DB] DELETE produk/halaman
    → Jika produk: [DB] delete file dari Supabase Storage (cover + file produk)

  Auto purge (pg_cron):
    → Setiap hari jam 00:00 UTC
    → DELETE produk + halaman WHERE deleted_at < now() - interval '30 days'
    → DELETE file terkait dari Storage
```

---

### UF-A12 · Notification Center (P1)

```
[A] Badge merah di sidebar "Notifikasi" (jika ada notif belum dibaca)
  → [DB] Realtime subscription ke tabel notifications (Supabase Realtime)

[A] Buka /admin/notifikasi
  → [DB] Ambil: notifications ORDER BY created_at DESC
  → Daftar: ikon tipe | pesan | waktu | status baca

  [A] Klik notifikasi → mark as read → [DB] UPDATE is_read = true
      Notif 'new_order' → klik navigasi ke detail pesanan
  [A] "Tandai Semua Dibaca" → [DB] UPDATE is_read = true WHERE is_read = false
```

---

### UF-A13 · Site Health (P1)

```
[A] Buka /admin/site-health
  → Render card status awal (loading)

  [A] Klik "Cek Ulang" (atau otomatis saat halaman dimuat):
    → Ping website: GET NEXT_PUBLIC_SITE_URL → ✓/✗
    → Ping database: Supabase simple SELECT 1 → ✓/✗
    → Cek storage: list bucket 'products' → ✓/✗ + estimasi usage
    → Cek auth: Supabase Auth health → ✓/✗
    → Cek webhook: SELECT max(created_at) FROM orders WHERE mayar_payment_id IS NOT NULL
        Jika terakhir > 7 hari lalu → ⚠ Warning
        Jika ada order → ✓
    → Tampilkan Storage Usage: total size semua bucket

  → Render hasil per komponen: ✓ Aktif / ✗ Error / ⚠ Perhatian
```

---

### UF-A14 · Error Log (P2)

```
[A] Buka /admin/error-log
  → [DB] Ambil: error_logs ORDER BY created_at DESC
  → Tabel: Waktu | Tipe | Pesan | Detail (collapsible JSON)
  → Filter by tipe error
  → Klik "Hapus Semua Log" → konfirmasi → [DB] DELETE error_logs
```

---

### UF-A15 · System Backup (P2)

```
[A] Buka /admin/backup

  [A] Klik "Export Settings"
    → [DB] SELECT * FROM settings
    → Download JSON: bgy-settings-{timestamp}.json

  [A] Klik "Export Database Metadata"
    → [DB] SELECT produk (tanpa file_path), kategori, halaman, orders
    → Download JSON: bgy-database-{timestamp}.json

  [A] Klik "Export Konfigurasi Website"
    → [DB] SELECT settings + navigation + footer + homepage_sections + links + contacts + assets
    → Download JSON: bgy-config-{timestamp}.json
```

---

## BAGIAN 3 — ALUR SISTEM (Background)

---

### UF-S01 · Sitemap & Robots Otomatis

```
GET /sitemap.xml
  → app/sitemap.js (Next.js)
  → [DB] Ambil: produk aktif, halaman aktif (robots_index=true), kategori
  → Generate XML sitemap
  → Cache ISR revalidate 60 menit

GET /robots.txt
  → app/robots.js
  → [DB] Ambil: settings robots global
  → Generate robots.txt
```

---

### UF-S02 · Auto Purge Recycle Bin

```
Supabase pg_cron (jadwal: setiap hari jam 00:00 UTC)
  → SELECT produk + halaman WHERE deleted_at < now() - interval '30 days'
  → Untuk setiap produk:
      DELETE file dari Storage (cover_path, preview_path, file_path)
  → DELETE FROM products WHERE deleted_at < now() - interval '30 days'
  → DELETE FROM pages WHERE deleted_at < now() - interval '30 days'
```

---

### UF-S03 · Download Token Expired

```
[B] Akses /terima-kasih?token={token} setelah 24 jam
  → Server cek: token_expires_at < now() → ✗
  → Tampil pesan expired + link hubungi admin WA
  → Admin bisa generate ulang token dari /admin/pesanan (UF-A10)
```

---

## Ringkasan Endpoint API

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | /api/checkout | Buat payment link Mayar | Publik + rate limit |
| POST | /api/webhook/mayar | Konfirmasi bayar dari Mayar | Signature HMAC |
| GET | /api/download | Download file berbayar via token | Token |
| POST | /api/download/free | Download file gratis via signed URL | Publik |
| GET | /sitemap.xml | Sitemap otomatis | Publik |
| GET | /robots.txt | Robots.txt otomatis | Publik |
| * | /api/admin/* | Semua operasi CRUD admin | Supabase session |

---

## Ringkasan State Produk

```
DRAFT (is_active=false, deleted_at=NULL)
  → Admin publish → AKTIF
  → Admin hapus → RECYCLE BIN

AKTIF (is_active=true, deleted_at=NULL)
  → Tampil di halaman publik
  → Admin unpublish → DRAFT
  → Admin hapus → RECYCLE BIN
  → Jika limited dan stock_qty=0 → SOLD OUT (tetap AKTIF, tombol beli nonaktif)

RECYCLE BIN (deleted_at IS NOT NULL)
  → Tidak tampil di publik
  → Admin restore → DRAFT
  → Admin hapus permanen / auto purge 30 hari → DELETED PERMANENT
```

---

## Ringkasan State Order

```
PENDING
  → Pembeli selesai bayar di Mayar → webhook → PAID
  → Pembeli tidak bayar / timeout → EXPIRED (oleh Mayar webhook)
  → Pembayaran gagal → FAILED (oleh Mayar webhook)

PAID
  → Pembeli download → downloaded_at terisi (tetap PAID)
  → Token expire 24 jam → halaman terima kasih tampil pesan expired
  → Admin generate ulang token → token baru + expire baru

FAILED / EXPIRED
  → Final state, tidak ada aksi otomatis
  → Admin dapat lihat di tabel pesanan
```
