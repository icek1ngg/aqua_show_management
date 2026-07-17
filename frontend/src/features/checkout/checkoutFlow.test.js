import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyAuthoritativeReview,
  beginCheckoutSubmission,
  classifyCheckoutError,
  confirmCheckoutReview,
  finishCheckoutSubmission,
  purchasedCartKeys,
} from './checkoutFlow.js';

const scheduleOne = '123e4567-e89b-42d3-a456-426614174000';
const scheduleTwo = '223e4567-e89b-42d3-a456-426614174001';
const draft = {
  idempotencyKey: 'old-key',
  cartKeys: [`${scheduleOne}:STANDARD`, `${scheduleTwo}:VIP`, 'unrelated:key'],
  items: [
    { scheduleId: scheduleOne, ticketType: 'STANDARD', quantity: 2, expectedUnitPrice: 100 },
    { scheduleId: scheduleTwo, ticketType: 'VIP', quantity: 1, expectedUnitPrice: 200 },
  ],
};

describe('checkout conflict decisions', () => {
  it('distinguishes every backend conflict code and preserves review data', () => {
    const error = (code, data) => ({ response: { status: 409, data: { code, data, message: 'backend message' } } });
    assert.deepEqual(classifyCheckoutError(error('CHECKOUT_REVIEW_REQUIRED', { items: [1] })), {
      kind: 'review', data: { items: [1] }, message: 'backend message',
    });
    assert.equal(classifyCheckoutError(error('CHECKOUT_IN_PROGRESS')).kind, 'inProgress');
    assert.equal(classifyCheckoutError(error('IDEMPOTENCY_KEY_REUSED')).kind, 'idempotencyReused');
    assert.equal(classifyCheckoutError({ response: { status: 409, data: {} } }).kind, 'other');
    assert.equal(classifyCheckoutError({ response: { status: 500 } }).kind, 'other');
  });

  it('merges authoritative changed lines without trusting stale price or availability', () => {
    const lines = applyAuthoritativeReview(draft, { items: [{
      scheduleId: scheduleOne, ticketType: 'STANDARD', requestedQuantity: 2,
      availableQuantity: 1, expectedUnitPrice: 100, currentUnitPrice: 125,
    }] });

    assert.deepEqual(lines[0], {
      ...draft.items[0], currentAvailable: 1, currentUnitPrice: 125,
      priceChanged: true, noStock: true, authoritative: true, invalid: false,
    });
    assert.deepEqual(lines[1], draft.items[1]);
  });

  it('rotates the key and keeps only accepted cart keys when review is confirmed', () => {
    const lines = applyAuthoritativeReview(draft, { items: [
      { scheduleId: scheduleOne, ticketType: 'STANDARD', requestedQuantity: 2, availableQuantity: 1, expectedUnitPrice: 100, currentUnitPrice: 125 },
      { scheduleId: scheduleTwo, ticketType: 'VIP', requestedQuantity: 1, availableQuantity: 0, expectedUnitPrice: 200, currentUnitPrice: 200 },
    ] });
    const next = confirmCheckoutReview(draft, lines, 'new-key');

    assert.equal(next.idempotencyKey, 'new-key');
    assert.deepEqual(next.items, [{ scheduleId: scheduleOne, ticketType: 'STANDARD', passengerType: 'ADULT', quantity: 1, expectedUnitPrice: 125 }]);
    assert.deepEqual(next.cartKeys, [`${scheduleOne}:STANDARD`]);
  });

  it('selectively removes only cart keys represented by purchased items', () => {
    assert.deepEqual(purchasedCartKeys(draft.items.slice(0, 1)), [`${scheduleOne}:STANDARD`]);
  });

  it('synchronously rejects a second submission until the first one finishes', () => {
    const latch = { current: false };
    assert.equal(beginCheckoutSubmission(latch), true);
    assert.equal(beginCheckoutSubmission(latch), false);
    finishCheckoutSubmission(latch);
    assert.equal(beginCheckoutSubmission(latch), true);
  });
});
