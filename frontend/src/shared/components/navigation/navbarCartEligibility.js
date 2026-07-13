const PRIVILEGED_CART_ROLES = new Set(['STAFF', 'MANAGER', 'ADMIN']);

function normalizedRoles(user) {
  return [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
    .filter(Boolean)
    .map((value) => String(value).replace(/^ROLE_/, '').toUpperCase());
}

export function canShowUserCart(user, authLoading) {
  return !authLoading && !normalizedRoles(user).some((role) => PRIVILEGED_CART_ROLES.has(role));
}
