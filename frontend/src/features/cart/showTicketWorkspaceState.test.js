import test from 'node:test';
import assert from 'node:assert/strict';

import { ticketWorkspaceContentState } from './showTicketWorkspaceState.js';

test('loading takes precedence while the schedule snapshot is temporarily null', () => {
  assert.equal(ticketWorkspaceContentState({ loading: true, error: '', schedule: null }), 'loading');
});

test('error and empty states are selected only after loading completes', () => {
  assert.equal(ticketWorkspaceContentState({ loading: false, error: 'Failed', schedule: null }), 'error');
  assert.equal(ticketWorkspaceContentState({ loading: false, error: '', schedule: null }), 'empty');
  assert.equal(ticketWorkspaceContentState({ loading: false, error: '', schedule: { id: 's1' } }), 'ready');
});
