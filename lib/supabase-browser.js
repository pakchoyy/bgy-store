import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

export function createClient() {
  if (
    !supabaseUrl || supabaseUrl === 'your_supabase_url' ||
    !supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key'
  ) {
    return nullClient()
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
