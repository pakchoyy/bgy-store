import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Admin routes — skip maintenance check for admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Maintenance mode check
  // In production, this would check Supabase settings
  // For now, just pass through
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
