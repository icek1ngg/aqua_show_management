import test from 'node:test';
import assert from 'node:assert/strict';
import { showTicketTarget } from './showTicketNavigation.js';

test('generic booking actions target the shows ticket workspace', () => {
  assert.deepEqual(showTicketTarget(), {
    to: '/shows',
    state: { scrollTo: 'ticket-workspace' },
  });
});

test('show-specific actions preserve show and schedule identifiers', () => {
  assert.deepEqual(showTicketTarget({ showId: 'show-1', scheduleId: 'schedule-2' }), {
    to: '/shows',
    state: {
      scrollTo: 'ticket-workspace',
      ticketSelectionShowId: 'show-1',
      ticketSelectionScheduleId: 'schedule-2',
    },
  });
});
