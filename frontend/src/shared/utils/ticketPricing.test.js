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

test('does not invent a ticket price without a schedule Standard price', () => {
  assert.equal(getTicketTypePrice('STANDARD'), 0);
  assert.equal(getTicketTypePrice('VIP'), 0);
  assert.equal(getTicketTypePrice('FAMILY'), 0);
});
