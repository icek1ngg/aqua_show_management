import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTicketWorkspaceResolution,
  resolveNearestBookableWorkspace,
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

  await assert.rejects(resolution.resolveTarget, /temporary catalog failure/);
  assert.deepEqual(await resolution.resolveTarget(), {
    show: { id: 'show-7', title: 'Recovered Show' },
    scheduleId: 'schedule-9',
  });
  assert.deepEqual(loadedIds, ['show-7', 'show-7']);
  assert.deepEqual(resolution.intent, {
    requestedShowId: 'show-7',
    requestedScheduleId: 'schedule-9',
  });
});

test('generic routing chooses the earliest bookable schedule across loaded shows', async () => {
  const shows = [
    { id: 'sold-out-show' },
    { id: 'later-show' },
    { id: 'nearest-show' },
    { id: 'cutoff-show' },
  ];
  const schedulesByShow = {
    'sold-out-show': [
      { id: 'sold-out', startTime: '2026-07-14T12:00:00Z', availableTickets: 0 },
    ],
    'later-show': [
      { id: 'later', startTime: '2026-07-15T12:00:00Z', availableTickets: 4 },
    ],
    'nearest-show': [
      { id: 'nearest', startTime: '2026-07-14T11:00:00Z', availableTickets: 2 },
    ],
    'cutoff-show': [
      { id: 'inside-cutoff', startTime: '2026-07-14T08:20:00Z', availableTickets: 5 },
    ],
  };

  const target = await resolveNearestBookableWorkspace(
    shows,
    async (showId) => schedulesByShow[showId],
    new Date('2026-07-14T08:00:00Z').getTime(),
  );

  assert.deepEqual(target, { show: shows[2], scheduleId: 'nearest' });
});

test('generic routing rejects a partial lookup failure because the earliest result is indeterminate', async () => {
  const shows = [{ id: 'broken-show' }, { id: 'bookable-show' }];

  await assert.rejects(
    resolveNearestBookableWorkspace(shows, async (showId) => {
      if (showId === 'broken-show') throw new Error('temporary schedule failure');
      return [{ id: 'bookable', startTime: '2026-07-14T12:00:00Z', availableTickets: 2 }];
    }, new Date('2026-07-14T08:00:00Z').getTime()),
    /could not confirm schedules/i,
  );
});

test('generic routing rejects when every schedule lookup fails', async () => {
  const shows = [{ id: 'first' }, { id: 'second' }];

  await assert.rejects(
    resolveNearestBookableWorkspace(shows, async () => {
      throw new Error('catalog unavailable');
    }, new Date('2026-07-14T08:00:00Z').getTime()),
    /could not confirm schedules/i,
  );
});
