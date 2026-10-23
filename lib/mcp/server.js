import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { createServiceClient, hasServiceRole } from '@/lib/supabase-server'
import { randomSlug, safeUrl } from '@/lib/utils'

const LAYOUTS = ['landscape', 'square', 'portrait', 'wide', 'compact']
const BLOCK_TYPES = ['text', 'image', 'link']
const SETTING_KEYS = [
  'animations_enabled', 'site_name', 'site_tagline', 'profile_name', 'profile_handle', 'profile_about', 'profile_avatar_url',
  'banner_url', 'banner_enabled', 'bg_color', 'bg_style', 'bg_image_url', 'social_links',
  'theme_primary_color', 'theme_secondary_color', 'theme_border_radius', 'theme_font', 'theme_button_style',
  'announcement_active', 'announcement_text', 'announcement_url', 'announcement_start', 'announcement_end',
  'announcement_bg_color', 'announcement_text_color',
  'maintenance_mode', 'maintenance_message', 'referral_discount_percent', 'referral_share_text',
  'pdf_watermark_enabled', 'hide_semester_1', 'hide_semester_2',
  'promo_download_text', 'promo_after_download_code', 'promo_after_download_text',
]

const ok = (data) => ({ content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] })
const fail = (message) => ({ isError: true, content: [{ type: 'text', text: message }] })
const maskName = (n) => String(n || '').split(/\s+/)[0] || '-'
const host = (u) => { try { return new URL(u).host } catch { return u ? 'link' : null } }

async function db() {
  if (!hasServiceRole()) throw new Error('SUPABASE_SERVICE_ROLE_KEY belum diatur di server.')
  return createServiceClient()
}

// Jika kolom opsional belum ada (SQL belum dijalankan), buang kolom itu dan coba lagi.
async function withColumnFallback(run, row) {
  const data = { ...row }
  const warnings = []
  let result = await run(data)
  for (let i = 0; i < 4 && result.error; i++) {
    const m = /column "?([a-z_]+)"?|'([a-z_]+)' column/i.exec(result.error.message || '')
    const col = m && (m[1] || m[2])
    if (!col || !(col in data)) break
    delete data[col]
    warnings.push(`Kolom ${col} belum ada di database, nilainya tidak disimpan (jalankan SQL migrasi terkait).`)
    result = await run(data)
  }
  return { ...result, warnings }
}

const PRODUCT_FIELDS = {
  title: z.string().min(1).max(160).optional().describe('Judul produk'),
  description: z.string().max(20000).optional().describe('Deskripsi (boleh HTML sederhana)'),
  type: z.enum(['free', 'paid']).optional(),
  sale_price: z.number().int().min(0).max(100000000).optional().describe('Harga jual dalam Rupiah. Produk berbayar minimal 1000.'),
  original_price: z.number().int().min(0).nullable().optional().describe('Harga coret (null untuk menghapus)'),
  category_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional().describe('false = draft'),
  show_on_home: z.boolean().optional().describe('Tampil di Beranda'),
  is_featured: z.boolean().optional().describe('Highlight kartu'),
  card_layout: z.enum(LAYOUTS).optional(),
  purchase_button_label: z.enum(['Beli Sekarang', 'Pesan Sekarang', 'Dapatkan Sekarang']).optional(),
  cover_url: z.string().max(1000).nullable().optional().describe('URL gambar sampul (https atau /path)'),
  file_url: z.string().max(2000).nullable().optional().describe('Link file/produk (https)'),
  stock_type: z.enum(['unlimited', 'limited']).optional(),
  stock_qty: z.number().int().min(0).optional(),
  semester: z.number().int().min(1).max(2).nullable().optional(),
  sold_manual: z.number().int().min(0).max(10000000).optional().describe('Tambahan jumlah terjual dari luar toko (ditambahkan ke pesanan lunas)'),
  meta_title: z.string().max(160).nullable().optional(),
  meta_description: z.string().max(320).nullable().optional(),
}

function buildProductRow(input) {
  const row = {}
  const copy = ['title', 'description', 'type', 'sale_price', 'original_price', 'category_id', 'is_active', 'show_on_home', 'is_featured',
    'card_layout', 'purchase_button_label', 'stock_type', 'stock_qty', 'semester', 'sold_manual', 'meta_title', 'meta_description']
  for (const k of copy) if (input[k] !== undefined) row[k] = typeof input[k] === 'string' ? input[k].trim() : input[k]
  if (input.cover_url !== undefined) {
    const url = input.cover_url === null || input.cover_url === '' ? null : safeUrl(input.cover_url)
    if (input.cover_url && !url) throw new Error('cover_url harus diawali https:// atau /')
    row.cover_path = url
  }
  if (input.file_url !== undefined) {
    let url = null
    if (input.file_url) {
      try {
        const u = new URL(input.file_url)
        if (u.protocol !== 'https:') throw new Error('x')
        url = u.toString()
      } catch {
        throw new Error('file_url harus link https://')
      }
    }
    row.file_url = url
  }
  if (row.type === 'free') row.sale_price = 0
  if (row.type === 'paid' && row.sale_price !== undefined && row.sale_price < 1000) throw new Error('Harga produk berbayar minimal Rp1.000 (batas pembayaran online).')
  return row
}

const PRODUCT_LIST = 'id, title, slug, type, sale_price, original_price, is_active, show_on_home, card_layout, sort_order, stock_type, stock_qty, semester, is_featured, category_id, deleted_at'

export function createMcpServer({ ip } = {}) {
  const server = new McpServer({ name: 'kreacy-admin', version: '1.0.0' })
  const audit = (tool, extra = {}) => console.log('[mcp]', JSON.stringify({ tool, ip, ...extra }))

  const tool = (name, config, handler) => server.registerTool(name, config, async (args) => {
    try {
      const res = await handler(args || {})
      audit(name, { ok: !res.isError })
      return res
    } catch (e) {
      audit(name, { ok: false })
      console.error('[mcp] tool error', name, e?.message)
      return fail(e?.message || 'Gagal')
    }
  })
  const RO = { readOnlyHint: true, openWorldHint: false }
  const W = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  const D = { readOnlyHint: false, destructiveHint: true, openWorldHint: false }
  const refresh = () => { try { revalidateTag('store') } catch {} }

  // ---------- BACA ----------
  tool('site_overview', { title: 'Ringkasan toko', description: 'Jumlah produk, blok, dan pesanan per status.', inputSchema: {}, annotations: RO }, async () => {
    const s = await db()
    const count = async (q) => (await q).count || 0
    const [active, draft, blocks, paid, pending] = await Promise.all([
      count(s.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null)),
      count(s.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false).is('deleted_at', null)),
      count(s.from('content_blocks').select('id', { count: 'exact', head: true })),
      count(s.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid')),
      count(s.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    ])
    return ok({ produk_aktif: active, produk_draft: draft, blok: blocks, pesanan_lunas: paid, pesanan_pending: pending })
  })

  tool('list_products', {
    title: 'Daftar produk', description: 'Daftar produk (tanpa yang terhapus). Bisa dicari dan difilter.',
    inputSchema: { search: z.string().max(100).optional(), type: z.enum(['free', 'paid']).optional(), active: z.boolean().optional(), limit: z.number().int().min(1).max(100).optional() },
    annotations: RO,
  }, async ({ search, type, active, limit }) => {
    const s = await db()
    const select = async (cols) => {
      let q = s.from('products').select(cols).is('deleted_at', null).order('sort_order').limit(limit || 50)
      if (search) q = q.ilike('title', `%${search.replace(/[%,()]/g, ' ')}%`)
      if (type) q = q.eq('type', type)
      if (active !== undefined) q = q.eq('is_active', active)
      return q
    }
    let { data, error } = await select(PRODUCT_LIST)
    if (error) ({ data, error } = await select(PRODUCT_LIST.replace(' show_on_home,', '')))
    if (error) throw new Error(error.message)
    return ok(data)
  })

  tool('get_product', { title: 'Detail produk', description: 'Detail satu produk. Link file hanya ditampilkan domainnya.', inputSchema: { id: z.string().uuid() }, annotations: RO }, async ({ id }) => {
    const s = await db()
    const { data, error } = await s.from('products').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return fail('Produk tidak ditemukan')
    const { file_url, file_path, ...rest } = data
    return ok({ ...rest, file_host: host(file_url), punya_file_unggahan: !!file_path })
  })

  tool('list_categories', { title: 'Daftar kategori', description: 'Kategori produk.', inputSchema: {}, annotations: RO }, async () => {
    const s = await db()
    const { data, error } = await s.from('categories').select('id, name, slug, sort_order').order('sort_order')
    if (error) throw new Error(error.message)
    return ok(data)
  })

  tool('list_blocks', { title: 'Daftar blok', description: 'Blok teks/gambar/link di Beranda beserta urutannya.', inputSchema: {}, annotations: RO }, async () => {
    const s = await db()
    const { data, error } = await s.from('content_blocks').select('*').order('sort_order')
    if (error) throw new Error(error.message)
    return ok(data)
  })

  tool('get_settings', { title: 'Pengaturan toko', description: 'Pengaturan tampilan dan teks toko (kunci yang boleh diubah lewat MCP).', inputSchema: {}, annotations: RO }, async () => {
    const s = await db()
    const { data, error } = await s.from('settings').select('key, value').in('key', SETTING_KEYS)
    if (error) throw new Error(error.message)
    return ok({ boleh_diubah: SETTING_KEYS, nilai: Object.fromEntries((data || []).map((r) => [r.key, r.value])) })
  })

  tool('list_orders', {
    title: 'Daftar pesanan', description: 'Pesanan terbaru. Kontak pembeli sengaja tidak ditampilkan; nama hanya nama depan.',
    inputSchema: { status: z.enum(['pending', 'paid', 'failed', 'expired']).optional(), limit: z.number().int().min(1).max(50).optional() }, annotations: RO,
  }, async ({ status, limit }) => {
    const s = await db()
    let q = s.from('orders').select('id, status, amount, created_at, buyer_name, product:products(title)').order('created_at', { ascending: false }).limit(limit || 20)
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return ok((data || []).map((o) => ({ id: o.id, tanggal: o.created_at, status: o.status, jumlah: o.amount, produk: o.product?.title || '(beberapa produk / traktir)', pembeli: maskName(o.buyer_name) })))
  })

  // ---------- TULIS ----------
  tool('create_product', {
    title: 'Buat produk', description: 'Membuat produk baru (default: DRAFT, belum tampil). Alamat (slug) dibuat otomatis 8 karakter acak.',
    inputSchema: { ...PRODUCT_FIELDS, title: z.string().min(1).max(160), type: z.enum(['free', 'paid']) }, annotations: { ...W, idempotentHint: false },
  }, async (input) => {
    const s = await db()
    const row = buildProductRow({ is_active: false, show_on_home: true, card_layout: 'landscape', ...input })
    if (row.type === 'paid' && !(row.sale_price >= 1000)) throw new Error('Produk berbayar wajib punya sale_price minimal 1000.')
    const { data: max } = await s.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
    row.sort_order = (max?.sort_order || 0) + 1
    if (row.is_active) row.published_at = new Date().toISOString()
    let result
    for (let i = 0; i < 5; i++) {
      result = await withColumnFallback((r) => s.from('products').insert(r).select('id, title, slug, is_active').single(), { ...row, slug: randomSlug(8) })
      if (result.error?.code !== '23505') break
    }
    if (result.error) throw new Error(result.error.message)
    refresh()
    return ok({ dibuat: result.data, peringatan: result.warnings })
  })

  tool('update_product', {
    title: 'Ubah produk', description: 'Mengubah sebagian field produk. Hanya field yang dikirim yang berubah.',
    inputSchema: { id: z.string().uuid(), ...PRODUCT_FIELDS }, annotations: W,
  }, async ({ id, ...input }) => {
    const s = await db()
    const row = buildProductRow(input)
    if (!Object.keys(row).length) return fail('Tidak ada field yang diubah.')
    if (row.is_active === true) row.published_at = new Date().toISOString()
    const result = await withColumnFallback((r) => s.from('products').update(r).eq('id', id).select('id, title, slug, is_active, sale_price').single(), row)
    if (result.error) throw new Error(result.error.message)
    refresh()
    return ok({ diubah: result.data, peringatan: result.warnings })
  })

  tool('delete_product', {
    title: 'Hapus produk (ke Recycle Bin)', description: 'Memindahkan produk ke Recycle Bin (bisa dipulihkan dari admin). Wajib confirm=true.',
    inputSchema: { id: z.string().uuid(), confirm: z.literal(true) }, annotations: D,
  }, async ({ id }) => {
    const s = await db()
    const { error } = await s.from('products').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id)
    if (error) throw new Error(error.message)
    refresh()
    return ok('Produk dipindahkan ke Recycle Bin.')
  })

  tool('reorder_items', {
    title: 'Atur urutan', description: 'Mengatur urutan tampil produk dan blok di Beranda. Kirim daftar lengkap sesuai urutan baru.',
    inputSchema: { order: z.array(z.object({ kind: z.enum(['product', 'block']), id: z.string().uuid() })).min(1).max(300) }, annotations: W,
  }, async ({ order }) => {
    const s = await db()
    for (let i = 0; i < order.length; i++) {
      const { kind, id } = order[i]
      const { error } = await s.from(kind === 'product' ? 'products' : 'content_blocks').update({ sort_order: i + 1 }).eq('id', id)
      if (error) throw new Error(error.message)
    }
    refresh()
    return ok(`Urutan diperbarui (${order.length} item).`)
  })

  const BLOCK_FIELDS = {
    title: z.string().max(200).nullable().optional(),
    url: z.string().max(1000).nullable().optional(),
    text_content: z.string().max(20000).nullable().optional(),
    background_color: z.string().regex(/^(transparent|#[0-9a-fA-F]{3,8})$/).optional(),
    image_path: z.string().max(1000).nullable().optional().describe('URL gambar blok'),
    is_active: z.boolean().optional(),
    collapse_after: z.number().int().min(1).max(50).nullable().optional().describe('Tampilkan N produk dulu di bawah blok ini, sisanya "Lihat selengkapnya"'),
  }
  function buildBlockRow(input) {
    const row = {}
    for (const k of ['title', 'text_content', 'background_color', 'is_active', 'collapse_after']) if (input[k] !== undefined) row[k] = typeof input[k] === 'string' ? input[k].trim() : input[k]
    for (const k of ['url', 'image_path']) {
      if (input[k] === undefined) continue
      const v = input[k] ? safeUrl(input[k]) : null
      if (input[k] && !v) throw new Error(`${k} harus diawali http(s):// atau /`)
      row[k] = v
    }
    return row
  }

  tool('create_block', {
    title: 'Buat blok', description: 'Membuat blok di Beranda: text, image, atau link. Ditaruh paling bawah.',
    inputSchema: { block_type: z.enum(BLOCK_TYPES), ...BLOCK_FIELDS }, annotations: { ...W, idempotentHint: false },
  }, async ({ block_type, ...input }) => {
    const s = await db()
    const row = { block_type, background_color: '#ffffff', is_active: true, ...buildBlockRow(input) }
    if (block_type === 'link' && !row.url) throw new Error('Blok link wajib punya url.')
    if (block_type === 'image' && !row.image_path) throw new Error('Blok gambar wajib punya image_path.')
    if (block_type === 'text' && !String(row.text_content || '').replace(/<[^>]*>/g, '').trim()) throw new Error('Blok teks wajib punya text_content.')
    const [{ data: mp }, { data: mb }] = await Promise.all([
      s.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle(),
      s.from('content_blocks').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle(),
    ])
    row.sort_order = Math.max(mp?.sort_order || 0, mb?.sort_order || 0) + 1
    const result = await withColumnFallback((r) => s.from('content_blocks').insert(r).select().single(), row)
    if (result.error) throw new Error(result.error.message)
    refresh()
    return ok({ dibuat: result.data, peringatan: result.warnings })
  })

  tool('update_block', { title: 'Ubah blok', description: 'Mengubah sebagian field blok.', inputSchema: { id: z.string().uuid(), ...BLOCK_FIELDS }, annotations: W }, async ({ id, ...input }) => {
    const s = await db()
    const row = buildBlockRow(input)
    if (!Object.keys(row).length) return fail('Tidak ada field yang diubah.')
    const result = await withColumnFallback((r) => s.from('content_blocks').update(r).eq('id', id).select().single(), row)
    if (result.error) throw new Error(result.error.message)
    refresh()
    return ok({ diubah: result.data, peringatan: result.warnings })
  })

  tool('delete_block', { title: 'Hapus blok', description: 'Menghapus blok PERMANEN. Wajib confirm=true.', inputSchema: { id: z.string().uuid(), confirm: z.literal(true) }, annotations: D }, async ({ id }) => {
    const s = await db()
    const { error } = await s.from('content_blocks').delete().eq('id', id)
    if (error) throw new Error(error.message)
    refresh()
    return ok('Blok dihapus.')
  })

  tool('update_settings', {
    title: 'Ubah pengaturan toko', description: `Mengubah pengaturan teks/tampilan. Kunci yang diizinkan: ${SETTING_KEYS.join(', ')}.`,
    inputSchema: { settings: z.record(z.string(), z.string().max(2000)) }, annotations: W,
  }, async ({ settings }) => {
    const bad = Object.keys(settings).filter((k) => !SETTING_KEYS.includes(k))
    if (bad.length) throw new Error(`Kunci tidak diizinkan: ${bad.join(', ')}`)
    const entries = Object.entries(settings)
    if (!entries.length) return fail('Tidak ada pengaturan yang dikirim.')
    const s = await db()
    const { error } = await s.from('settings').upsert(entries.map(([key, value]) => ({ key, value: String(value) })), { onConflict: 'key' })
    if (error) throw new Error(error.message)
    refresh()
    return ok(`Pengaturan diperbarui: ${entries.map(([k]) => k).join(', ')}`)
  })

  tool('refresh_store', { title: 'Segarkan tampilan toko', description: 'Memaksa cache toko diperbarui sekarang.', inputSchema: {}, annotations: W }, async () => {
    refresh()
    return ok('Cache toko disegarkan.')
  })

  return server
}
