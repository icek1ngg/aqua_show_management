import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const myTicketsSource = readFileSync(new URL('./MyTicketsPage.jsx', import.meta.url), 'utf8');

test('booking tickets page does not show redundant booking navigation actions', () => {
  assert.doesNotMatch(myTicketsSource, />\s*Booking Detail\s*</);
  assert.doesNotMatch(myTicketsSource, />\s*My Bookings\s*</);
});
