import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { decodeJwtPayload, getTokenExpiresAt } from './jwtPayload.js';

describe('jwtPayload', () => {
  it('should decode a valid JWT token payload', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.dummy';
    const payload = decodeJwtPayload(token);
    assert.deepEqual(payload, {
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
    });
  });

  it('should return null for invalid token', () => {
    assert.equal(decodeJwtPayload('invalid'), null);
    assert.equal(decodeJwtPayload(null), null);
    assert.equal(decodeJwtPayload(undefined), null);
  });

  it('should calculate expiration from exp claim', () => {
    const token = 'dummy.eyJleHAiOjE2MDAwMDAwMDB9.dummy';
    assert.equal(getTokenExpiresAt(token), 1600000000000);
  });

  it('should calculate expiration from explicitExpiresAt', () => {
    assert.equal(getTokenExpiresAt('dummy', 1600000000000), 1600000000000);
  });

  it('should calculate expiration from expiresIn', () => {
    const now = Date.now();
    const result = getTokenExpiresAt('dummy', null, 3600);
    assert.ok(result >= now + 3590000);
    assert.ok(result <= now + 3610000);
  });
});
