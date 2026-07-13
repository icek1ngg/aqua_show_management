import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CART_STORAGE_KEY,
  addCartItem,
  cartItemKey,
  cartTotalQuantity,
  readCart,
  removeCartItems,
  updateCartItemQuantity,
  writeCart,
} from './cartStorage.js';

function createStorage(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) {
    values.set(CART_STORAGE_KEY, initialValue);
  }

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    value(key = CART_STORAGE_KEY) {
      return values.get(key) ?? null;
    },
  };
}

test('merges the same schedule and ticket type', () => {
  const result = addCartItem([], { scheduleId: 's1', ticketType: 'VIP', quantity: 2 }, 10);
  const merged = addCartItem(result, { scheduleId: 's1', ticketType: 'vip', quantity: 3 }, 10);

  assert.deepEqual(merged, [{ scheduleId: 's1', ticketType: 'VIP', quantity: 5 }]);
});

test('keeps different types and schedules as separate lines', () => {
  const result = [
    { scheduleId: 's1', ticketType: 'STANDARD', quantity: 2 },
    { scheduleId: 's1', ticketType: 'VIP', quantity: 1 },
    { scheduleId: 's2', ticketType: 'STANDARD', quantity: 3 },
  ];

  assert.equal(cartTotalQuantity(result), 6);
});

test('returns an empty cart for malformed JSON and a storage version mismatch', () => {
  assert.deepEqual(readCart(createStorage('{not valid json')), []);
  assert.deepEqual(readCart(createStorage(JSON.stringify({ version: 2, items: [{ scheduleId: 's1' }] }))), []);
});

test('clamps added and updated quantities between one and the supplied maximum', () => {
  const original = [{ scheduleId: 's1', ticketType: 'STANDARD', quantity: 2 }];
  const added = addCartItem(original, { scheduleId: 's1', ticketType: 'standard', quantity: 20 }, 6);
  const lowered = updateCartItemQuantity(added, 's1:STANDARD', 0, 6);

  assert.equal(added[0].quantity, 6);
  assert.equal(lowered[0].quantity, 1);
  assert.notStrictEqual(added, original);
  assert.notStrictEqual(lowered, added);
});

test('removes every selected cart key without mutating the source', () => {
  const original = [
    { scheduleId: 's1', ticketType: 'STANDARD', quantity: 2 },
    { scheduleId: 's1', ticketType: 'VIP', quantity: 1 },
    { scheduleId: 's2', ticketType: 'FAMILY', quantity: 3 },
  ];
  const result = removeCartItems(original, new Set(['s1:STANDARD', 's2:FAMILY']));

  assert.deepEqual(result, [{ scheduleId: 's1', ticketType: 'VIP', quantity: 1 }]);
  assert.equal(original.length, 3);
});

test('preserves display snapshots while normalizing identifiers and changing quantity', () => {
  const item = {
    scheduleId: 's1',
    showId: 'show-1',
    ticketType: ' family ',
    quantity: 2,
    showTitle: 'Ocean Lights',
    imageUrl: '/ocean.jpg',
    venue: 'Aqua Arena',
    unitPrice: 2500,
  };
  const added = addCartItem([], item, 10);
  const updated = updateCartItemQuantity(added, cartItemKey(item), 4, 10);

  assert.deepEqual(updated[0], {
    ...item,
    ticketType: 'FAMILY',
    quantity: 4,
  });
});

test('writes and reads a versioned immutable cart snapshot', () => {
  const storage = createStorage();
  const items = [{ scheduleId: 's1', ticketType: 'VIP', quantity: 2, showTitle: 'Ocean Lights' }];

  writeCart(storage, items);
  const parsed = JSON.parse(storage.value());
  assert.deepEqual(parsed, { version: 1, items });
  assert.deepEqual(readCart(storage), items);
  assert.notStrictEqual(readCart(storage), items);
});
