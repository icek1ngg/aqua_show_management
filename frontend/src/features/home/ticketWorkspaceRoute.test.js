import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTicketWorkspaceResolution,
  resolveTicketWorkspaceShow,
} from './ticketWorkspaceRoute.js';

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

test('retries a failed route lookup with the same requested show and schedule', async () => {
  const loadedIds = [];
  const resolution = createTicketWorkspaceResolution({
    shows: [{ id: 'show-1' }],
    requestedShowId: 'show-7',
    requestedScheduleId: 'schedule-9',
    loadShow: async (showId) => {
      loadedIds.push(showId);
      if (loadedIds.length === 1) throw new Error('temporary catalog failure');
      return { id: showId, title: 'Recovered Show' };
    },
  });

  await assert.rejects(resolution.resolve, /temporary catalog failure/);
  assert.deepEqual(await resolution.resolve(), { id: 'show-7', title: 'Recovered Show' });
  assert.deepEqual(loadedIds, ['show-7', 'show-7']);
  assert.deepEqual(resolution.intent, {
    requestedShowId: 'show-7',
    requestedScheduleId: 'schedule-9',
  });
});
