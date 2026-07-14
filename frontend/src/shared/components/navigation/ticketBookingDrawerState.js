import { showTicketTarget } from '../../../features/cart/showTicketNavigation.js';

export function createDrawerSelection() {
  return { showId: '', date: '' };
}

export function changeDrawerShow(state, showId) {
  return { ...state, showId: String(showId || ''), date: '' };
}

export function changeDrawerDate(state, date, offeredDates) {
  const nextDate = String(date || '');
  if (!(Array.isArray(offeredDates) ? offeredDates : []).includes(nextDate)) return state;
  return { ...state, date: nextDate };
}

export function drawerDestination(state) {
  if (!state?.showId || !state?.date) return null;
  return showTicketTarget({ showId: state.showId, date: state.date });
}
