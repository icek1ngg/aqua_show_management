import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCartItem,
  createSelectorState,
  selectSchedule,
  setTypeQuantity,
  ticketTypeAvailability,
} from './ticketSelectorState.js';

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
