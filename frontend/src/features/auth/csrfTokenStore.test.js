import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  clearCsrfToken,
  getCsrfToken,
  isCsrfProtectedRequest,
  setCsrfToken,
} from './csrfTokenStore.js';

describe('csrfTokenStore', () => {
  beforeEach(() => clearCsrfToken());

  it('keeps the CSRF token in module memory', () => {
    setCsrfToken('csrf-value');
    assert.equal(getCsrfToken(), 'csrf-value');
    clearCsrfToken();
    assert.equal(getCsrfToken(), null);
  });

  it('identifies only cookie-auth endpoints as CSRF protected', () => {
    assert.equal(isCsrfProtectedRequest('/auth/refresh', 'post'), true);
    assert.equal(isCsrfProtectedRequest('/auth/logout', 'POST'), true);
    assert.equal(isCsrfProtectedRequest('/auth/oauth2/complete', 'post'), true);
    assert.equal(isCsrfProtectedRequest('/auth/login', 'post'), false);
    assert.equal(isCsrfProtectedRequest('/auth/refresh', 'get'), false);
  });
});
