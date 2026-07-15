function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeBase64Url(value) {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return typeof atob !== 'undefined' ? atob(padded) : Buffer.from(padded, 'base64').toString('binary');
  } catch {
    return null;
  }
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string' || token.split('.').length < 2) {
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
