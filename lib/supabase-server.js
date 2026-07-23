import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function nullChain() {
  const base = {
    then(resolve) {
      return resolve({ data: null, error: null })
    },
  }
  return new Proxy(base, {
    get(target, prop) {
      if (prop === 'then') return target.then
      if (prop === 'maybeSingle' || prop === 'single') {
        return async () => ({ data: null, error: null })
      }
      return (...args) => nullChain()
    },
  })
}

function nullClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { session: null },
        error: { message: 'Supabase not configured' },
      }),
      signOut: async () => ({ error: null }),
      setSession: async () => ({ data: { session: null }, error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => nullChain(),
    storage: {
      from: () => nullChain(),
    },
    rpc: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
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
