const capacityFields = ['standardCapacity', 'vipCapacity', 'familyCapacity'];

export function validateScheduleInventory(values, venueCapacity) {
  const errors = {};
  const capacities = capacityFields.map((field) => {
    const value = Number(values[field]);

    if (values[field] === '' || !Number.isInteger(value)) {
      errors[field] = 'Capacity must be a whole number.';
      return 0;
    }

    if (value < 0) {
      errors[field] = 'Capacity cannot be negative.';
    }

    return value;
  });
  const totalCapacity = capacities.reduce((total, capacity) => total + capacity, 0);
  const maximumCapacity = Number(venueCapacity);
  const standardPrice = Number(values.standardPrice);

  if (!Number.isFinite(maximumCapacity)) {
    errors.totalCapacity = 'Select a venue to validate total capacity.';
  } else if (totalCapacity <= 0) {
    errors.totalCapacity = 'Total capacity must be greater than 0.';
  } else if (totalCapacity > maximumCapacity) {
    errors.totalCapacity = 'Total capacity cannot exceed the venue capacity.';
  }

  if (values.standardPrice === '' || !Number.isFinite(standardPrice) || standardPrice <= 0) {
    errors.standardPrice = 'Standard price must be greater than 0.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    totalCapacity,
  };
}
