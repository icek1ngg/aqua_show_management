const ACCESS_TOKEN_KEY = 'accessToken';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';
const USER_KEY = 'user';
const TOKEN_UPDATED_EVENT = 'auth:token-updated';
const TOKEN_CLEARED_EVENT = 'auth:token-cleared';

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

export function storeUser(user) {
  if (!user) {
    window.localStorage.removeItem(USER_KEY);
    return;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  const savedUser = window.localStorage.getItem(USER_KEY) || window.sessionStorage.getItem(USER_KEY);
  if (!savedUser) {
    return null;
  }

  return safeParseJson(savedUser);
}

function removeStoredAuth() {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    storage.removeItem(USER_KEY);
  });
}

export function storeToken({ token, expiresAt = null, user = null }) {
  removeStoredAuth();

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);

  if (expiresAt) {
    window.localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
  }

  if (user) {
    storeUser(user);
  }

  window.dispatchEvent(new Event(TOKEN_UPDATED_EVENT));
}

export function clearStoredToken() {
  removeStoredAuth();

  window.dispatchEvent(new Event(TOKEN_CLEARED_EVENT));
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

    window.localStorage.setItem(ACCESS_TOKEN_KEY, sessionToken);
    if (sessionExpiresAt) {
      window.localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, sessionExpiresAt);
    }

    const sessionUser = window.sessionStorage.getItem(USER_KEY);
    if (sessionUser && !window.localStorage.getItem(USER_KEY)) {
      window.localStorage.setItem(USER_KEY, sessionUser);
    }

    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    window.sessionStorage.removeItem(USER_KEY);

    return { token: sessionToken, expiresAt: sessionExpiresAt ? Number(sessionExpiresAt) : null, storage: 'localStorage' };
  }

  return null;
}

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || window.sessionStorage.getItem(ACCESS_TOKEN_KEY) || null;
}
