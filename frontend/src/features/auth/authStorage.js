const ACCESS_TOKEN_KEY = 'accessToken';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';

function getStorage(rememberMe) {
  return rememberMe ? window.localStorage : window.sessionStorage;
}

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return window.atob(padded);
}

export function decodeJwtPayload(token) {
  if (!token || token.split('.').length < 2) {
    return null;
  }

  try {
    return safeParseJson(decodeBase64Url(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function getTokenExpiresAt(token, explicitExpiresAt, expiresIn) {
  if (explicitExpiresAt) {
    const timestamp = typeof explicitExpiresAt === 'number' ? explicitExpiresAt : Date.parse(explicitExpiresAt);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  if (expiresIn) {
    const seconds = Number(expiresIn);
    return Number.isNaN(seconds) ? null : Date.now() + seconds * 1000;
  }

  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
}

export function isTokenExpired(expiresAt) {
  return Boolean(expiresAt && Number(expiresAt) <= Date.now());
}

export function storeToken({ token, rememberMe = false, expiresAt = null }) {
  clearStoredToken();

  const storage = getStorage(rememberMe);
  storage.setItem(ACCESS_TOKEN_KEY, token);

  if (expiresAt) {
    storage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
  }
}

export function clearStoredToken() {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  });

  window.dispatchEvent(new Event('auth:token-cleared'));
}

export function getStoredToken() {
  const localToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const localExpiresAt = window.localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);

  if (localToken) {
    if (isTokenExpired(localExpiresAt)) {
      clearStoredToken();
      return null;
    }

    return { token: localToken, expiresAt: localExpiresAt ? Number(localExpiresAt) : null, storage: 'localStorage' };
  }

  const sessionToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const sessionExpiresAt = window.sessionStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);

  if (sessionToken) {
    if (isTokenExpired(sessionExpiresAt)) {
      clearStoredToken();
      return null;
    }

    return { token: sessionToken, expiresAt: sessionExpiresAt ? Number(sessionExpiresAt) : null, storage: 'sessionStorage' };
  }

  return null;
}

export function getAccessToken() {
  return getStoredToken()?.token || null;
}
