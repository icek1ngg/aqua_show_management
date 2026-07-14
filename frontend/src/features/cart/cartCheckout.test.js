import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCheckoutPayload,
  removeCheckedKeysAfterSuccess,
  reviewCartLine,
  selectedCartTotals,
} from './cartCheckout.js';

const lines = [
  { key: 's1:STANDARD', scheduleId: 's1', ticketType: 'STANDARD', quantity: 2, unitPrice: 2500, checkoutAvailable: true },
  { key: 's2:VIP', scheduleId: 's2', ticketType: 'VIP', quantity: 1, unitPrice: 6250, checkoutAvailable: true },
  { key: 's3:FAMILY', scheduleId: 's3', ticketType: 'FAMILY', quantity: 3, unitPrice: 3750, checkoutAvailable: false },
];

test('checkout includes only checked and valid cart lines', () => {
  const payload = buildCheckoutPayload(lines, new Set(['s1:STANDARD', 's2:VIP', 's3:FAMILY']), 'request-123');
  assert.deepEqual(payload, {
    idempotencyKey: 'request-123',
    items: [
      { scheduleId: 's1', ticketType: 'STANDARD', quantity: 2 },
      { scheduleId: 's2', ticketType: 'VIP', quantity: 1 },
    ],
  });
});

test('selected totals use only checked and available lines', () => {
  assert.deepEqual(selectedCartTotals(lines, new Set(['s1:STANDARD', 's3:FAMILY'])), {
    lines: 1,
    tickets: 2,
    amount: 5000,
  });
});

test('authoritative price or availability changes require review', () => {
  const reviewed = reviewCartLine(
    { scheduleId: 's1', ticketType: 'STANDARD', quantity: 4, unitPrice: 2000 },
    { scheduleId: 's1', status: 'ACTIVE', standardPrice: 2500, standardAvailableTickets: 3 },
  );

  assert.equal(reviewed.unitPrice, 2500);
  assert.equal(reviewed.availableTickets, 3);
  assert.equal(reviewed.quantity, 3);
  assert.equal(reviewed.requiresReview, true);
  assert.equal(reviewed.checkoutAvailable, true);
});

test('missing inactive and sold-out schedules cannot be checked out', () => {
  assert.equal(reviewCartLine({ scheduleId: 's1', ticketType: 'VIP', quantity: 1 }, null).checkoutAvailable, false);
  assert.equal(reviewCartLine(
    { scheduleId: 's1', ticketType: 'VIP', quantity: 1 },
    { scheduleId: 's1', status: 'INACTIVE', vipPrice: 6250, vipAvailableTickets: 4 },
  ).checkoutAvailable, false);
  assert.equal(reviewCartLine(
    { scheduleId: 's1', ticketType: 'VIP', quantity: 1 },
    { scheduleId: 's1', status: 'ACTIVE', vipPrice: 6250, vipAvailableTickets: 0 },
  ).checkoutAvailable, false);
});

test('successful checkout removes only the selected keys', () => {
  assert.deepEqual(
    removeCheckedKeysAfterSuccess(new Set(['s1:STANDARD', 's2:VIP']), new Set(['s1:STANDARD'])),
    new Set(['s2:VIP']),
  );
});
