import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CART_STORAGE_VERSION,
  cartStorageKey,
  readCartForOwner,
  writeCartForOwner,
} from './cartStorage.js';

function memoryStorage() {
  return {
    values: new Map(),
    getItem(key) { return this.values.get(key) ?? null; },
    setItem(key, value) { this.values.set(key, String(value)); },
  };
}

test('cart v2 isolates users and discards malformed items', () => {
  const storage = memoryStorage();
  const validItem = {
    scheduleId: 'schedule-1', ticketType: 'STANDARD', quantity: 2,
    ages: { adult: 1, child: 1, senior: 0 }, unitPrice: 2000,
  };
  writeCartForOwner('user-a', [validItem], storage);

  assert.equal(JSON.parse(storage.getItem(cartStorageKey('user-a'))).version, CART_STORAGE_VERSION);
  assert.equal(readCartForOwner('user-a', storage).length, 1);
  assert.deepEqual(readCartForOwner('user-b', storage), []);

  storage.setItem(cartStorageKey('user-b'), JSON.stringify({
    version: CART_STORAGE_VERSION,
    owner: 'user-b',
    items: [{ scheduleId: '', ticketType: 'UNKNOWN', quantity: 2 }],
  }));
  assert.deepEqual(readCartForOwner('user-b', storage), []);
});
