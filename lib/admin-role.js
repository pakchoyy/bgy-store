export function isAdmin(user) {
  return !!user?.id && user.app_metadata?.role === 'admin';
}

export function isConfiguredAdminEmail(email) {
  if (typeof email !== 'string' || !email.trim()) return false;
  const configured = process.env.BGY_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '';
  return configured
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
}
