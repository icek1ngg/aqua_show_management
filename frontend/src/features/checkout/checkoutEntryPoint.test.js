import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const createBookingPage = fs.readFileSync(new URL('../booking/CreateBookingPage.jsx', import.meta.url), 'utf8');
const checkoutPaymentPage = fs.readFileSync(new URL('./CheckoutPaymentPage.jsx', import.meta.url), 'utf8');
const bookingService = fs.readFileSync(new URL('../../services/bookingService.js', import.meta.url), 'utf8');
const checkoutService = fs.readFileSync(new URL('../../services/checkoutService.js', import.meta.url), 'utf8');

test('the frontend creates booking and payment only through checkout start-payment', () => {
  assert.doesNotMatch(createBookingPage, /createBooking|buildCheckoutPayload/);
  assert.doesNotMatch(bookingService, /post\(['"]\/bookings['"]/);
  assert.match(checkoutService, /post\(['"]\/checkout\/start-payment['"]/);
});

test('authoritative review is checked against the whole-booking quantity policy', () => {
  assert.match(checkoutPaymentPage, /isCheckoutQuantityAllowed\(reviewedDraft\.items\)/);
});
