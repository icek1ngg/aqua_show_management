export function showTicketTarget({ showId, scheduleId } = {}) {
  const state = { scrollTo: 'ticket-workspace' };
  if (showId) state.ticketSelectionShowId = String(showId);
  if (scheduleId) state.ticketSelectionScheduleId = String(scheduleId);
  return { to: '/shows', state };
}
