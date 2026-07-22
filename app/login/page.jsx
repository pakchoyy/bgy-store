'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ERROR_MAP = {
  'Invalid login credentials': 'Email atau password salah.',
  'Email not confirmed': 'Email belum dikonfirmasi. Periksa inbox email Anda.',
  'Email link is invalid or has expired': 'Link login tidak valid atau sudah kedaluwarsa.',
  'Rate limit exceeded': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      try {
        const { createClient } = await import('@/lib/supabase-browser');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          router.replace('/admin');
          return;
        }
      } catch (e) {
        console.log('Session check skipped (no Supabase):', e.message);
      }
      if (mounted) setChecking(false);
    }
    checkSession();
    return () => { mounted = false; };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { createClient } = await import('@/lib/supabase-browser');
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error('Login error:', authError.message);
        setError(ERROR_MAP[authError.message] || authError.message);
        setLoading(false);
        return;
      }

      console.log('Login success, session:', !!data?.session);

      // Verify session is stored before redirect
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session confirmed, redirecting...');
        router.replace('/admin');
      } else {
        console.log('Session not yet available, waiting...');
        // Retry a few times
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 300));
          const { data: { session: s } } = await supabase.auth.getSession();
          if (s) {
            console.log('Session confirmed after retry, redirecting...');
            router.replace('/admin');
            return;
          }
        }
        setError('Gagal menyimpan sesi. Silakan coba lagi.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-extrabold text-xl">BGY</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Bantu Guru Yuk</h1>
          <p className="text-sm text-white/70 mt-1">Masuk ke dashboard admin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bantuguruyuk.web.id"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a0] focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a0] focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white font-bold py-2.5 rounded-xl hover:shadow-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-xs text-white/50 text-center mt-6">
          Hanya untuk admin Bantu Guru Yuk
        </p>
      </div>
    </div>
  );
}
