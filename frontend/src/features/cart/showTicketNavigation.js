export const SHOWS_ROUTE_REDIRECT = '/';
export const SHOW_CATALOG_TARGET = '/#shows';

export function isDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function showTicketTarget({ showId, date } = {}) {
  if (!showId) return SHOW_CATALOG_TARGET;
  const path = `/shows/${encodeURIComponent(String(showId))}`;
  const query = isDateKey(date) ? `?date=${date}` : '';
  return `${path}${query}#ticket-workspace`;
}
