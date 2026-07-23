import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL tidak dikonfigurasi', env: { supabaseUrl, supabaseKey: supabaseKey?.slice(0, 10) + '...' } },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      return Response.json({ error: error.message, status: error.status || 401 }, { status: 401 })
    }

    if (!data?.session) {
      return Response.json({ error: 'Session not created' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('API /api/auth/login error:', error)
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
