import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bookableDateOptions,
  chooseShowDetailSchedule,
} from './showDetailSchedule.js';

const NOW = new Date('2026-07-14T08:00:00Z').getTime();
const schedules = [
  { id: 'sold-out', startTime: '2026-07-15T08:00:00Z', availableTickets: 0 },
  { id: 'day-one-late', startTime: '2026-07-17T13:00:00Z', availableTickets: 4 },
  { id: 'day-one-early', startTime: '2026-07-17T09:00:00Z', availableTickets: 2 },
  { id: 'day-two', startTime: '2026-07-18T10:00:00Z', availableTickets: 3 },
  { id: 'cutoff', startTime: '2026-07-14T08:20:00Z', availableTickets: 9 },
];

test('returns unique sorted dates that contain a bookable schedule', () => {
  assert.deepEqual(bookableDateOptions(schedules, NOW), ['2026-07-17', '2026-07-18']);
});

test('selects the earliest bookable schedule in the requested date', () => {
  const result = chooseShowDetailSchedule(schedules, '2026-07-17', NOW);
  assert.equal(result.schedule.id, 'day-one-early');
  assert.equal(result.requestedDateUnavailable, false);
  assert.equal(result.effectiveDate, '2026-07-17');
});

test('keeps a valid unavailable date as an actionable empty intent', () => {
  const result = chooseShowDetailSchedule(schedules, '2026-07-15', NOW);
  assert.equal(result.schedule, null);
  assert.equal(result.requestedDateUnavailable, true);
  assert.equal(result.effectiveDate, '2026-07-15');
});

test('invalid or missing dates fall back to the nearest bookable schedule', () => {
  assert.equal(chooseShowDetailSchedule(schedules, 'bad-date', NOW).schedule.id, 'day-one-early');
  assert.equal(chooseShowDetailSchedule(schedules, '', NOW).schedule.id, 'day-one-early');
});
