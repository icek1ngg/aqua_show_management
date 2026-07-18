import { cartItemKey } from './cartStorage.js';
import { normalizeTicketType } from '../../shared/utils/ticketPricing.js';
import { MAX_CHECKOUT_TICKETS } from '../checkout/checkoutPolicy.js';

const priceFields = {
  STANDARD: 'standardPrice',
  VIP: 'vipPrice',
  FAMILY: 'familyPrice',
};

const availabilityFields = {
  STANDARD: 'standardAvailableTickets',
  VIP: 'vipAvailableTickets',
  FAMILY: 'familyAvailableTickets',
};

export function reviewCartLine(item, schedule) {
  const ticketType = normalizeTicketType(item.ticketType);
  const key = cartItemKey(item);
  if (!schedule) {
    return { ...item, key, ticketType, checkoutAvailable: false, requiresReview: false, unavailableReason: 'Schedule is no longer available.' };
  }

  const unitPrice = Number(schedule[priceFields[ticketType]]) || 0;
  const availableTickets = Math.max(0, Math.trunc(Number(schedule[availabilityFields[ticketType]]) || 0));
  const maximum = Math.min(10, availableTickets);
  const originalQuantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
  const quantity = maximum > 0 ? Math.min(originalQuantity, maximum) : originalQuantity;
  const start = schedule.startTime ? new Date(schedule.startTime) : null;
  const bookingClosed = start && !Number.isNaN(start.getTime()) && start.getTime() <= Date.now() + 30 * 60 * 1000;
  const active = schedule.status === 'ACTIVE';
  const checkoutAvailable = active && availableTickets > 0 && !bookingClosed;
  const requiresReview = checkoutAvailable && (
    Number(item.unitPrice) !== unitPrice
    || Number(item.availableTickets) !== availableTickets
    || originalQuantity !== quantity
  );

  return {
    ...item,
    key,
    scheduleId: String(schedule.scheduleId || item.scheduleId),
    showId: String(schedule.showId || item.showId),
    ticketType,
    quantity,
    showTitle: schedule.showTitle || item.showTitle,
    imageUrl: schedule.showImageUrl || item.imageUrl || null,
    venueName: schedule.venueName || item.venueName,
    startTime: schedule.startTime || item.startTime,
    endTime: schedule.endTime || item.endTime,
    unitPrice,
    availableTickets,
    checkoutAvailable,
    requiresReview,
    unavailableReason: !active
      ? 'Schedule is inactive.'
      : availableTickets <= 0
        ? `${ticketType} tickets are sold out.`
        : bookingClosed
          ? 'Booking is closed for this schedule.'
          : '',
  };
}

export function selectedCartTotals(lines, selectedKeys) {
  return lines.reduce((totals, line) => {
    if (!selectedKeys.has(line.key || cartItemKey(line)) || !line.checkoutAvailable) return totals;
    return {
      lines: totals.lines + 1,
      tickets: totals.tickets + Number(line.quantity),
      amount: totals.amount + Number(line.unitPrice) * Number(line.quantity),
    };
  }, { lines: 0, tickets: 0, amount: 0 });
}

export function selectCartLinesWithinLimit(lines, shouldSelect = () => true) {
  const selected = new Set();
  let tickets = 0;
  for (const line of Array.isArray(lines) ? lines : []) {
    const key = line.key || cartItemKey(line);
    const quantity = Math.max(0, Math.trunc(Number(line.quantity) || 0));
    if (!line.checkoutAvailable || !shouldSelect(line) || quantity < 1) continue;
    if (tickets + quantity > MAX_CHECKOUT_TICKETS) continue;
    selected.add(key);
    tickets += quantity;
  }
  return selected;
}

export function canAddCartLineToSelection(lines, selectedKeys, key) {
  if (selectedKeys.has(key)) return true;
  const line = (Array.isArray(lines) ? lines : []).find(candidate => (candidate.key || cartItemKey(candidate)) === key);
  if (!line?.checkoutAvailable) return false;
  return selectedCartTotals(lines, selectedKeys).tickets + Number(line.quantity) <= MAX_CHECKOUT_TICKETS;
}

export function removeCheckedKeysAfterSuccess(currentKeys, checkedOutKeys) {
  return new Set([...currentKeys].filter((key) => !checkedOutKeys.has(key)));
}
