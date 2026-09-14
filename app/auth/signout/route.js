import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseUrl !== 'your_supabase_url' &&
    supabaseKey &&
    supabaseKey !== 'your_supabase_anon_key'
  ) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { ...options, path: '/' });
          });
        },
      },
    });

    await supabase.auth.signOut();
  }

  return response;
}
