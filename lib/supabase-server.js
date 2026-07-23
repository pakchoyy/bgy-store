import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function nullClient() {
  const noopData = async () => ({ data: null, error: null })
  const noopSession = async () => ({ data: { session: null }, error: null })
  const fail = async () => ({ data: null, error: { message: 'Supabase not configured' } })
  const chain = (table) => ({
    select: (columns) => ({
      eq: (col, val) => ({ maybeSingle: noopData, single: noopData, order: (col, dir) => ({ range: noopData }) }),
      order: (col, dir) => ({ range: noopData }),
      limit: (n) => ({ order: noopData }),
      maybeSingle: noopData,
      single: noopData,
    }),
    insert: fail,
    update: fail,
    delete: fail,
    upsert: fail,
  })
  return {
    auth: {
      getSession: noopSession,
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: fail,
      signOut: noopData,
      setSession: noopSession,
      refreshSession: noopSession,
    },
    from: () => chain(),
    storage: {
      from: () => ({
        upload: fail,
        download: fail,
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: noopData,
        remove: fail,
      }),
    },
    rpc: fail,
  }
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl || supabaseUrl === 'your_supabase_url' ||
    !supabaseKey || supabaseKey === 'your_supabase_anon_key'
  ) {
    return nullClient()
  }

  try {
    const cookieStore = await cookies()
    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    })
  } catch {
    return nullClient()
  }
}

export async function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl || supabaseUrl === 'your_supabase_url' ||
    !serviceKey || serviceKey === 'your_service_role_key'
  ) {
    return nullClient()
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  } catch {
    return nullClient()
  }
}
