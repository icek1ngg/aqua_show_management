import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import * as paymentSessionState from './paymentSessionState.js';
import * as ticketPricing from '../../shared/utils/ticketPricing.js';

const paymentPageSource = readFileSync(new URL('./PaymentPage.jsx', import.meta.url), 'utf8');
const paymentResultSource = readFileSync(new URL('./PaymentResultPage.jsx', import.meta.url), 'utf8');

test('payment summary shows only the total ticket count for mixed ticket types', () => {
  assert.equal(typeof ticketPricing.formatTicketCount, 'function');
  assert.equal(ticketPricing.formatTicketCount?.(3), '3 tickets');
  assert.equal(ticketPricing.formatTicketCount?.(1), '1 ticket');
  assert.match(paymentPageSource, /formatTicketCount\(booking\.quantity\)/);
  assert.doesNotMatch(paymentPageSource, /booking\.quantity\}\s*\$\{booking\.ticketType/);
});

test('payment polling survives lost route state and reconciles PayOS before reloading booking', async () => {
  assert.equal(typeof paymentSessionState.shouldPollPayment, 'function');
  assert.equal(typeof paymentSessionState.pollPaymentOnce, 'function');

  const pendingBookingAfterReload = {
    status: 'PENDING_PAYMENT',
    payment: { status: 'PENDING' },
  };
  assert.equal(paymentSessionState.shouldPollPayment?.(pendingBookingAfterReload, null), true);
  assert.equal(paymentSessionState.shouldPollPayment?.({ status: 'PAID', payment: { status: 'SUCCESS' } }, null), false);

  const calls = [];
  const booking = await paymentSessionState.pollPaymentOnce?.({
    bookingId: 'booking-123',
    reconcile: async (bookingId) => calls.push(`reconcile:${bookingId}`),
    loadBooking: async () => {
      calls.push('load-booking');
      return { status: 'PAID' };
    },
  });

  assert.deepEqual(calls, ['reconcile:booking-123', 'load-booking']);
  assert.deepEqual(booking, { status: 'PAID' });
  assert.match(paymentPageSource, /pollPaymentOnce\(/);
});

test('payment polling still reloads PostgreSQL when PayOS reconciliation is temporarily unavailable', async () => {
  assert.equal(typeof paymentSessionState.pollPaymentOnce, 'function');

  let bookingLoads = 0;
  const booking = await paymentSessionState.pollPaymentOnce?.({
    bookingId: 'booking-123',
    reconcile: async () => {
      throw new Error('PayOS unavailable');
    },
    loadBooking: async () => {
      bookingLoads += 1;
      return { status: 'PENDING_PAYMENT' };
    },
  });

  assert.equal(bookingLoads, 1);
  assert.deepEqual(booking, { status: 'PENDING_PAYMENT' });
});

test('payment success popup clips decorative horizontal overflow while retaining vertical scrolling', () => {
  assert.match(
    paymentResultSource,
    /max-h-\[92vh\][^"']*overflow-x-hidden[^"']*overflow-y-auto/,
  );
});
