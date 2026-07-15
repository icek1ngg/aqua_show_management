import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRegistrationPayload,
  LEGAL_DOCUMENT_VERSION,
  REGISTRATION_LIMITS,
} from './registrationForm.js';

test('keeps frontend registration limits aligned with the backend contract', () => {
  assert.deepEqual(REGISTRATION_LIMITS, {
    lastName: 100,
    firstMiddleName: 150,
    email: 150,
    phoneNumber: 11,
    password: 100,
  });
});

test('builds the explicit registration contract', () => {
  assert.equal(LEGAL_DOCUMENT_VERSION, '2026-07-15');
  assert.deepEqual(buildRegistrationPayload({
    lastName: ' Nguyen ',
    firstMiddleName: ' Van A ',
    email: ' USER@example.com ',
    phoneNumber: '0123456789',
    password: 'abc123',
    acceptedTerms: true,
  }), {
    lastName: 'Nguyen',
    firstMiddleName: 'Van A',
    email: 'USER@example.com',
    phoneNumber: '0123456789',
    password: 'abc123',
    acceptedTerms: true,
    legalDocumentVersion: '2026-07-15',
  });
});
