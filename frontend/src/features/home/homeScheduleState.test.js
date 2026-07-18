import test from 'node:test';
import assert from 'node:assert/strict';

import { featuredShowsFromSchedules, sortUpcomingSchedules } from './homeScheduleState.js';

const schedules = [
  {
    scheduleId: 'schedule-a-later',
    showId: 'show-a',
    showTitle: 'Aqua Symphony',
    showShortDescription: 'Lights and water',
    startTime: '2026-08-03T19:00:00',
  },
  {
    scheduleId: 'schedule-b',
    showId: 'show-b',
    showTitle: 'Ocean Journey',
    showShortDescription: 'Ocean adventure',
    startTime: '2026-08-02T19:00:00',
  },
  {
    scheduleId: 'schedule-a-nearest',
    showId: 'show-a',
    showTitle: 'Aqua Symphony',
    showShortDescription: 'Lights and water',
    startTime: '2026-08-01T19:00:00',
  },
];

test('upcoming schedules keep every schedule and sort them from nearest to latest', () => {
  assert.deepEqual(
    sortUpcomingSchedules(schedules).map((schedule) => schedule.scheduleId),
    ['schedule-a-nearest', 'schedule-b', 'schedule-a-later'],
  );
});

test('featured shows are unique and use each show nearest schedule for ordering', () => {
  const featured = featuredShowsFromSchedules(schedules);

  assert.deepEqual(featured.map((show) => show.id), ['show-a', 'show-b']);
  assert.equal(featured[0].nextScheduleId, 'schedule-a-nearest');
  assert.equal(featured.filter((show) => show.id === 'show-a').length, 1);
});

test('featured show search keeps the nearest-time ordering', () => {
  assert.deepEqual(
    featuredShowsFromSchedules(schedules, 'ocean').map((show) => show.id),
    ['show-b'],
  );
});
