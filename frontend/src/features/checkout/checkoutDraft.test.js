import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKOUT_DRAFT_TTL_MS,
  clearCheckoutDraft,
  getCheckoutDraft,
  revalidateCheckoutDraft,
  saveCheckoutDraft,
} from './checkoutDraft.js';

const scheduleId = '123e4567-e89b-42d3-a456-426614174000';

const validDraft = () => ({
  idempotencyKey: ' checkout-key ',
  cartKeys: [`${scheduleId}:STANDARD`],
  items: [{
    scheduleId: ` ${scheduleId} `,
    ticketType: 'standard',
    quantity: 2,
    expectedUnitPrice: 100_000,
    displaySnapshot: { showTitle: 'Dolphins', ignored: 'do not persist' },
    ignored: 'do not persist',
  }],
});

describe('checkoutDraft', () => {
  beforeEach(() => {
    globalThis.sessionStorage = {
      store: {},
      getItem(key) { return this.store[key] ?? null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; },
    };
    mock.timers.enable({ apis: ['Date'] });
    mock.timers.setTime(Date.parse('2026-07-17T00:00:00Z'));
  });

  afterEach(() => {
    mock.timers.reset();
    delete globalThis.sessionStorage;
  });

  it('stores only normalized fields with a 30-minute lifetime', () => {
    const saved = saveCheckoutDraft(validDraft());
    const retrieved = getCheckoutDraft();

    assert.equal(saved.expiresAt - saved.createdAt, CHECKOUT_DRAFT_TTL_MS);
    assert.equal(retrieved.idempotencyKey, 'checkout-key');
    assert.deepEqual(retrieved.cartKeys, [`${scheduleId}:STANDARD`]);
    assert.deepEqual(retrieved.items, [{
      scheduleId,
      ticketType: 'STANDARD',
      quantity: 2,
      expectedUnitPrice: 100_000,
      displaySnapshot: { showTitle: 'Dolphins' },
    }]);
  });

  it('rejects invalid input instead of persisting it', () => {
    for (const draft of [
      { ...validDraft(), idempotencyKey: ' ' },
      { ...validDraft(), cartKeys: [] },
      { ...validDraft(), items: [] },
      { ...validDraft(), items: [{ ...validDraft().items[0], scheduleId: '' }] },
      { ...validDraft(), items: [{ ...validDraft().items[0], scheduleId: 'not-a-uuid' }] },
      { ...validDraft(), items: [{ ...validDraft().items[0], ticketType: '?' }] },
      { ...validDraft(), items: [{ ...validDraft().items[0], ticketType: 'ADULT' }] },
      { ...validDraft(), items: [{ ...validDraft().items[0], quantity: 0 }] },
      { ...validDraft(), items: [{ ...validDraft().items[0], quantity: 1.5 }] },
      { ...validDraft(), items: [{ ...validDraft().items[0], expectedUnitPrice: -1 }] },
      { ...validDraft(), items: [{ ...validDraft().items[0], expectedUnitPrice: Number.NaN }] },
      { ...validDraft(), items: [{ ...validDraft().items[0], expectedUnitPrice: null }] },
      { ...validDraft(), items: [validDraft().items[0], validDraft().items[0]] },
      { ...validDraft(), cartKeys: ['unrelated:key'] },
    ]) {
      assert.throws(() => saveCheckoutDraft(draft), /checkout draft/i);
      assert.equal(sessionStorage.getItem('aqua_pulse_checkout_draft'), null);
    }
  });

  it('clears malformed, incomplete, and inconsistent stored drafts', () => {
    const now = Date.now();
    const base = {
      version: 1,
      ...validDraft(),
      idempotencyKey: 'checkout-key',
      createdAt: now,
      expiresAt: now + CHECKOUT_DRAFT_TTL_MS,
    };
    const invalidValues = [
      '{bad json',
      JSON.stringify({ ...base, cartKeys: [] }),
      JSON.stringify({ ...base, items: [] }),
      JSON.stringify({ ...base, createdAt: 'today' }),
      JSON.stringify({ ...base, expiresAt: now - 1 }),
      JSON.stringify({ ...base, expiresAt: now + CHECKOUT_DRAFT_TTL_MS + 1 }),
      JSON.stringify({ ...base, createdAt: now + 1, expiresAt: now + CHECKOUT_DRAFT_TTL_MS + 1 }),
    ];

    for (const value of invalidValues) {
      sessionStorage.setItem('aqua_pulse_checkout_draft', value);
      assert.equal(getCheckoutDraft(), null);
      assert.equal(sessionStorage.getItem('aqua_pulse_checkout_draft'), null);
    }
  });

  it('clears a draft at or beyond its 30-minute expiry', () => {
    const activeDraft = saveCheckoutDraft(validDraft());
    mock.timers.tick(CHECKOUT_DRAFT_TTL_MS);
    assert.equal(revalidateCheckoutDraft(activeDraft), null);
    assert.equal(sessionStorage.getItem('aqua_pulse_checkout_draft'), null);
  });

  it('clears storage safely when storage access fails', () => {
    sessionStorage.getItem = () => { throw new Error('blocked'); };
    assert.equal(getCheckoutDraft(), null);
    assert.doesNotThrow(() => clearCheckoutDraft());
  });
});
