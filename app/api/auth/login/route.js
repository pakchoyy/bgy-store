import { createServerClient } from '@supabase/ssr';
import { isAdmin, isConfiguredAdminEmail } from '@/lib/admin-role';
import { createServiceClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { rateLimitedShared, tooMany, clientIp } from '@/lib/rate-limit';

function createAuthClient(request, response) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { ...options, path: '/' });
          });
        },
      },
    }
  );

  return supabase;
}

export async function POST(request) {
  // Anti brute force: maks 8 percobaan / 15 menit per IP.
  if (await rateLimitedShared(request, 'login', 8, 15 * 60 * 1000)) {
    console.warn('[security] login rate-limited', { ip: clientIp(request) });
    return tooMany();
  }
  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || email.length > 254 || password.length > 1024) return NextResponse.json({ error: 'Masukkan email dan password yang valid.' }, { status: 400 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url' || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your_supabase_anon_key') return NextResponse.json({ error: 'Login belum tersedia. Hubungi pengelola toko.' }, { status: 503 });
    const response = NextResponse.json(
      { success: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
    const supabase = createAuthClient(request, response);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      console.warn('[security] login gagal', { ip: clientIp(request), email: email.trim().toLowerCase().slice(0, 3) + '***' });
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }
    const result = await supabase.auth.getUser();
    let user = result.data?.user;
    if (!result.error && user && !isAdmin(user) && isConfiguredAdminEmail(user.email)) {
      try {
        const service = await createServiceClient();
        const appMetadata = { ...(user.app_metadata || {}), role: 'admin' };
        const promoted = await service.auth.admin.updateUserById(user.id, { app_metadata: appMetadata });
        if (!promoted.error) {
          user = { ...user, app_metadata: appMetadata };
          await supabase.auth.refreshSession();
          const refreshed = await supabase.auth.getUser();
          if (refreshed.data?.user && isAdmin(refreshed.data.user)) user = refreshed.data.user;
        }
      } catch {}
    }
    if (result.error || !isAdmin(user)) {
      const denied = NextResponse.json(
        { error: 'Akun ini belum memiliki akses admin. Pastikan email admin sudah terdaftar di BGY_ADMIN_EMAILS atau beri app_metadata.role=admin di Supabase.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
      const deniedSupabase = createAuthClient(request, denied);
      await deniedSupabase.auth.signOut();
      return denied;
    }
    return response;
  } catch { return NextResponse.json({ error: 'Login belum dapat diproses. Silakan coba lagi.' }, { status: 400 }); }
}
