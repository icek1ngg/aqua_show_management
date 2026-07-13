export const ticketTypeOptions = [
  { value: 'STANDARD', label: 'Standard Entry' },
  { value: 'VIP', label: 'VIP Entry' },
  { value: 'FAMILY', label: 'Family Package' },
];

const ticketTypeMultipliers = {
  STANDARD: 1,
  VIP: 2.5,
  FAMILY: 1.5,
};

const legacyStandardPrice = 2000;

const ticketTypeAliases = {
  'STANDARD ENTRY': 'STANDARD',
  'VIP ENTRY': 'VIP',
  'VIP EXPERIENCE': 'VIP',
  'FAMILY PACKAGE': 'FAMILY',
  'FAMILY PASS': 'FAMILY',
};

export function normalizeTicketType(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replaceAll('_', ' ')
    .replaceAll('-', ' ');

  return ticketTypeAliases[normalized] || normalized;
}

export function getTicketTypeLabel(value) {
  const normalized = normalizeTicketType(value);
  return ticketTypeOptions.find((option) => option.value === normalized)?.label || value || 'Standard Entry';
}

export function getTicketTypePrice(standardPrice, value) {
  // Transitional compatibility for CreateBookingPage; remove when Task 11 makes it schedule-backed.
  if (arguments.length === 1) {
    const legacyMultiplier = ticketTypeMultipliers[normalizeTicketType(standardPrice)];
    return legacyMultiplier ? legacyStandardPrice * legacyMultiplier : 0;
  }

  const base = Number(standardPrice);
  const multiplier = ticketTypeMultipliers[normalizeTicketType(value)];
  return Number.isFinite(base) && multiplier ? base * multiplier : 0;
}

export function formatCurrency(value) {
  const amount = Math.round(Number(value) || 0);
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(amount)} VND`;
}
