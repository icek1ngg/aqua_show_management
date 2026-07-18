let accessToken = null;
let expiresAt = null;

export function setAccessToken(token, nextExpiresAt) {
  accessToken = token;
  expiresAt = nextExpiresAt;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  expiresAt = null;
}

export function getExpiresAt() {
  return expiresAt;
}
