import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('OAuth Consent Contract', () => {
  it('defines the required shape for onboarding request', () => {
    const payload = {
      code: 'some-32-byte-base64-string',
      acceptedTerms: true,
      legalDocumentVersion: '2026-07-15'
    };

    assert.strictEqual(typeof payload.code, 'string');
    assert.strictEqual(typeof payload.acceptedTerms, 'boolean');
    assert.strictEqual(payload.legalDocumentVersion, '2026-07-15');
  });

  it('rejects missing or false acceptedTerms in contract', () => {
    const isPayloadValid = (payload) => {
      if (!payload.code || typeof payload.code !== 'string') return false;
      if (payload.acceptedTerms !== true) return false;
      if (payload.legalDocumentVersion !== '2026-07-15') return false;
      return true;
    };

    assert.strictEqual(isPayloadValid({
      code: 'code123',
      acceptedTerms: false,
      legalDocumentVersion: '2026-07-15'
    }), false);

    assert.strictEqual(isPayloadValid({
      code: 'code123',
      legalDocumentVersion: '2026-07-15'
    }), false);

    assert.strictEqual(isPayloadValid({
      code: 'code123',
      acceptedTerms: true,
      legalDocumentVersion: '2026-07-15'
    }), true);
  });
});
