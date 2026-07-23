import { createClient } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const sections = body?.sections

    if (!Array.isArray(sections) || sections.length === 0) {
      return Response.json({ error: 'sections required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i]
      const payload = {
        label: s.label,
        is_visible: !!s.is_visible,
        sort_order: typeof s.sort_order === 'number' ? s.sort_order : i + 1,
        config: s.config || {},
      }

      if (s.id && !String(s.id).startsWith('seed-') && !String(s.id).startsWith('demo-')) {
        const { error } = await supabase
          .from('homepage_sections')
          .update(payload)
          .eq('id', s.id)
        if (error) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      } else if (s.key) {
        const { error } = await supabase
          .from('homepage_sections')
          .upsert({ key: s.key, ...payload }, { onConflict: 'key' })
        if (error) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      }
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('POST /api/admin/homepage', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
