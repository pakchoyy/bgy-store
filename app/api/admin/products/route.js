import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'
import { generateSlug } from '@/lib/utils'

function normalizeFileUrl(value) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function sanitizeProduct(body) {
  return {
    title: (body.title || '').trim(),
    slug: (body.slug || generateSlug(body.title || '')).trim(),
    description: (body.description || '').trim(),
    category_id: body.category_id || null,
    type: body.type === 'paid' ? 'paid' : 'free',
    purchase_button_label: ['Beli Sekarang', 'Pesan Sekarang', 'Dapatkan Sekarang'].includes(body.purchase_button_label)
      ? body.purchase_button_label
      : 'Beli Sekarang',
    sale_price: typeof body.sale_price === 'number' ? body.sale_price : 0,
    original_price: typeof body.original_price === 'number' ? body.original_price : null,
    stock_type: body.stock_type === 'limited' ? 'limited' : 'unlimited',
    stock_qty: typeof body.stock_qty === 'number' ? body.stock_qty : null,
    badge: body.badge || null,
    badge_custom: body.badge_custom || null,
    is_featured: !!body.is_featured,
    cover_path: body.cover_path || null,
    preview_path: body.preview_path || null,
    file_path: body.file_path || null,
    file_url: normalizeFileUrl(body.file_url),
    file_name: body.file_name || null,
    file_size: body.file_size || null,
    mime_type: body.mime_type || null,
    card_layout: body.card_layout || 'landscape',
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    is_active: body.is_active !== false,
    published_at: body.is_active ? new Date().toISOString() : null,
    deleted_at: null,
    ...('flash_price' in body
      ? {
          flash_price: body.type === 'paid' && Number.isFinite(Number(body.flash_price)) && body.flash_price !== '' && body.flash_price !== null ? Math.max(0, Math.round(Number(body.flash_price))) : null,
          flash_ends_at: body.type === 'paid' && body.flash_ends_at ? toWibIso(body.flash_ends_at) : null,
        }
      : {}),
    ...(Array.isArray(body.bundle_product_ids)
      ? { bundle_product_ids: body.type === 'paid' ? [...new Set(body.bundle_product_ids.filter((id) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)))].slice(0, 30) : [] }
      : {}),
  }
}

function toWibIso(value) {
  const text = String(value)
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(text) ? text : `${text.length === 16 ? `${text}:00` : text}+07:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const OPTIONAL_COLUMNS = [
  { key: 'bundle_product_ids', sql: '016', label: 'Isi paket' },
  { key: 'flash_price', sql: '017', label: 'Flash sale' },
  { key: 'flash_ends_at', sql: '017', label: 'Flash sale' },
]

async function withoutMissingBundleColumn(run, product) {
  let row = { ...product }
  const warnings = new Set()
  let result = await run(row)
  for (let attempt = 0; attempt < OPTIONAL_COLUMNS.length && result.error; attempt++) {
    const missing = OPTIONAL_COLUMNS.find((c) => c.key in row && (result.error.message || '').includes(c.key))
    if (!missing) break
    const dropped = row[missing.key]
    delete row[missing.key]
    if (dropped && (!Array.isArray(dropped) || dropped.length)) warnings.add(`${missing.label} belum tersimpan: jalankan SQL ${missing.sql} dulu.`)
    result = await run(row)
  }
  if (!result.error && warnings.size) result.warning = [...warnings].join(' ')
  return result
}

export async function POST(request) {
  try {
    const body = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      const product = sanitizeProduct(body)
      return Response.json({ success: true, demo: true, product: { ...product, id: 'demo-' + Date.now() } })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const product = sanitizeProduct(body)

    if (!product.title) {
      return Response.json({ error: 'title is required' }, { status: 400 })
    }

    const { data, error, warning } = await withoutMissingBundleColumn((row) => supabase.from('products').insert(row).select().single(), product)
    if (error) {
      console.error('POST /api/admin/products insert error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, product: data, warning })
  } catch (e) {
    console.error('POST /api/admin/products unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, ...rest } = body

    if (!id) {
      return Response.json({ error: 'id required for update' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const product = sanitizeProduct(rest)
    if (product.bundle_product_ids) product.bundle_product_ids = product.bundle_product_ids.filter((pid) => pid !== id)
    const { data, error, warning } = await withoutMissingBundleColumn((row) => supabase.from('products').update(row).eq('id', id).select().single(), product)
    if (error) {
      console.error('PUT /api/admin/products update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, product: data, warning })
  } catch (e) {
    console.error('PUT /api/admin/products unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()

    if (body.restore) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
        return Response.json({ success: true, demo: true })
      }
      const supabase = await createClient()
      const auth = await requireAdmin(supabase)
      if (auth.error) return auth.error

      const { error } = await supabase.from('products').update({ deleted_at: null }).eq('id', body.restore)
      if (error) {
        console.error('PATCH /api/admin/products restore error:', error)
        return Response.json({ error: error.message }, { status: 500 })
      }
      return Response.json({ success: true })
    }

    const products = Array.isArray(body.products) ? body.products : []

    if (!products.length) {
      return Response.json({ error: 'products required for update' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const updates = products
      .filter((product) => product.id)
      .map((product, index) =>
        supabase
          .from('products')
          .update({
            sort_order: typeof product.sort_order === 'number' ? product.sort_order : index + 1,
            is_active: product.is_active !== false,
            is_featured: !!product.is_featured,
          })
          .eq('id', product.id)
      )

    const results = await Promise.all(updates)
    const error = results.find((result) => result.error)?.error
    if (error) {
      console.error('PATCH /api/admin/products update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/products unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const permanent = searchParams.get('permanent') === 'true'

    if (!id) {
      return Response.json({ error: 'id required for delete' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const { error } = permanent
      ? await supabase.from('products').delete().eq('id', id)
      : await supabase.from('products').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id)

    if (error) {
      console.error('DELETE /api/admin/products error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/products unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
