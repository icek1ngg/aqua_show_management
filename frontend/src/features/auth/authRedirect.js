function normalizeRole(role) {
  return String(role || '').replace(/^ROLE_/, '').toUpperCase();
}

export function getPrimaryUserRole(user) {
  const roles = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
    .map(normalizeRole)
    .filter(Boolean);

  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('MANAGER')) return 'MANAGER';
  if (roles.includes('STAFF')) return 'STAFF';
  if (roles.includes('USER')) return 'USER';

  return roles[0] || 'USER';
}

export function getRedirectPathByRole(role) {
  switch (normalizeRole(role)) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'STAFF':
      return '/staff/check-in';
    case 'USER':
    default:
      return '/';
  }
}

export function getRedirectPathAfterLogin(user, returnUrl) {
  const role = getPrimaryUserRole(user);
  if (role === 'STAFF') {
    return getRedirectPathByRole(role);
  }

  if (returnUrl && !returnUrl.startsWith('/login')) {
    return returnUrl;
  }

  return getRedirectPathByRole(role);
}
