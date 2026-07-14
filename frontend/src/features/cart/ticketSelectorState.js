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
  return { STANDARD: 0, VIP: 0, FAMILY: 0 };
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
  const type = normalizeTicketType(ticketType);
  if (!SELECTOR_TICKET_TYPES.includes(type)) {
    return state;
  }
  const maximum = Math.min(10, Math.max(0, Math.trunc(Number(effectiveAvailability) || 0)));
  const safeQuantity = Math.min(maximum, Math.max(0, Math.trunc(Number(quantity) || 0)));
  return {
    ...state,
    quantities: { ...state.quantities, [type]: safeQuantity },
  };
}

export function selectTicketType(state, ticketType, schedule) {
  const availability = ticketTypeAvailability(schedule, ticketType);
  if (availability.disabled) return state;
  return setTypeQuantity(state, ticketType, 1, availability.available);
}

export function buildCartItem(schedule, ticketType, quantity) {
  const type = normalizeTicketType(ticketType);
  return {
    scheduleId: String(schedule.scheduleId),
    showId: String(schedule.showId),
    ticketType: type,
    quantity: Math.trunc(Number(quantity)),
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
    .filter((type) => Number(state?.quantities?.[type]) > 0)
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
  return SELECTOR_TICKET_TYPES.reduce(
    (current, type) => setTypeQuantity(
      current,
      type,
      state?.quantities?.[type],
      ticketTypeAvailability(schedule, type).available,
    ),
    { ...createSelectorState(scheduleId(schedule)), quantities: { ...emptyQuantities() } },
  );
}
