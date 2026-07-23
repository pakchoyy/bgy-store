import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function nullClient() {
  const noopData = async () => ({ data: null, error: null })
  const noopSession = async () => ({ data: { session: null }, error: null })
  const fail = async () => ({ data: null, error: { message: 'Supabase not configured' } })
  return {
    auth: {
      getSession: noopSession,
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: fail,
      signOut: noopData,
      setSession: noopSession,
      refreshSession: noopSession,
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: noopData, single: noopData, order: () => ({ range: noopData }) }),
        order: () => ({ range: noopData }),
        limit: () => ({ order: noopData }),
        maybeSingle: noopData,
        single: noopData,
      }),
      insert: fail,
      update: fail,
      delete: fail,
      upsert: fail,
    }),
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

export function createClient() {
  if (
    !supabaseUrl || supabaseUrl === 'your_supabase_url' ||
    !supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key'
  ) {
    return nullClient()
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
