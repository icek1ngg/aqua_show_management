import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveTicketWorkspaceShow } from './ticketWorkspaceRoute.js';

test('loads a route-selected show when it is outside the current catalog page', async () => {
  const requestedShow = { id: 'show-7', title: 'Seventh Show' };
  const loadedIds = [];

  const resolved = await resolveTicketWorkspaceShow(
    [{ id: 'show-1', title: 'First Show' }],
    requestedShow.id,
    null,
    async (showId) => {
      loadedIds.push(showId);
      return requestedShow;
    },
  );

  assert.equal(resolved, requestedShow);
  assert.deepEqual(loadedIds, ['show-7']);
});

test('reuses a route-selected show from the current catalog page', async () => {
  const requestedShow = { id: 'show-2', title: 'Second Show' };
  let loadCount = 0;

  const resolved = await resolveTicketWorkspaceShow(
    [{ id: 'show-1' }, requestedShow],
    requestedShow.id,
    null,
    async () => {
      loadCount += 1;
      return null;
    },
  );

  assert.equal(resolved, requestedShow);
  assert.equal(loadCount, 0);
});

test('uses the normal catalog fallback when no show is requested', async () => {
  const fallbackShow = { id: 'show-1' };

  const resolved = await resolveTicketWorkspaceShow([], '', fallbackShow, async () => {
    throw new Error('show lookup should not run');
  });

  assert.equal(resolved, fallbackShow);
});
