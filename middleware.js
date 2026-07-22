import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'your_supabase_url'

  // Check for Supabase auth session via cookies (sb- prefix)
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some((c) =>
    c.name.startsWith('sb-') && c.value
  )

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    if (!hasSession || !hasSupabase) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Login page — redirect to /admin if already has session
  if (pathname === '/login') {
    if (hasSession && hasSupabase) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
