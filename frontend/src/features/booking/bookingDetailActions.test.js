import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bookingDetailSource = readFileSync(new URL('./BookingDetailPage.jsx', import.meta.url), 'utf8');
const navbarSource = readFileSync(
  new URL('../../shared/components/navigation/Navbar.jsx', import.meta.url),
  'utf8',
);

test('booking detail removes Back Home and styles View Tickets like the cart payment action', () => {
  assert.doesNotMatch(
    bookingDetailSource,
    /border-2 border-cyan-100 bg-cyan-50[\s\S]{0,400}Back Home/,
  );
  assert.match(
    bookingDetailSource,
    /bg-gradient-to-r from-orange-500 to-orange-600[^"']*shadow-orange-200[\s\S]{0,400}View Tickets/,
  );
  assert.doesNotMatch(bookingDetailSource, /bg-emerald-600[^"']*[\s\S]{0,400}View Tickets/);
});

test('avatar menus expose My Tickets on desktop and mobile', () => {
  assert.equal((navbarSource.match(/to="\/my-tickets"/g) || []).length, 2);
  assert.equal((navbarSource.match(/My Tickets/g) || []).length, 2);
});
