export const ticketTypeOptions = [
  { value: 'STANDARD', label: 'Standard Entry' },
  { value: 'VIP', label: 'VIP Entry' },
  { value: 'FAMILY', label: 'Family Package' },
];

const ticketTypePrices = {
  STANDARD: 2000,
  VIP: 5000,
  FAMILY: 3000,
};

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

export function getTicketTypePrice(value) {
  return ticketTypePrices[normalizeTicketType(value)] ?? ticketTypePrices.STANDARD;
}

export function formatCurrency(value) {
  const amount = Number(value);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}
