import assert from 'node:assert/strict';
import test from 'node:test';

import { getVerificationResult } from './verificationResult.js';

test('accepts the current verification result values', () => {
  for (const value of ['success', 'expired', 'used', 'invalid']) {
    assert.equal(getVerificationResult({ verification: value }), value);
  }
});

test('maps the legacy verified query for one-release compatibility', () => {
  assert.equal(getVerificationResult({ verified: 'true' }), 'success');
  assert.equal(getVerificationResult({ verified: 'false' }), 'invalid');
});

test('rejects unknown verification query values', () => {
  assert.equal(getVerificationResult({ verification: 'other' }), '');
});
