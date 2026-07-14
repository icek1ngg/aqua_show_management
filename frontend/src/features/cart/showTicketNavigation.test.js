import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SHOW_CATALOG_TARGET,
  SHOWS_ROUTE_REDIRECT,
  isDateKey,
  showTicketTarget,
} from './showTicketNavigation.js';

test('generic booking actions return to the Home show catalog', () => {
  assert.equal(SHOWS_ROUTE_REDIRECT, '/');
  assert.equal(SHOW_CATALOG_TARGET, '/#shows');
  assert.equal(showTicketTarget(), '/#shows');
});

test('show-specific booking actions target the detail ticket workspace', () => {
  assert.equal(
    showTicketTarget({ showId: 'show 1' }),
    '/shows/show%201#ticket-workspace',
  );
});

test('a valid selected date is persisted in the detail URL', () => {
  assert.equal(
    showTicketTarget({ showId: 'show-1', date: '2026-07-17' }),
    '/shows/show-1?date=2026-07-17#ticket-workspace',
  );
});

test('invalid dates are omitted from the target', () => {
  assert.equal(isDateKey('2026-07-17'), true);
  assert.equal(isDateKey('2026-02-30'), false);
  assert.equal(isDateKey('17-07-2026'), false);
  assert.equal(
    showTicketTarget({ showId: 'show-1', date: '17-07-2026' }),
    '/shows/show-1#ticket-workspace',
  );
});
