'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { createClient } = await import('@/lib/supabase-browser');
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email atau password salah');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card-lg p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#0ea5a0]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-[#0ea5a0] font-extrabold text-lg">BGY</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Masuk ke Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Bantu Guru Yuk</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bantuguruyuk.web.id"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[var(--input-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a0] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[var(--input-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a0] focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white font-semibold py-2.5 rounded-xl hover:shadow-md hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Hanya untuk admin Bantu Guru Yuk
        </p>
      </div>
    </div>
  );
}
