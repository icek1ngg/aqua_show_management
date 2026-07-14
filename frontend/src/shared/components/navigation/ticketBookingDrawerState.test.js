import test from 'node:test';
import assert from 'node:assert/strict';

import {
  changeDrawerDate,
  changeDrawerShow,
  createDrawerSelection,
  drawerDestination,
} from './ticketBookingDrawerState.js';

test('changing show clears the dependent selected date', () => {
  const selected = { showId: 'show-1', date: '2026-07-17' };
  assert.deepEqual(changeDrawerShow(selected, 'show-2'), { showId: 'show-2', date: '' });
});

test('date selection accepts only a date offered for the selected show', () => {
  const state = { showId: 'show-1', date: '' };
  assert.deepEqual(
    changeDrawerDate(state, '2026-07-17', ['2026-07-17']),
    { showId: 'show-1', date: '2026-07-17' },
  );
  assert.deepEqual(changeDrawerDate(state, '2026-07-18', ['2026-07-17']), state);
});

test('destination requires both show and date', () => {
  assert.equal(drawerDestination(createDrawerSelection()), null);
  assert.equal(drawerDestination({ showId: 'show-1', date: '' }), null);
  assert.equal(
    drawerDestination({ showId: 'show-1', date: '2026-07-17' }),
    '/shows/show-1?date=2026-07-17#ticket-workspace',
  );
});
