import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const checkoutSource = fs.readFileSync(new URL('../checkout/CheckoutPaymentPage.jsx', import.meta.url), 'utf8');
const paymentSource = fs.readFileSync(new URL('./PaymentPage.jsx', import.meta.url), 'utf8');

test('checkout passes only the nested payment response to the payment route', () => {
  assert.match(checkoutSource, /state:\s*\{\s*paymentSession:\s*response\.payment\s*\}/);
  assert.doesNotMatch(checkoutSource, /paymentSession:\s*response\s*\}/);
});

test('payment page hydrates route state while retaining the reload create-payment fallback', () => {
  assert.match(paymentSource, /getRoutedPaymentSession\(location\.state,\s*bookingId\)/);
  assert.match(paymentSource, /useState\(\(\)\s*=>\s*routedPaymentSession\)/);
  assert.match(paymentSource, /await createPayment\(bookingId\)/);
  assert.match(paymentSource, /disabled=\{!canPay \|\| submitting \|\| Boolean\(paymentSession\)\}/);
});
