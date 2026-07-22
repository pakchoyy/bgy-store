import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Admin route protection — redirect to /login if no session
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Login page — redirect to /admin if already logged in
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return response
  }

  // Maintenance mode check (public routes only)
  // Skips: _next, api, static files, login
  if (
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/auth') &&
    !pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    // Fallback: check if Supabase is configured before checking maintenance
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl && supabaseUrl !== 'your_supabase_url') {
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle()

      if (setting?.value === 'true') {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
