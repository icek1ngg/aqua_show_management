import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKOUT_QUANTITY_ERROR,
  MAX_CHECKOUT_TICKETS,
  checkoutTotalQuantity,
  isCheckoutQuantityAllowed,
} from './checkoutPolicy.js';

describe('checkout quantity policy', () => {
  it('allows up to ten tickets across all shows and passenger types', () => {
    const items = [
      { quantity: 4, passengerType: 'ADULT' },
      { quantity: 3, passengerType: 'CHILD' },
      { quantity: 3, passengerType: 'SENIOR' },
    ];

    assert.equal(checkoutTotalQuantity(items), MAX_CHECKOUT_TICKETS);
    assert.equal(isCheckoutQuantityAllowed(items), true);
  });

  it('rejects a combined checkout above ten tickets', () => {
    assert.equal(isCheckoutQuantityAllowed([{ quantity: 6 }, { quantity: 5 }]), false);
    assert.equal(isCheckoutQuantityAllowed([{ quantity: 1.5 }, { quantity: 1.5 }]), false);
    assert.match(CHECKOUT_QUANTITY_ERROR, /at most 10 tickets/i);
  });
});
