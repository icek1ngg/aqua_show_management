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
