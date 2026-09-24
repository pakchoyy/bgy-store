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
