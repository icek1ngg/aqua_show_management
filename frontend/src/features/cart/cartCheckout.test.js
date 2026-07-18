import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  canAddCartLineToSelection,
  selectCartLinesWithinLimit,
  selectedCartTotals,
} from './cartCheckout.js';

const lines = [
  { key: 'schedule-1:STANDARD', checkoutAvailable: true, quantity: 6, unitPrice: 100 },
  { key: 'schedule-2:VIP', checkoutAvailable: true, quantity: 5, unitPrice: 200 },
  { key: 'schedule-3:FAMILY', checkoutAvailable: true, quantity: 4, unitPrice: 300 },
];

describe('cart checkout selection limit', () => {
  it('auto-selects only lines that fit within the ten-ticket booking limit', () => {
    const selected = selectCartLinesWithinLimit(lines);

    assert.deepEqual([...selected], ['schedule-1:STANDARD', 'schedule-3:FAMILY']);
    assert.equal(selectedCartTotals(lines, selected).tickets, 10);
  });

  it('prevents selecting a line that would take the booking over ten tickets', () => {
    const selected = new Set(['schedule-1:STANDARD']);

    assert.equal(canAddCartLineToSelection(lines, selected, 'schedule-2:VIP'), false);
    assert.equal(canAddCartLineToSelection(lines, selected, 'schedule-3:FAMILY'), true);
  });
});
