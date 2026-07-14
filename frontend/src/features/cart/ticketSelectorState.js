import { normalizeTicketType } from '../../shared/utils/ticketPricing.js';

export const SELECTOR_TICKET_TYPES = ['STANDARD', 'VIP', 'FAMILY'];

const availabilityFields = {
  STANDARD: 'standardAvailableTickets',
  VIP: 'vipAvailableTickets',
  FAMILY: 'familyAvailableTickets',
};

const priceFields = {
  STANDARD: 'standardPrice',
  VIP: 'vipPrice',
  FAMILY: 'familyPrice',
};

function emptyQuantities() {
  return {
    STANDARD: { adult: 0, child: 0, senior: 0 },
    VIP: { adult: 0, child: 0, senior: 0 },
    FAMILY: { adult: 0, child: 0, senior: 0 },
  };
}

export function getTotalQuantity(quantitiesObj) {
  if (!quantitiesObj) return 0;
  return (quantitiesObj.adult || 0) + (quantitiesObj.child || 0) + (quantitiesObj.senior || 0);
}

export function createSelectorState(scheduleId = '') {
  return { scheduleId: String(scheduleId || ''), quantities: emptyQuantities() };
}

export function selectSchedule(state, scheduleId) {
  const nextScheduleId = String(scheduleId || '');
  if (state?.scheduleId === nextScheduleId) {
    return state;
  }
  return createSelectorState(nextScheduleId);
}

export function ticketTypeAvailability(schedule, ticketType) {
  const type = normalizeTicketType(ticketType);
  const available = Math.max(0, Math.trunc(Number(schedule?.[availabilityFields[type]]) || 0));
  return {
    available,
    maximum: Math.min(10, available),
    disabled: available === 0,
  };
}

function scheduleId(schedule) {
  return String(schedule?.id || schedule?.scheduleId || '');
}

export function isScheduleBookable(schedule, now = Date.now()) {
  const start = new Date(schedule?.startTime).getTime();
  if (!Number.isFinite(start) || start <= Number(now) + 30 * 60 * 1000) return false;
  const hasPerTypeAvailability = SELECTOR_TICKET_TYPES.some(
    (type) => schedule?.[availabilityFields[type]] != null,
  );
  if (!hasPerTypeAvailability) {
    return Math.max(0, Math.trunc(Number(schedule?.availableTickets) || 0)) > 0;
  }
  return SELECTOR_TICKET_TYPES.some((type) => ticketTypeAvailability(schedule, type).available > 0);
}

export function chooseBookableSchedule(schedules, preferredId = '', now = Date.now()) {
  const bookable = (Array.isArray(schedules) ? schedules : [])
    .filter((item) => isScheduleBookable(item, now))
    .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
  const preferred = bookable.find((item) => scheduleId(item) === String(preferredId || ''));
  return preferred || bookable[0] || null;
}

export function setTypeQuantity(state, ticketType, quantity, effectiveAvailability) {
  // Legacy compatibility function: delegates to adult age group
  return setTypeAgeQuantity(state, ticketType, 'adult', quantity, effectiveAvailability);
}

export function selectTicketType(state, ticketType, schedule) {
  const availability = ticketTypeAvailability(schedule, ticketType);
  if (availability.disabled) return state;
  return setTypeAgeQuantity(state, ticketType, 'adult', 1, availability.available);
}

export function setTypeAgeQuantity(state, ticketType, ageType, quantity, effectiveAvailability) {
  const type = normalizeTicketType(ticketType);
  if (!SELECTOR_TICKET_TYPES.includes(type) || !['adult', 'child', 'senior'].includes(ageType)) {
    return state;
  }
  const currentQuantities = state.quantities[type] || { adult: 0, child: 0, senior: 0 };
  const currentTotal = getTotalQuantity(currentQuantities);
  const maximumTotal = Math.min(10, Math.max(0, Math.trunc(Number(effectiveAvailability) || 0)));
  
  let safeQuantity = Math.max(0, Math.trunc(Number(quantity) || 0));
  if (currentTotal - (currentQuantities[ageType] || 0) + safeQuantity > maximumTotal) {
    safeQuantity = maximumTotal - (currentTotal - (currentQuantities[ageType] || 0));
  }

  return {
    ...state,
    quantities: {
      ...state.quantities,
      [type]: { ...currentQuantities, [ageType]: safeQuantity },
    },
  };
}

export function buildCartItem(schedule, ticketType, quantities) {
  const type = normalizeTicketType(ticketType);
  const totalQty = getTotalQuantity(quantities);
  return {
    scheduleId: String(schedule.scheduleId),
    showId: String(schedule.showId),
    ticketType: type,
    quantity: Math.trunc(Number(totalQty)),
    ages: {
      adult: Math.trunc(Number(quantities.adult || 0)),
      child: Math.trunc(Number(quantities.child || 0)),
      senior: Math.trunc(Number(quantities.senior || 0)),
    },
    showTitle: schedule.showTitle,
    imageUrl: schedule.showImageUrl || null,
    venueName: schedule.venueName,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    unitPrice: Number(schedule[priceFields[type]]) || 0,
    availableTickets: ticketTypeAvailability(schedule, type).available,
  };
}

export function selectedTicketSummary(schedule, state) {
  if (!schedule) {
    return { lines: [], totalQuantity: 0, totalAmount: 0 };
  }
  const lines = SELECTOR_TICKET_TYPES
    .filter((type) => getTotalQuantity(state?.quantities?.[type]) > 0)
    .map((type) => {
      const item = buildCartItem(schedule, type, state.quantities[type]);
      return { ...item, lineTotal: item.unitPrice * item.quantity };
    });
  return {
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    totalAmount: lines.reduce((sum, line) => sum + line.lineTotal, 0),
  };
}

export function reconcileSelectorState(state, schedule) {
  if (!schedule) return createSelectorState();
  const nextState = { ...createSelectorState(scheduleId(schedule)), quantities: { ...emptyQuantities() } };
  return SELECTOR_TICKET_TYPES.reduce(
    (current, type) => {
      let updated = current;
      const available = ticketTypeAvailability(schedule, type).available;
      const q = state?.quantities?.[type] || { adult: 0, child: 0, senior: 0 };
      updated = setTypeAgeQuantity(updated, type, 'adult', q.adult, available);
      updated = setTypeAgeQuantity(updated, type, 'child', q.child, available);
      updated = setTypeAgeQuantity(updated, type, 'senior', q.senior, available);
      return updated;
    },
    nextState,
  );
}
