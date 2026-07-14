import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCartItem,
  chooseBookableSchedule,
  createSelectorState,
  reconcileSelectorState,
  selectSchedule,
  selectTicketType,
  selectedTicketSummary,
  setTypeQuantity,
  ticketTypeAvailability,
} from './ticketSelectorState.js';

const NOW = new Date('2026-07-14T08:00:00Z').getTime();

const schedule = {
  scheduleId: 'schedule-2',
  showId: 'show-1',
  showTitle: 'Ocean Lights',
  showImageUrl: '/ocean.jpg',
  status: 'ACTIVE',
  startTime: '2026-08-01T19:00:00',
  endTime: '2026-08-01T19:45:00',
  venueName: 'Aqua Arena',
  standardPrice: 2500,
  vipPrice: 6250,
  familyPrice: 3750,
  standardAvailableTickets: 18,
  vipAvailableTickets: 0,
  familyAvailableTickets: 4,
};

test('switching schedules resets every ticket quantity', () => {
  const selected = setTypeQuantity(createSelectorState('schedule-1'), 'STANDARD', 3, 8);

  assert.deepEqual(selectSchedule(selected, 'schedule-2'), {
    scheduleId: 'schedule-2',
    quantities: { STANDARD: 0, VIP: 0, FAMILY: 0 },
  });
});

test('selecting the current schedule preserves the current summary', () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  assert.equal(selectSchedule(selected, 'schedule-2'), selected);
});

test('a sold-out ticket type is disabled', () => {
  assert.deepEqual(ticketTypeAvailability(schedule, 'VIP'), {
    available: 0,
    maximum: 0,
    disabled: true,
  });
});

test('quantity cannot exceed ten or effective availability', () => {
  const initial = createSelectorState('schedule-2');
  const standard = setTypeQuantity(initial, 'STANDARD', 99, schedule.standardAvailableTickets);
  const family = setTypeQuantity(standard, 'FAMILY', 99, schedule.familyAvailableTickets);

  assert.equal(standard.quantities.STANDARD, 10);
  assert.equal(family.quantities.FAMILY, 4);
});

test('cart item keeps trusted identifiers and display snapshots', () => {
  assert.deepEqual(buildCartItem(schedule, 'FAMILY', 2), {
    scheduleId: 'schedule-2',
    showId: 'show-1',
    ticketType: 'FAMILY',
    quantity: 2,
    showTitle: 'Ocean Lights',
    imageUrl: '/ocean.jpg',
    venueName: 'Aqua Arena',
    startTime: '2026-08-01T19:00:00',
    endTime: '2026-08-01T19:45:00',
    unitPrice: 3750,
    availableTickets: 4,
  });
});

test('chooses the earliest future schedule with any ticket type available', () => {
  const schedules = [
    { id: 'sold-out', startTime: '2026-07-14T10:00:00Z', standardAvailableTickets: 0, vipAvailableTickets: 0, familyAvailableTickets: 0 },
    { id: 'later', startTime: '2026-07-15T12:00:00Z', standardAvailableTickets: 2 },
    { id: 'nearest', startTime: '2026-07-14T12:00:00Z', vipAvailableTickets: 1 },
  ];

  assert.equal(chooseBookableSchedule(schedules, '', NOW)?.id, 'nearest');
});

test('chooses the nearest API schedule brief with aggregate availability', () => {
  const schedules = [
    { id: 'later-brief', startTime: '2026-07-15T12:00:00Z', availableTickets: 8, price: 2500 },
    { id: 'sold-out-brief', startTime: '2026-07-14T10:00:00Z', availableTickets: 0, price: 2500 },
    { id: 'nearest-brief', startTime: '2026-07-14T12:00:00Z', availableTickets: 3, price: 2500 },
  ];

  assert.equal(chooseBookableSchedule(schedules, '', NOW)?.id, 'nearest-brief');
});

test('honors a valid preferred schedule before the nearest default', () => {
  const schedules = [
    { id: 'nearest', startTime: '2026-07-14T12:00:00Z', standardAvailableTickets: 3 },
    { id: 'preferred', startTime: '2026-07-15T12:00:00Z', familyAvailableTickets: 2 },
  ];

  assert.equal(chooseBookableSchedule(schedules, 'preferred', NOW)?.id, 'preferred');
});

test('rejects schedules inside the thirty minute booking cutoff', () => {
  const schedules = [
    { id: 'closed', startTime: '2026-07-14T08:20:00Z', standardAvailableTickets: 3 },
  ];

  assert.equal(chooseBookableSchedule(schedules, '', NOW), null);
});

test('selecting a ticket type adds it with quantity one', () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  assert.equal(selected.quantities.STANDARD, 1);
});

test('selecting a sold-out ticket type leaves state unchanged', () => {
  const initial = createSelectorState('schedule-2');
  assert.deepEqual(selectTicketType(initial, 'VIP', schedule), initial);
});

test('decreasing a selected quantity to zero removes it from the summary', () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'FAMILY', schedule);
  const removed = setTypeQuantity(selected, 'FAMILY', 0, schedule.familyAvailableTickets);
  assert.equal(selectedTicketSummary(schedule, removed).lines.length, 0);
});

test('summary calculates line totals, ticket count, and temporary total', () => {
  let state = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  state = setTypeQuantity(state, 'STANDARD', 2, schedule.standardAvailableTickets);
  state = selectTicketType(state, 'FAMILY', schedule);

  const summary = selectedTicketSummary(schedule, state);
  assert.deepEqual(summary.lines.map(({ ticketType, quantity, lineTotal }) => ({ ticketType, quantity, lineTotal })), [
    { ticketType: 'STANDARD', quantity: 2, lineTotal: 5000 },
    { ticketType: 'FAMILY', quantity: 1, lineTotal: 3750 },
  ]);
  assert.equal(summary.totalQuantity, 3);
  assert.equal(summary.totalAmount, 8750);
});

test('selected quantities with a null schedule produce an empty summary', () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);

  assert.deepEqual(selectedTicketSummary(null, selected), {
    lines: [],
    totalQuantity: 0,
    totalAmount: 0,
  });
});

test('reconciles selected quantities to fresh authoritative availability', () => {
  let selected = selectTicketType(createSelectorState('schedule-2'), 'STANDARD', schedule);
  selected = setTypeQuantity(selected, 'STANDARD', 4, schedule.standardAvailableTickets);
  const freshSchedule = { ...schedule, standardAvailableTickets: 2 };

  const reconciled = reconcileSelectorState(selected, freshSchedule);

  assert.equal(reconciled.quantities.STANDARD, 2);
  assert.equal(selectedTicketSummary(freshSchedule, reconciled).totalQuantity, 2);
});

test('removes selected lines that have no fresh authoritative availability', () => {
  const selected = selectTicketType(createSelectorState('schedule-2'), 'FAMILY', schedule);
  const freshSchedule = { ...schedule, familyAvailableTickets: 0 };

  const reconciled = reconcileSelectorState(selected, freshSchedule);

  assert.equal(reconciled.quantities.FAMILY, 0);
  assert.equal(selectedTicketSummary(freshSchedule, reconciled).lines.length, 0);
});
