import test from 'node:test';
import assert from 'node:assert/strict';

import { getRoutedPaymentSession } from './paymentSessionState.js';

const bookingId = '0f443cca-cf6a-4aa2-ad95-82dc81a1cc33';

function paymentSession(overrides = {}) {
  return {
    bookingId,
    paymentId: 'bc6a24c7-1405-4141-9194-3b953357bc5f',
    payosOrderCode: '1721234567890',
    checkoutUrl: 'https://pay.payos.vn/web/checkout/abc',
    qrCode: 'qr-payload',
    amount: 250000,
    status: 'PENDING',
    ...overrides,
  };
}

test('hydrates the exact payment session supplied by checkout', () => {
  const session = paymentSession();

  assert.deepEqual(getRoutedPaymentSession({ paymentSession: session }, bookingId), session);
});

test('rejects a whole checkout response wrapped as a payment session', () => {
  const checkoutResponse = {
    bookingId,
    bookingStatus: 'PENDING_PAYMENT',
    payment: paymentSession(),
  };

  assert.equal(getRoutedPaymentSession({ paymentSession: checkoutResponse }, bookingId), null);
});

test('returns null for reload state and sessions belonging to another booking', () => {
  assert.equal(getRoutedPaymentSession(undefined, bookingId), null);
  assert.equal(
    getRoutedPaymentSession(
      { paymentSession: paymentSession({ bookingId: '2116fd95-b6ec-4b2e-ad77-d40bf92db9b0' }) },
      bookingId,
    ),
    null,
  );
});

test('rejects incomplete payment-shaped objects', () => {
  assert.equal(
    getRoutedPaymentSession({ paymentSession: { bookingId, status: 'PENDING' } }, bookingId),
    null,
  );
});
