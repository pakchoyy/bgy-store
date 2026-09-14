export function isAdmin(user) {
  return !!user?.id && user.app_metadata?.role === 'admin';
}
