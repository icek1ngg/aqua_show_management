import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, getTicketTypePrice } from './ticketPricing.js';

test('formats VND with periods and a VND suffix', () => {
  assert.equal(formatCurrency(1250000), '1.250.000 VND');
});

test('derives ticket prices from the schedule Standard price', () => {
  assert.equal(getTicketTypePrice(2500, 'STANDARD'), 2500);
  assert.equal(getTicketTypePrice(2500, 'VIP'), 6250);
  assert.equal(getTicketTypePrice(2500, 'FAMILY'), 3750);
});

test('temporarily preserves legacy one-argument booking preview prices', () => {
  assert.equal(getTicketTypePrice('STANDARD'), 2000);
  assert.equal(getTicketTypePrice('VIP'), 5000);
  assert.equal(getTicketTypePrice('FAMILY'), 3000);
});
