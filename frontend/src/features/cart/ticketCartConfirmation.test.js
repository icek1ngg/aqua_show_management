import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSelectorState,
  selectTicketType,
  setTypeQuantity,
} from './ticketSelectorState.js';
import { confirmTicketSelection } from './ticketCartConfirmation.js';

const schedule = {
  scheduleId: 'schedule-2',
  showId: 'show-1',
  showTitle: 'Aqua Show',
  startTime: '2026-07-15T12:00:00Z',
  endTime: '2026-07-15T13:00:00Z',
  standardPrice: 2500,
  vipPrice: 5000,
  familyPrice: 3750,
  standardAvailableTickets: 8,
  vipAvailableTickets: 4,
  familyAvailableTickets: 3,
};

test('a stale async confirmation cannot commit or navigate', async () => {
  let resolveSchedule;
  let intentVersion = 1;
  let persisted = 0;
  let navigated = 0;
  const selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  const confirmation = confirmTicketSelection({
    schedule,
    state: selected,
    loadSchedule: () => new Promise((resolve) => { resolveSchedule = resolve; }),
    isCurrent: () => intentVersion === 1,
    commit: () => {
      persisted += 1;
      navigated += 1;
    },
  });

  intentVersion = 2;
  resolveSchedule(schedule);

  assert.deepEqual(await confirmation, { status: 'stale' });
  assert.equal(persisted, 0);
  assert.equal(navigated, 0);
});

test('reduced availability updates selection and requires another confirmation', async () => {
  let selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  selected = setTypeQuantity(selected, 'STANDARD', 4, schedule.standardAvailableTickets);
  let commits = 0;

  const result = await confirmTicketSelection({
    schedule,
    state: selected,
    loadSchedule: async () => ({ ...schedule, standardAvailableTickets: 2 }),
    isCurrent: () => true,
    commit: () => { commits += 1; },
  });

  assert.equal(result.status, 'changed');
  assert.equal(result.state.quantities.STANDARD, 2);
  assert.match(result.notice, /availability changed/i);
  assert.equal(commits, 0);
});

test('a sold-out line is removed without committing the remaining line', async () => {
  let selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  selected = selectTicketType(selected, 'FAMILY', schedule);
  let commits = 0;

  const result = await confirmTicketSelection({
    schedule,
    state: selected,
    loadSchedule: async () => ({ ...schedule, standardAvailableTickets: 0 }),
    isCurrent: () => true,
    commit: () => { commits += 1; },
  });

  assert.equal(result.status, 'changed');
  assert.equal(result.state.quantities.STANDARD, 0);
  assert.equal(result.state.quantities.FAMILY, 1);
  assert.equal(commits, 0);
});

test('unchanged fresh selection commits once with authoritative lines', async () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  const committed = [];

  const result = await confirmTicketSelection({
    schedule,
    state: selected,
    loadSchedule: async () => schedule,
    isCurrent: () => true,
    commit: (lines) => committed.push(lines),
  });

  assert.equal(result.status, 'committed');
  assert.equal(committed.length, 1);
  assert.equal(committed[0][0].quantity, 1);
});
