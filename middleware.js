import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { isAdmin } from './lib/admin-role'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Public pages don't need auth check — skip fast to avoid timeout
  if (!pathname.startsWith('/admin') && pathname !== '/login') {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSupabase = supabaseUrl && supabaseUrl !== 'your_supabase_url'

  const response = NextResponse.next()
  let user = null

  // Skip Supabase call if no auth cookie — no session to check
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

  if (hasSupabase && hasAuthCookie) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      })
      const { data } = await supabase.auth.getUser()
      user = data?.user || null
    } catch (e) {
      console.error('Middleware auth check failed:', e)
    }
  }

  // Admin route protection — redirect to /login if no session
  if (pathname.startsWith('/admin')) {
    if (!hasSupabase) {
      return response
    }
    if (!isAdmin(user)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // Login page — redirect to /admin if already logged in
  if (pathname === '/login') {
    if (isAdmin(user)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
