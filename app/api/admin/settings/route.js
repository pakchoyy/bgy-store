import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ demo: true, settings: {} })
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('settings').select('*')
    if (error) return Response.json({ error: error.message }, { status: 500 })

    const map = {}
    ;(data || []).forEach((row) => {
      map[row.key] = row.value
    })
    return Response.json({ settings: map })
  } catch (e) {
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const settings = body?.settings

    if (!settings || typeof settings !== 'object') {
      return Response.json({ error: 'settings object required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const entries = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value == null ? '' : String(value),
    }))

    for (const entry of entries) {
      const { error } = await supabase.from('settings').upsert(entry, { onConflict: 'key' })
      if (error) return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('POST /api/admin/settings', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
