# PRD Final — BGY Digital Store
**Platform:** bantuguruyuk.web.id
**Stack:** Next.js 14 App Router · Supabase · Tailwind CSS · Mayar · Vercel
**Versi PRD:** 4.0 Final
**Dibuat:** Juli 2026
**Status:** Final — Siap Implementasi · Siap Freeze untuk UserFlow.md

---

## 1. Ringkasan Produk

Platform toko digital milik sendiri untuk distribusi konten edukasi guru SD Indonesia. Menggantikan ketergantungan pada Lynk.id. Admin mengelola seluruh website dari satu dashboard tanpa menyentuh kode — produk, halaman, tampilan, navigasi, konten, branding, SEO, hingga monitoring sistem.

Mendukung dua model distribusi:
- **Produk gratis** — download dengan friction ringan (popup traktir kopi + promo BGY)
- **Produk berbayar** — checkout via Mayar, QRIS dinamis sesuai harga jual produk, dengan dukungan harga coret dan stok terbatas

**Prinsip utama:** Semua yang bisa berubah dikelola dari dashboard. Tidak ada hardcode konten di kode.

---

## 2. Pengguna

| Peran | Deskripsi |
|---|---|
| **Pengunjung** | Guru SD yang datang dari TikTok / WA Channel BGY |
| **Pembeli** | Guru yang membeli produk berbayar via Mayar |
| **Admin** | Pak Choy — satu-satunya admin, mengelola seluruh website |

---

## 3. Halaman Publik

### `/` — Home
- Konten seluruhnya diambil dari Homepage Section Manager
- Navigasi dari Navigation Manager
- Announcement Bar dari Announcement Manager (jika aktif dan dalam masa aktif)
- Footer dari Footer Manager
- Seksi tersedia: Hero, Produk Unggulan, Kategori, Produk Gratis Terbaru, Banner Promo, Tentang BGY

### `/free` — Free Download
- Grid card produk gratis, urutan dari `sort_order`
- Filter kategori (hanya kategori yang memiliki produk gratis aktif)
- Search produk (server-side via Supabase full-text search)
- Setiap card: cover, judul, deskripsi singkat, ukuran file, badge kategori, badge produk (jika ada), tombol "Download Gratis"

**Alur Download Gratis:**
1. Pengunjung klik "Download Gratis" → modal muncul (Phase 1)
2. **Phase 1 — Pilihan:**
   - ☕ Traktir Kopi → buka Mayar donation link (dari Link Manager, key: `traktir_url`) di tab baru → download otomatis dimulai setelah 2 detik → modal tutup
   - "Tidak dulu, langsung download" → Phase 2
3. **Phase 2 — Promosi BGY (durasi dari Download Settings, default 5 detik):**
   - Banner dari Asset Manager (key: `promo_banner`)
   - Teks promo dan tombol CTA (dari Download Settings)
   - Countdown bar mengecil
   - Setelah countdown habis → trigger download → modal tutup
4. Download dikirim via `POST /api/download/free` → Supabase signed URL (expire 1 jam)

### `/produk` — Produk Berbayar
- Grid card, urutan dari `sort_order`
- Filter kategori
- Search produk
- Setiap card:
  - Cover image
  - Badge produk (Baru / Terlaris / Diskon / Premium / Custom — jika ada)
  - Badge "Sold Out" jika stok habis
  - Judul
  - Deskripsi singkat
  - Blok harga: jika ada `original_price` → tampilkan harga coret + harga jual + badge persentase diskon; jika tidak → tampilkan `sale_price` saja
  - Tombol "Lihat Detail" (nonaktif dan abu-abu jika Sold Out)

### `/produk/[slug]` — Detail Produk
- Cover image (fallback ke Asset Manager key: `default_cover`)
- Badge produk
- Badge "Sold Out" jika stok habis
- Judul, deskripsi lengkap (render HTML dari Tiptap), badge kategori
- **Blok harga:**
  - Jika `original_price` diisi dan `original_price > sale_price`:
    - Tampilkan `original_price` dengan strikethrough
    - Tampilkan `sale_price` (warna merah/aksen)
    - Badge diskon: `Hemat {persentase}%`
    - Teks nominal: `Hemat Rp {selisih}`
  - Jika `original_price` kosong: tampilkan `sale_price` saja
- **Informasi stok:**
  - Jika `stock_type = 'limited'` dan stok > 0: tampilkan "Sisa {n} item"
  - Jika `stock_type = 'limited'` dan stok = 0: tampilkan badge "Sold Out"
- **Preview File:**
  - Jika file adalah PDF: tampilkan preview beberapa halaman pertama (via PDF.js, lazy load)
  - Jika file adalah gambar (jpg/png/webp): tampilkan preview gambar
  - Jika file lain (zip/doc/dll): tampilkan thumbnail placeholder dengan ikon tipe file dan label nama file
- **FAQ Produk:** accordion daftar pertanyaan & jawaban sesuai urutan `sort_order` di tabel `product_faqs`
- **Tombol Share:** WhatsApp, Telegram, Copy Link
- **Tombol "Beli Sekarang":**
  - Nonaktif dan bertuliskan "Sold Out" jika stok habis
  - Jika tersedia → `POST /api/checkout` → redirect Mayar
- **Sticky Buy Button (mobile):** saat halaman di-scroll ke bawah melewati tombol utama, muncul bar fixed di bawah layar berisi harga + tombol beli. Otomatis hilang jika stok habis (Sold Out).
- Produk terkait berdasarkan kategori (P1)

### `/terima-kasih` — Pasca Pembayaran
- Validasi `download_token` dari query param secara server-side
- Cek: status `paid` dan `token_expires_at > now()`
- Tampilkan: nama produk, nama pembeli, tombol "Download Sekarang"
- Download via `GET /api/download?token=...`
- Tampilkan 3 produk aktif lain sebagai rekomendasi
- Jika token tidak valid atau sudah kedaluwarsa: pesan error + link "Hubungi Admin" (dari Contact Manager, key: `whatsapp`)

### `/halaman/[slug]` — Halaman Statis (CMS)
- Konten dari tabel `pages`
- Contoh: Tentang BGY, FAQ, Kebijakan Privasi, Syarat & Ketentuan
- Meta SEO dari `meta_title` dan `meta_desc` per halaman, fallback ke SEO Template

### `/kategori/[slug]` — Filter Kategori
- Listing produk (free + berbayar) dalam kategori tersebut
- Urutan dari `sort_order`

### `/cari` — Halaman Search
- Parameter URL: `?q=keyword&type=free|paid&category=slug`
- Server-side search via Supabase full-text search
- Menampilkan hasil produk free dan berbayar

### Halaman 404
- Konten dari Custom 404 Manager (judul, deskripsi, teks CTA, URL CTA, produk rekomendasi)
- Gambar dari Asset Manager (key: `image_404`)

### Halaman Maintenance
- Aktif jika `maintenance_mode = true` di settings
- Dieksekusi di `middleware.js` (Next.js Edge Middleware)
- Pesan dari `maintenance_message` di settings
- Admin tetap bisa akses `/admin`

---

## 4. Dashboard Admin

**Route:** `/admin/*`
**Auth:** Supabase Auth — email + password, sesi via httpOnly cookie (SSR-safe)
**Guard:** `admin/layout.jsx` — validasi sesi via `supabase-server.js`, redirect ke `/login` jika tidak ada sesi

### Prinsip UX Dashboard
- Sesedikit mungkin klik untuk aksi yang paling sering dilakukan
- Semua tabel: search, filter, sort, bulk actions, toggle publish
- Semua form: auto-save draft, auto slug, preview
- Drag & drop untuk urutan (produk, kategori, halaman, seksi homepage, menu navigasi, FAQ produk)
- Responsif — dapat digunakan dari perangkat mobile
- Konsisten: pola komponen yang sama di setiap modul

### Struktur Sidebar Admin

```
Dashboard
─────────────────
Konten
  Produk
  Kategori
  Halaman
─────────────────
Tampilan
  Homepage
  Navigation
  Footer
  Theme
  Announcement
─────────────────
Media
  Media Library
  Asset Manager
─────────────────
Data
  Link Manager
  Contact Manager
─────────────────
Transaksi
  Pesanan
─────────────────
Laporan
  Analytics         (P1)
─────────────────
Sistem
  Settings
  SEO
  Site Health       (P1)
  Error Log         (P2)
  Backup            (P2)
  Recycle Bin       (P1)
  Notifikasi        (P1)
```

---

### `/admin` — Dashboard Utama

**Summary Cards:**
- Total produk aktif
- Total download (all time)
- Total pemasukan bulan ini
- Jumlah pesanan hari ini

**Quick Actions:**
- + Tambah Produk
- + Tambah Halaman
- Lihat Pesanan Terbaru
- Buka Website (tab baru)

**Global Search (Cmd/Ctrl + K):**
- Input search di header admin, selalu terlihat
- Mencari: produk, pesanan, halaman, kategori secara real-time
- Hasil dikelompokkan per jenis konten
- Klik hasil langsung navigasi ke halaman terkait

**Feed Terbaru:**
- 5 pesanan terbaru (nama pembeli, produk, status, waktu)
- 5 produk dengan download terbanyak

---

### `/admin/produk` — Kelola Produk

**Tabel:**
- Kolom: Cover (thumbnail), Judul, Kategori, Tipe, Harga Jual, Stok, Status, Download, Kelengkapan, Aksi
- Search by judul
- Filter: tipe (free/paid), kategori, status, stok (unlimited/limited/sold out)
- Sort: judul, download_count, created_at, sort_order
- Drag & drop baris untuk mengatur `sort_order`
- **Toggle Publish/Unpublish** langsung dari tabel
- **Quick Edit inline:** judul, sale_price, original_price, kategori
- **Bulk Actions:** Publish, Unpublish, Hapus (konfirmasi), Export CSV
- **Product Completion Checklist:** badge ✓/✗ untuk Cover, File, Deskripsi, Harga (jika paid)

**Form Tambah/Edit (`/admin/produk/baru` & `/admin/produk/[id]/edit`):**

*Identitas:*
- Judul → auto-generate slug (dapat diedit manual, validasi unik)
- Slug

*Konten:*
- Deskripsi (Tiptap rich text — lihat spesifikasi editor di bawah)
- FAQ Produk (sub-section dalam form — lihat spesifikasi di bawah)

*Klasifikasi:*
- Kategori (dropdown dari tabel `categories`)
- Tipe: Free / Paid
- Badge Produk: dropdown multi-pilih (Baru, Terlaris, Diskon, Gratis, Premium, Custom)
  - Jika memilih "Custom": muncul input teks label badge (maks. 20 karakter)
- Toggle Produk Unggulan (⭐) — menandai sebagai featured product
- Toggle Produk Terlaris — menandai sebagai best seller (mengisi badge "Terlaris" secara otomatis)

*Harga (muncul hanya jika tipe = Paid):*
- Sale Price / Harga Jual (wajib jika paid) — integer Rupiah
- Original Price / Harga Asli (opsional) — integer Rupiah
- Preview otomatis di bawah field:
  - Jika original_price diisi dan > sale_price: tampilkan simulasi harga coret, harga jual, badge diskon, dan teks "Hemat Rp {selisih}"
  - Jika original_price kosong atau ≤ sale_price: tampilkan sale_price saja (original_price diabaikan)

*Stok:*
- Tipe Stok: Unlimited (default) / Limited
- Jika Limited: input jumlah stok (integer, min. 1)
- Jika Limited: tampilkan sisa stok saat ini (saat edit produk yang sudah ada)

*Media:*
- Cover Image: pilih dari Media Library atau upload baru
- File Produk: upload file (PDF/ZIP/dll) + Replace File
- Gambar Preview (opsional): tampil di halaman detail sebagai preview sebelum tombol beli

*Publish:*
- Status: Aktif / Draft
- Jadwal Terbit (P1): tanggal & waktu publish otomatis

*SEO:*
- Meta title (default dari SEO Template, dapat dioverride)
- Meta description (dapat dioverride)

*Utilitas:*
- **Auto Save:** draft ke `localStorage` setiap 30 detik (key: `draft_product_[id]`), dihapus saat simpan berhasil
- **Preview Produk:** buka `/produk/[slug]?preview=true` di tab baru
- **Storage Usage Estimasi:** tampilkan ukuran file yang akan diupload

**Spesifikasi FAQ Produk (sub-section dalam form produk):**
- Daftar FAQ dalam accordion di bawah deskripsi
- Tombol "+ Tambah FAQ"
- Setiap item: field Pertanyaan + field Jawaban (textarea)
- Drag & drop untuk mengatur urutan
- Tombol hapus per item
- FAQ disimpan ke tabel `product_faqs` terhubung ke `product_id`

---

### `/admin/kategori` — Kelola Kategori

- Tabel: Nama, Slug, Warna Badge, Jumlah Produk, Urutan, Aksi
- Drag & drop untuk mengatur `sort_order`
- CRUD: tambah, edit inline, hapus
- Validasi hapus: tidak bisa hapus kategori yang masih memiliki produk aktif
- Color picker untuk warna badge

---

### `/admin/halaman` — CMS Pages

- Tabel: Judul, Slug, Status, Terakhir Diperbarui, Aksi
- Toggle Publish/Unpublish dari tabel
- Bulk Actions: Publish, Unpublish, Hapus
- Form tambah/edit:
  - Judul → auto slug
  - Konten (Tiptap rich text — spesifikasi sama dengan editor produk)
  - Status: Aktif / Draft
  - Meta SEO: title, description (dengan counter karakter), SEO Preview live
- Duplicate Page (P1)

---

### `/admin/homepage` — Homepage Section Manager

- Daftar semua seksi homepage dengan status tampil/sembunyikan
- Toggle show/hide per seksi
- Drag & drop untuk mengatur urutan seksi
- Klik seksi → edit konten seksi (teks, gambar dari Asset Manager/Media Library, teks CTA, URL CTA)
- Seksi tersedia: Hero, Produk Unggulan, Kategori, Produk Gratis Terbaru, Banner Promo, Tentang BGY
- Seksi "Produk Unggulan" otomatis menampilkan produk dengan `is_featured = true`

---

### `/admin/navigation` — Navigation Manager

- Daftar item menu navigasi (header website)
- Drag & drop untuk mengatur urutan
- Toggle show/hide per item menu
- Tambah, edit, hapus item menu
- Setiap item: label teks, tujuan (Halaman / Produk / Kategori / URL Eksternal), status tampil/sembunyikan

---

### `/admin/footer` — Footer Manager

- Form pengaturan seluruh isi footer:
  - Teks copyright
  - Deskripsi singkat BGY
  - Email kontak
  - Nomor WhatsApp (diformat otomatis ke link wa.me)
  - Alamat (opsional)
  - Link sosial media (ambil dari Contact Manager, dapat dioverride)
  - Link tambahan (custom, maks. 8 item, drag & drop)
- Preview footer langsung di bawah form

---

### `/admin/theme` — Theme Manager

- Logo (dari Asset Manager, key: `logo`)
- Logo Putih (key: `logo_white`)
- Favicon (key: `favicon`)
- Warna Utama / Primary (color picker)
- Warna Sekunder / Secondary (color picker)
- Border Radius: preset (Rounded / Sedikit Rounded / Kotak)
- Font: dropdown Google Fonts terkurasi (Poppins, Inter, Plus Jakarta Sans, Nunito)
- Disimpan ke tabel `settings` dengan prefix `theme_`

---

### `/admin/announcement` — Announcement Bar

- Toggle aktif/nonaktif
- Teks pengumuman
- URL tujuan (opsional — seluruh bar menjadi link)
- Warna latar (color picker)
- Warna teks (color picker)
- Masa aktif opsional: tanggal mulai dan tanggal berakhir
- Preview bar di bawah form

---

### `/admin/media` — Media Library

- Grid thumbnail semua file yang diupload (gambar + dokumen)
- Upload file baru (drag & drop atau klik)
- Klik file → panel detail: nama, ukuran, tipe, tanggal upload, URL, Copy URL, Hapus
- Filter: by tipe (image / document)
- Storage Usage Monitor: total storage terpakai (estimasi)
- Terintegrasi ke semua form yang membutuhkan upload

---

### `/admin/assets` — Asset Manager

Slot aset global dengan label tetap:
- `logo` — Logo utama
- `logo_white` — Logo versi putih
- `logo_dark` — Logo versi gelap
- `favicon` — Favicon
- `default_cover` — Cover default produk
- `og_image` — OG Image default
- `hero_bg` — Background hero section
- `placeholder_image` — Gambar placeholder
- `no_image` — Gambar "tidak ada gambar"
- `image_404` — Ilustrasi halaman 404
- `promo_banner` — Banner promo modal download gratis

Setiap slot: thumbnail current, Replace (pilih dari Media Library atau upload baru), Hapus.

---

### `/admin/links` — Link Manager

Key-value URL penting website:
- `mayar`, `traktir_url`, `whatsapp`, `tiktok`, `instagram`, `youtube`, `telegram`, `shopee`, `tokopedia`, `google_drive`
- Tambah custom link dengan key bebas
- Seluruh website mengambil URL dari Link Manager

---

### `/admin/contacts` — Contact Manager

- `whatsapp`, `email`, `tiktok`, `instagram`, `youtube`, `telegram`
- Footer, tombol "Hubungi Admin", dan komponen kontak menggunakan data ini

---

### `/admin/pesanan` — Kelola Pesanan

- Tabel: Nama Pembeli, WhatsApp, Email, Produk, Harga, Status, Tanggal, Aksi
- Filter: by status (Pending/Paid/Failed/Expired), by tanggal (date range picker)
- Search: by nama pembeli, nomor WhatsApp, email, atau ID pesanan Mayar
- Klik pesanan → detail lengkap + tombol **Generate Ulang Link Download**
- Bulk Actions: Export CSV

---

### `/admin/analytics` — Dashboard Analytics (P1)

- Total download per hari/minggu/bulan (line chart)
- Total pemasukan per bulan (bar chart)
- Produk terpopuler by download count (tabel)
- Produk terlaris by pesanan paid (tabel)

---

### `/admin/settings` — Pengaturan Website

**Tab Umum:** nama website, tagline

**Tab Download:**
- URL Traktir Kopi (ambil dari Link Manager key `traktir_url`, dapat dioverride)
- Banner promo modal (dari Asset Manager key `promo_banner`)
- Teks promo
- Teks tombol CTA promo
- URL CTA promo
- Durasi countdown "Tidak dulu" (slider 3–10 detik, default 5)

**Tab Maintenance:** toggle on/off, pesan maintenance

---

### `/admin/seo` — SEO & Sitemap

**Tab SEO Global:** meta title default, meta description default, OG Image default, SEO Preview live

**Tab SEO Template:**
- Template produk: `{judul_produk} | {nama_website}`
- Template kategori: `Kategori {nama_kategori} | {nama_website}`
- Template halaman: `{judul_halaman} | {nama_website}`
- Dapat dioverride per halaman/produk

**Tab Robots:** pengaturan global + per halaman (Index/No Index, Follow/No Follow)

**Tab Sitemap:** tombol Regenerate, waktu terakhir diperbarui

---

### `/admin/custom-404` — Custom 404 Manager

- Judul, deskripsi, teks CTA, URL CTA
- Pilih hingga 3 produk rekomendasi (dropdown multi-select)
- Gambar ilustrasi (dari Asset Manager key `image_404`)
- Preview tampilan 404

---

### `/admin/site-health` — Site Health (P1)

| Komponen | Status | Keterangan |
|---|---|---|
| Website | ✓ / ✗ | Ping ke domain sendiri |
| Database | ✓ / ✗ | Simple query ke Supabase |
| Storage | ✓ / ✗ | Cek bucket + estimasi usage |
| Authentication | ✓ / ✗ | Cek Supabase Auth aktif |
| Mayar Webhook | ✓ / ✗ | Timestamp terakhir webhook diterima |
| Storage Usage | Info | Total pemakaian semua bucket |

Refresh manual. Tidak ada auto-refresh.

---

### `/admin/error-log` — Error Log Viewer (P2)

- Log dari tabel `error_logs`: upload gagal, download gagal, webhook gagal, checkout error
- Kolom: waktu, tipe, pesan, detail (JSON collapsible)
- Filter by tipe, tombol Hapus Semua Log (dengan konfirmasi)

---

### `/admin/backup` — System Backup (P2)

- Export Settings (JSON)
- Export Database Metadata (JSON: produk, kategori, halaman, pesanan)
- Export Konfigurasi Website (JSON: semua settings + navigation + footer + homepage + links + contacts)
- Manual on-demand, timestamp di nama file

---

### `/admin/recycle-bin` — Recycle Bin (P1)

- Produk dan halaman yang dihapus (soft delete via `deleted_at`)
- Aksi: Restore (status draft) atau Hapus Permanen
- Auto purge setelah 30 hari via pg_cron

---

### `/admin/notifikasi` — Notification Center (P1)

- Pesanan baru masuk (badge merah di sidebar)
- Produk mencapai milestone download (100, 500, 1000)
- Storage mendekati batas (>80%)
- Mark as read per item atau semua sekaligus

---

## 5. Spesifikasi Rich Text Editor (Tiptap)

Digunakan di: form produk (deskripsi) dan form halaman (konten).

**Extension yang diaktifkan:**
- Heading (H2, H3, H4)
- Bold, Italic, Underline
- Bullet List, Ordered List, Task List (Checklist)
- Blockquote
- Horizontal Rule (Divider)
- Table (insert, tambah/hapus baris & kolom)
- Link (input URL, buka di tab baru)
- Image (upload ke Media Library dari dalam editor, atau pilih dari Media Library)
- YouTube embed (input URL YouTube → auto-embed)
- Callout / Info Box (custom extension: block dengan ikon dan warna latar — berfungsi sebagai CTA Banner inline dalam deskripsi)

**Yang tidak diaktifkan:** input HTML bebas / raw HTML.

---

## 6. Skema Database (Supabase)

### Tabel `products`
```sql
id              uuid primary key default gen_random_uuid()
title           text not null
slug            text unique not null
description     text                     -- HTML dari Tiptap
category_id     uuid references categories(id) on delete set null
type            text check (type in ('free', 'paid')) default 'free'
sale_price      integer default 0        -- Harga Jual (Rupiah); 0 jika free
original_price  integer                  -- Harga Asli opsional; NULL jika tidak ada harga coret
stock_type      text check (stock_type in ('unlimited', 'limited')) default 'unlimited'
stock_qty       integer                  -- NULL jika unlimited; integer jika limited
badge           text                     -- 'baru' | 'terlaris' | 'diskon' | 'gratis' | 'premium' | NULL
badge_custom    text                     -- teks badge custom, maks. 20 karakter; NULL jika bukan custom
is_featured     boolean default false    -- Produk Unggulan (⭐)
cover_path      text
preview_path    text
file_path       text
file_size       text
is_active       boolean default false
sort_order      integer default 0
download_count  integer default 0
published_at    timestamptz
deleted_at      timestamptz
meta_title      text
meta_desc       text
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

**Rule harga coret (enforced di aplikasi, bukan di DB):**
- Jika `original_price IS NOT NULL` dan `original_price > sale_price` → tampilkan harga coret
- Jika `original_price IS NULL` atau `original_price <= sale_price` → abaikan original_price, tampilkan sale_price saja

**Rule stok:**
- Jika `stock_type = 'unlimited'` → `stock_qty` diabaikan
- Jika `stock_type = 'limited'` dan `stock_qty > 0` → produk tersedia, tampilkan "Sisa {n} item"
- Jika `stock_type = 'limited'` dan `stock_qty = 0` → Sold Out, tombol beli nonaktif

**Catatan migrasi kolom harga:**
- Kolom `price` dari versi sebelumnya diganti dengan `sale_price`
- Tidak ada breaking change jika migration awal langsung pakai `sale_price`

### Tabel `product_faqs`
```sql
id          uuid primary key default gen_random_uuid()
product_id  uuid references products(id) on delete cascade not null
question    text not null
answer      text not null
sort_order  integer default 0
created_at  timestamptz default now()
```

### Tabel `categories`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null
slug        text unique not null
color       text default '#16a34a'
sort_order  integer default 0
created_at  timestamptz default now()
```

### Tabel `pages`
```sql
id              uuid primary key default gen_random_uuid()
title           text not null
slug            text unique not null
content         text
is_active       boolean default false
sort_order      integer default 0
meta_title      text
meta_desc       text
robots_index    boolean default true
robots_follow   boolean default true
deleted_at      timestamptz
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

### Tabel `orders`
```sql
id               uuid primary key default gen_random_uuid()
product_id       uuid references products(id) on delete set null
buyer_name       text not null
buyer_whatsapp   text not null
buyer_email      text                     -- opsional
amount           integer
mayar_order_id   text unique
mayar_payment_id text
status           text check (status in ('pending', 'paid', 'failed', 'expired')) default 'pending'
download_token   text unique
token_expires_at timestamptz
downloaded_at    timestamptz
created_at       timestamptz default now()
```

**Perubahan dari v3:**
- `buyer_email` → tetap ada tapi opsional (nullable)
- Tambah `buyer_whatsapp` (wajib, not null)

### Tabel `media`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null
path        text not null unique
url         text not null
size        integer
mime_type   text
created_at  timestamptz default now()
```

### Tabel `assets`
```sql
key         text primary key
label       text not null
media_id    uuid references media(id) on delete set null
updated_at  timestamptz default now()
```

Seed data:
```
logo, logo_white, logo_dark, favicon, default_cover,
og_image, hero_bg, placeholder_image, no_image, image_404, promo_banner
```

### Tabel `homepage_sections`
```sql
id          uuid primary key default gen_random_uuid()
key         text unique not null
label       text not null
is_visible  boolean default true
sort_order  integer default 0
config      jsonb
```

Seed data:
```
hero, featured_products, categories, free_products, promo_banner, about
```

### Tabel `navigation_items`
```sql
id           uuid primary key default gen_random_uuid()
label        text not null
target_type  text check (target_type in ('page', 'product', 'category', 'external'))
target_id    uuid
target_url   text
is_visible   boolean default true
sort_order   integer default 0
```

### Tabel `settings`
```sql
key    text primary key
value  text
```

Seed data:
```
-- Umum
site_name, site_tagline

-- Theme
theme_primary_color, theme_secondary_color,
theme_border_radius, theme_font

-- Download
download_traktir_url, download_promo_text,
download_promo_cta_text, download_promo_cta_url,
download_countdown_duration

-- Maintenance
maintenance_mode, maintenance_message

-- SEO Global
seo_meta_title, seo_meta_description,
seo_template_product, seo_template_category, seo_template_page

-- Announcement
announcement_active, announcement_text, announcement_url,
announcement_bg_color, announcement_text_color,
announcement_start, announcement_end

-- Custom 404
custom_404_title, custom_404_description,
custom_404_cta_text, custom_404_cta_url,
custom_404_product_ids
```

### Tabel `links`
```sql
key    text primary key
label  text not null
url    text
```

Seed data: `mayar, traktir_url, whatsapp, tiktok, instagram, youtube, telegram, shopee, tokopedia, google_drive`

### Tabel `contacts`
```sql
key    text primary key
label  text not null
value  text
```

Seed data: `whatsapp, email, tiktok, instagram, youtube, telegram`

### Tabel `footer_config`
```sql
key    text primary key
value  text
```

Seed data: `copyright_text, description, show_social_links`

### Tabel `footer_links`
```sql
id         uuid primary key default gen_random_uuid()
label      text not null
url        text not null
sort_order integer default 0
is_visible boolean default true
```

### Tabel `notifications`
```sql
id         uuid primary key default gen_random_uuid()
type       text not null
message    text not null
is_read    boolean default false
payload    jsonb
created_at timestamptz default now()
```

### Tabel `error_logs`
```sql
id         uuid primary key default gen_random_uuid()
type       text not null
message    text not null
detail     jsonb
created_at timestamptz default now()
```

---

## 7. Integrasi Mayar

### 7.1 Checkout — Payment Link Dinamis
```
POST /api/checkout
body: { product_id, buyer_name, buyer_whatsapp, buyer_email? }

→ Validasi input: buyer_name wajib, buyer_whatsapp wajib
→ Validasi produk: is_active=true, type='paid'
→ Validasi stok: jika stock_type='limited' dan stock_qty=0 → return 400 "Sold Out"
→ Ambil data produk
→ POST https://api.mayar.id/hl/v1/payment/create
   {
     amount: product.sale_price,
     name: product.title,
     description: "Pembelian {title} oleh {buyer_name}",
     redirectUrl: /terima-kasih,
     customer: { name: buyer_name, phone: buyer_whatsapp, email: buyer_email }
   }
→ Simpan order ke tabel orders (status: pending, buyer_name, buyer_whatsapp, buyer_email, mayar_order_id)
→ Return { payment_url }
→ Frontend redirect ke payment_url
```

### 7.2 Webhook Mayar — Konfirmasi Pembayaran
```
POST /api/webhook/mayar

→ Verifikasi header X-Mayar-Signature (HMAC SHA256 dengan MAYAR_WEBHOOK_SECRET)
→ Jika tidak valid → return 401, catat ke error_logs

→ Parse payload: order_id, status, payment_id
→ Cari order by mayar_order_id

Jika status = 'paid':
  → Idempotent: jika sudah paid, return 200 tanpa proses ulang
  → Jika stock_type='limited': decrement stock_qty via Supabase RPC (atomic)
    → Jika stock_qty sudah 0 sebelum decrement: return 200 (edge case sangat jarang, order sudah masuk)
  → Update order: status='paid', mayar_payment_id, download_token=uuid(), token_expires_at=now()+24h
  → Insert notifikasi (type: 'new_order')

Jika status = 'failed' / 'expired':
  → Update status order saja

Jika order tidak ditemukan:
  → Catat ke error_logs, return 200

→ Return 200
```

### 7.3 Download Berbayar
```
GET /api/download?token=[token]

→ Cari order by download_token
→ Validasi: status='paid', token_expires_at > now()
→ Jika tidak valid → return 403 + pesan jelas
→ Generate Supabase signed URL (expire 1 jam)
→ Update downloaded_at (hanya pertama kali)
→ Redirect ke signed URL
```

### 7.4 Free Download
```
POST /api/download/free
body: { product_id }

→ Validasi: type='free', is_active=true
→ Increment download_count via Supabase RPC (atomic)
→ Generate Supabase signed URL (expire 1 jam)
→ Return { url }
```

---

## 8. Sitemap & Robots

### `GET /sitemap.xml`
- Via Next.js `app/sitemap.js`
- Mencakup: produk aktif, halaman aktif, kategori
- Exclude: halaman dengan `robots_index = false`
- Cache ISR, revalidate 60 menit

### `GET /robots.txt`
- Via Next.js `app/robots.js`
- Membaca pengaturan global dari settings

---

## 9. Keamanan

### Supabase RLS
```sql
-- products: publik hanya baca yang aktif dan sudah terbit
CREATE POLICY "public read active products" ON products
FOR SELECT USING (
  is_active = true
  AND deleted_at IS NULL
  AND (published_at IS NULL OR published_at <= now())
);

-- pages: publik hanya baca yang aktif
CREATE POLICY "public read active pages" ON pages
FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- product_faqs: publik baca via join ke products yang aktif
CREATE POLICY "public read product faqs" ON product_faqs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_faqs.product_id
    AND products.is_active = true
    AND products.deleted_at IS NULL
  )
);

-- Semua tabel: write hanya via service_role (API Routes server-side)
```

### API Routes
- `/api/checkout` — validasi input (buyer_name, buyer_whatsapp wajib), validasi stok, rate limit 10 req/menit per IP
- `/api/webhook/mayar` — verifikasi HMAC SHA256, catat ke error_logs jika gagal
- `/api/download` — validasi token + expire + status paid
- `/api/download/free` — validasi produk aktif dan free
- Semua `/api/admin/*` — validasi sesi Supabase server-side

### Lain-lain
- `SUPABASE_SERVICE_ROLE_KEY` hanya di server, tidak pernah di `NEXT_PUBLIC_*`
- Bucket `products` private — hanya via signed URL
- Download token expire 24 jam, signed URL expire 1 jam
- File path tidak pernah di-expose ke frontend
- Decrement stok via Supabase RPC (atomic, mencegah oversell)

---

## 10. Performance

- Halaman produk: ISR (`revalidate: 60`) via `generateStaticParams`
- Cover image: `next/image` dengan `sizes` yang tepat
- Settings: cache server-side via `unstable_cache` (revalidate 300 detik)
- Semua query berurutan: `ORDER BY sort_order ASC, created_at DESC`
- Lazy load grid produk jika lebih dari 20 item
- PDF preview: lazy load via PDF.js, render hanya 2–3 halaman pertama
- Sitemap: cache ISR, revalidate 60 menit

---

## 11. Struktur Folder Next.js

```
app/
├── (public)/
│   ├── page.jsx                         # Home
│   ├── free/page.jsx                    # Free Download
│   ├── produk/page.jsx                  # Listing berbayar
│   ├── produk/[slug]/page.jsx           # Detail produk
│   ├── kategori/[slug]/page.jsx         # Filter kategori
│   ├── halaman/[slug]/page.jsx          # CMS Pages
│   ├── cari/page.jsx                    # Search
│   └── terima-kasih/page.jsx            # Pasca bayar
├── admin/
│   ├── layout.jsx                       # Auth guard + sidebar
│   ├── page.jsx                         # Dashboard utama
│   ├── produk/
│   │   ├── page.jsx
│   │   ├── baru/page.jsx
│   │   └── [id]/edit/page.jsx
│   ├── kategori/page.jsx
│   ├── halaman/
│   │   ├── page.jsx
│   │   ├── baru/page.jsx
│   │   └── [id]/edit/page.jsx
│   ├── homepage/page.jsx
│   ├── navigation/page.jsx
│   ├── footer/page.jsx
│   ├── theme/page.jsx
│   ├── announcement/page.jsx
│   ├── media/page.jsx
│   ├── assets/page.jsx
│   ├── links/page.jsx
│   ├── contacts/page.jsx
│   ├── pesanan/page.jsx
│   ├── analytics/page.jsx               # P1
│   ├── settings/page.jsx
│   ├── seo/page.jsx
│   ├── custom-404/page.jsx
│   ├── site-health/page.jsx             # P1
│   ├── error-log/page.jsx               # P2
│   ├── backup/page.jsx                  # P2
│   ├── recycle-bin/page.jsx             # P1
│   └── notifikasi/page.jsx              # P1
├── api/
│   ├── checkout/route.js
│   ├── download/route.js
│   ├── download/free/route.js
│   ├── webhook/mayar/route.js
│   └── admin/
│       ├── products/route.js
│       ├── media/route.js
│       ├── assets/route.js
│       └── settings/route.js
├── sitemap.js
├── robots.js
├── not-found.jsx
├── login/page.jsx
├── layout.jsx
└── globals.css

components/
├── public/
│   ├── AnnouncementBar.jsx
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── ProductCard.jsx                  # Mendukung harga coret, badge, sold out
│   ├── PriceBlock.jsx                   # Komponen harga: coret + jual + badge diskon
│   ├── ProductBadge.jsx                 # Badge produk (Baru, Terlaris, dll)
│   ├── StockIndicator.jsx               # "Sisa N item" / "Sold Out"
│   ├── FilePreview.jsx                  # PDF preview / image preview / placeholder
│   ├── ProductFAQ.jsx                   # Accordion FAQ
│   ├── ShareButtons.jsx                 # WhatsApp, Telegram, Copy Link
│   ├── StickyBuyBar.jsx                 # Sticky bar mobile
│   ├── DownloadModal.jsx
│   ├── CategoryBadge.jsx
│   └── SearchInput.jsx
├── admin/
│   ├── Sidebar.jsx
│   ├── GlobalSearch.jsx
│   ├── ProductForm.jsx
│   ├── FAQEditor.jsx                    # Sub-section FAQ dalam form produk
│   ├── RichTextEditor.jsx               # Wrapper Tiptap dengan semua extension
│   ├── PageForm.jsx
│   ├── MediaLibrary.jsx
│   ├── AssetSlot.jsx
│   ├── SortableList.jsx
│   ├── BulkActions.jsx
│   ├── QuickEdit.jsx
│   ├── SEOPreview.jsx
│   ├── StorageMonitor.jsx
│   ├── SiteHealthCard.jsx
│   └── OrderTable.jsx

lib/
├── supabase-browser.js
├── supabase-server.js
├── mayar.js
└── utils.js
    # formatRupiah(amount)
    # generateSlug(title)
    # getStorageUrl(bucket, path)
    # getSetting(key)
    # getAssetUrl(key)
    # getLink(key)
    # getContact(key)
    # buildPageTitle(template_key, variables)
    # calcDiscount(original_price, sale_price)
    # → { percent, saving, showDiscount }

middleware.js                            # Maintenance mode + auth redirect
```

---

## 12. Env Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mayar
MAYAR_API_KEY=
MAYAR_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_SITE_URL=https://bantuguruyuk.web.id
```

Seluruh konten dinamis (URL, teks, warna, logo, dll) diambil dari tabel `settings`, `links`, `contacts`, dan `assets`.

---

## 13. Supabase Storage

| Bucket | Akses | Isi |
|---|---|---|
| `covers` | Public read | Cover image produk |
| `previews` | Public read | Gambar preview produk |
| `media` | Public read | Upload dari Media Library |
| `products` | **Private** | File produk (PDF, ZIP) — hanya via signed URL |

---

## 14. Prioritas Fitur

### P0 — Wajib Sebelum Rilis

**Setup & Infrastruktur:**
- Setup Next.js + Supabase + Tailwind
- Skema database lengkap + seed data semua tabel (termasuk `product_faqs`, `buyer_whatsapp`, `sale_price`, `original_price`, `stock_type`, `stock_qty`, `badge`, `is_featured`)
- RLS policy semua tabel (termasuk `product_faqs`)
- Supabase Auth (1 akun admin)
- `middleware.js` (maintenance mode + auth guard)
- Supabase RPC: `increment_download_count`, `decrement_stock_qty`

**Konten:**
- Admin: CRUD Produk — harga jual + harga asli opsional, preview harga coret, stok unlimited/limited, badge produk, toggle unggulan, FAQ produk (CRUD + drag & drop), Tiptap editor penuh
- Admin: CRUD Kategori
- Admin: CMS Pages (Tiptap editor penuh)

**Tampilan:**
- Admin: Homepage Section Manager
- Admin: Navigation Manager
- Admin: Footer Manager
- Admin: Theme Manager
- Admin: Announcement Bar

**Media & Aset:**
- Admin: Media Library
- Admin: Asset Manager

**Data:**
- Admin: Link Manager
- Admin: Contact Manager

**Settings & SEO:**
- Admin: Settings (Umum, Download, Maintenance)
- Admin: SEO (Global, Template, Robots, Sitemap)
- Admin: Custom 404 Manager
- `app/sitemap.js`, `app/robots.js`, `app/not-found.jsx`

**Halaman Publik:**
- Announcement Bar
- Navbar dari Navigation Manager
- Footer dari Footer Manager
- Home (dari Homepage Sections, seksi Produk Unggulan dari `is_featured`)
- Free Download (grid + DownloadModal 2-phase + badge produk)
- Listing Produk Berbayar (PriceBlock + badge + sold out indicator)
- Detail Produk (PriceBlock + stok + FilePreview + FAQ accordion + ShareButtons + StickyBuyBar mobile)
- Checkout form (nama, WhatsApp, email opsional) sebelum redirect Mayar
- Terima Kasih + Download berbayar
- CMS Pages
- Search
- Filter Kategori
- 404 Custom
- Maintenance

**Payment & Download:**
- `POST /api/checkout` — validasi input buyer, validasi stok, amount = sale_price
- `POST /api/webhook/mayar` — konfirmasi bayar, decrement stok atomic, generate token
- `GET /api/download` — download berbayar via token
- `POST /api/download/free` — signed URL

**Dashboard Utama:**
- Summary Cards, Quick Actions, Global Search (Cmd+K), Feed terbaru

---

### P1 — Penting Setelah MVP Stabil

- Admin: Kelola Pesanan (tabel + kolom WhatsApp pembeli + generate ulang link + export CSV)
- Admin: Bulk Actions (produk, halaman)
- Admin: Quick Edit inline
- Admin: SEO Preview live
- Admin: Preview Produk (bypass draft)
- Admin: Storage Usage Monitor
- Admin: Dashboard Analytics
- Admin: Site Health
- Admin: Recycle Bin
- Admin: Notification Center
- Filter kategori di halaman publik
- ISR + caching halaman produk
- Duplicate Product
- Duplicate Page
- Related Product (di halaman detail, berdasarkan kategori)
- Publish Schedule

---

### P2 — Fitur Lanjutan

- Admin: Error Log Viewer
- Admin: System Backup
- Import / Export Data produk (CSV)
- Voucher / Coupon (kode diskon dengan nominal atau persentase)
- Notifikasi WhatsApp ke pembeli pasca bayar
- Email konfirmasi pembeli via Resend
- Product Tags
- Bundle produk
- Watermark PDF otomatis
- GA4 event tracking
- PWA (install to homescreen)

---

## 15. Catatan Implementasi untuk Codex

- Gunakan **App Router** (bukan Pages Router)
- Semua API Route: `route.js` (bukan `route.ts`)
- **Wajib** pisah Supabase client: `lib/supabase-browser.js` dan `lib/supabase-server.js`
- Drag & drop: `@dnd-kit/core` + `@dnd-kit/sortable`
- Rich text: **Tiptap** — install extension: StarterKit, Underline, TaskList, Table, Link, Image, YouTube, custom Callout node
- PDF preview: **PDF.js** (via `pdfjs-dist`) — lazy load, render 2–3 halaman pertama di client
- Maintenance mode: `middleware.js` (Next.js Edge)
- Download file: tidak pernah expose `file_path` ke frontend, selalu via `/api/download`
- `download_count`: increment via Supabase RPC atomic
- `stock_qty`: decrement via Supabase RPC atomic di webhook (bukan di checkout — hindari stok terpesan untuk order yang belum dibayar)
- Harga coret: hitung di helper `calcDiscount(original_price, sale_price)` → kembalikan `{ showDiscount, percent, saving }`; jika `original_price` null atau `≤ sale_price` → `showDiscount = false`
- Checkout amount: selalu gunakan `sale_price` (bukan `original_price`)
- Badge produk: field `badge` di tabel, nilai: `'baru' | 'terlaris' | 'diskon' | 'gratis' | 'premium' | 'custom' | null`; jika `'custom'` → render teks dari `badge_custom`
- Badge "Diskon" otomatis: jika `showDiscount = true` dan `badge IS NULL` → render badge diskon tanpa menyimpan ke DB; admin bisa juga set badge 'diskon' secara manual
- Sticky Buy Button: implementasi dengan `IntersectionObserver` pada tombol beli utama — muncul saat tombol utama keluar viewport, hilang saat masuk kembali
- Share produk: WhatsApp (`https://wa.me/?text=...`), Telegram (`https://t.me/share/url?url=...`), Copy Link (`navigator.clipboard.writeText`)
- FAQ: query `SELECT * FROM product_faqs WHERE product_id = $1 ORDER BY sort_order ASC`
- `sort_order` semua tabel: `ORDER BY sort_order ASC, created_at DESC`
- Settings cache: `unstable_cache` (revalidate 300 detik)
- Harga: selalu **integer Rupiah**; format: `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)`
- Auto save: `localStorage` key `draft_product_[id]`, hapus saat simpan berhasil
- Free download: POST bukan GET
- Webhook Mayar: verifikasi HMAC SHA256, tolak jika tidak valid
- Token download: expire 24 jam; signed URL expire 1 jam
- Soft delete: `deleted_at IS NULL` di semua query publik
- Announcement Bar: cek `announcement_start <= now() <= announcement_end` di server
- Navigation: resolve `target_type` ke URL — `page` → `/halaman/[slug]`, `product` → `/produk/[slug]`, `category` → `/kategori/[slug]`, `external` → `target_url`
- Asset global: `getAssetUrl(key)` — join `assets` + `media`, fallback ke `placeholder_image`
- SEO Template: `buildPageTitle(template_key, variables)` — baca dari settings, replace variabel
