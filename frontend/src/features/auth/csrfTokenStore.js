let csrfToken = null;

const PROTECTED_PATHS = new Set([
  '/auth/refresh',
  '/auth/logout',
  '/auth/oauth2/complete',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/oauth2/complete',
]);

export function getCsrfToken() {
  return csrfToken;
}

export function setCsrfToken(token) {
  csrfToken = typeof token === 'string' && token ? token : null;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export function isCsrfProtectedRequest(url, method) {
  if (String(method || 'get').toLowerCase() !== 'post' || typeof url !== 'string') {
    return false;
  }

  const path = url.split('?')[0];
  return PROTECTED_PATHS.has(path);
}
