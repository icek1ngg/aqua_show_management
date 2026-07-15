import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthErrorCode, shouldOfferVerificationResend } from './authError.js';

test('reads the stable auth error code from the API response', () => {
  const error = { response: { data: { code: 'EMAIL_VERIFICATION_REQUIRED' } } };
  assert.equal(getAuthErrorCode(error), 'EMAIL_VERIFICATION_REQUIRED');
});

test('offers resend only for email verification required', () => {
  assert.equal(shouldOfferVerificationResend({ code: 'EMAIL_VERIFICATION_REQUIRED' }), true);
  assert.equal(shouldOfferVerificationResend({ code: 'INVALID_CREDENTIALS' }), false);
  assert.equal(shouldOfferVerificationResend(new Error('Please verify your email before signing in.')), false);
});
