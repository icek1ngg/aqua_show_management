import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { setAccessToken, getAccessToken, clearAccessToken, getExpiresAt } from './authTokenStore.js';

describe('authTokenStore', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it('should store and retrieve access token and expiration in memory', () => {
    assert.equal(getAccessToken(), null);
    assert.equal(getExpiresAt(), null);

    setAccessToken('test-token', 123456);

    assert.equal(getAccessToken(), 'test-token');
    assert.equal(getExpiresAt(), 123456);
  });

  it('should clear access token and expiration', () => {
    setAccessToken('test-token', 123456);
    clearAccessToken();

    assert.equal(getAccessToken(), null);
    assert.equal(getExpiresAt(), null);
  });
});
