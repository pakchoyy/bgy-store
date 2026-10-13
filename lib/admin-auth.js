import { isAdmin } from './admin-role';

export async function getAdminUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return isAdmin(user) ? user : null;
}

export async function requireAdmin(supabase) {
  const user = await getAdminUser(supabase);
  if (!user) {
    return {
      user: null,
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, error: null };
}

// Untuk Server Action admin: tolak (redirect ke login) bila bukan admin. Deny by default.
export async function assertAdminAction() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url') return
  const { createClient } = await import('./supabase-server')
  const { redirect } = await import('next/navigation')
  const supabase = await createClient()
  if (!(await getAdminUser(supabase))) {
    console.warn('[security] server action ditolak: bukan admin')
    redirect('/login')
  }
}
