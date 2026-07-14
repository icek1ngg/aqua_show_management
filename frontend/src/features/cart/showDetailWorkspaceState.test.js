import test from 'node:test';
import assert from 'node:assert/strict';

import { detailWorkspaceNotice } from './showDetailWorkspaceState.js';
import { createWorkspaceRequestTracker } from './showDetailWorkspaceState.js';

test('explains that a requested date no longer has tickets', () => {
  assert.equal(
    detailWorkspaceNotice({ requestedDateUnavailable: true, requestedDate: '2026-07-17' }),
    'No tickets remain for 2026-07-17. Choose another available date or time.',
  );
});

test('does not show a date warning for the normal nearest schedule', () => {
  assert.equal(detailWorkspaceNotice({ requestedDateUnavailable: false, requestedDate: '' }), '');
});

test('a newer workspace request invalidates an older response', () => {
  const tracker = createWorkspaceRequestTracker();
  const first = tracker.begin();
  const second = tracker.begin();
  assert.equal(tracker.isCurrent(first), false);
  assert.equal(tracker.isCurrent(second), true);
  tracker.invalidate();
  assert.equal(tracker.isCurrent(second), false);
});
