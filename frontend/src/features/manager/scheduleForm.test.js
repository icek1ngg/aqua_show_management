import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildScheduleVenueOptions,
  findScheduleVenue,
  validateScheduleInventory,
} from './scheduleForm.js';

test('keeps the current edit venue available when it is absent from the active venue page', () => {
  const activeVenue = { id: 'active-venue', name: 'Active Venue', capacity: 200 };
  const schedule = { venueId: 'inactive-venue', venueName: 'Historic Venue' };
  const resolvedCurrentVenue = {
    id: 'inactive-venue',
    name: 'Historic Venue',
    capacity: 100,
    status: 'INACTIVE',
  };

  const options = buildScheduleVenueOptions([activeVenue], schedule, resolvedCurrentVenue);

  assert.deepEqual(options, [activeVenue, resolvedCurrentVenue]);
  assert.equal(findScheduleVenue(options, schedule.venueId)?.capacity, 100);
});

test('resolves the newly selected venue capacity when switching between smaller and larger venues', () => {
  const options = buildScheduleVenueOptions([
    { id: 'smaller', name: 'Smaller Venue', capacity: 90 },
    { id: 'larger', name: 'Larger Venue', capacity: 120 },
  ]);
  const inventory = {
    standardCapacity: '70',
    vipCapacity: '20',
    familyCapacity: '10',
    standardPrice: '2500',
  };

  const smallerResult = validateScheduleInventory(
    inventory,
    findScheduleVenue(options, 'smaller')?.capacity,
  );
  const largerResult = validateScheduleInventory(
    inventory,
    findScheduleVenue(options, 'larger')?.capacity,
  );

  assert.equal(smallerResult.isValid, false);
  assert.equal(smallerResult.errors.totalCapacity, 'Total capacity cannot exceed the venue capacity.');
  assert.equal(largerResult.isValid, true);
});

test('accepts ticket capacities that exactly match the venue capacity', () => {
  const result = validateScheduleInventory({
    standardCapacity: '70',
    vipCapacity: '20',
    familyCapacity: '10',
    standardPrice: '2500',
  }, 100);

  assert.equal(result.isValid, true);
  assert.equal(result.totalCapacity, 100);
  assert.deepEqual(result.errors, {});
});

test('rejects a ticket capacity total above the venue capacity', () => {
  const result = validateScheduleInventory({
    standardCapacity: '80',
    vipCapacity: '20',
    familyCapacity: '1',
    standardPrice: '2500',
  }, 100);

  assert.equal(result.isValid, false);
  assert.equal(result.totalCapacity, 101);
  assert.equal(result.errors.totalCapacity, 'Total capacity cannot exceed the venue capacity.');
});

test('requires a venue capacity before inventory can be valid', () => {
  const result = validateScheduleInventory({
    standardCapacity: '70',
    vipCapacity: '20',
    familyCapacity: '10',
    standardPrice: '2500',
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.totalCapacity, 'Select a venue to validate total capacity.');
});

test('rejects negative capacity values for every ticket type', () => {
  for (const field of ['standardCapacity', 'vipCapacity', 'familyCapacity']) {
    const result = validateScheduleInventory({
      standardCapacity: '10',
      vipCapacity: '10',
      familyCapacity: '10',
      standardPrice: '2500',
      [field]: '-1',
    }, 100);

    assert.equal(result.isValid, false);
    assert.equal(result.errors[field], 'Capacity cannot be negative.');
  }
});

test('requires a positive Standard price', () => {
  for (const standardPrice of ['0', '-1']) {
    const result = validateScheduleInventory({
      standardCapacity: '70',
      vipCapacity: '20',
      familyCapacity: '10',
      standardPrice,
    }, 100);

    assert.equal(result.isValid, false);
    assert.equal(result.errors.standardPrice, 'Standard price must be greater than 0.');
  }
});
