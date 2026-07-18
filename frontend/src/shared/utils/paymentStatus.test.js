import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeBookingPaymentStatus } from './paymentStatus.js';

test('captured payment awaiting inventory is not presented as a paid booking', () => {
  const result = normalizeBookingPaymentStatus({
    status: 'PROCESSING',
    payment: { status: 'SUCCESS' },
  });

  assert.equal(result.status, 'PROCESSING');
  assert.equal(result.bookingStatus, 'PROCESSING');
  assert.equal(result.paymentStatus, 'SUCCESS');
  assert.equal(result.label, 'Payment received, processing');
});

test('booking is presented as paid only after inventory commit changes it to PAID', () => {
  const result = normalizeBookingPaymentStatus({
    status: 'PAID',
    payment: { status: 'SUCCESS' },
  });

  assert.equal(result.status, 'PAID');
});
