import { chooseBookableSchedule } from '../cart/ticketSelectorState.js';

export async function resolveTicketWorkspaceShow(
  shows,
  requestedShowId,
  fallbackShow,
  loadShow,
) {
  if (!requestedShowId) return fallbackShow || null;
  const requestedId = String(requestedShowId);
  const catalogShow = (Array.isArray(shows) ? shows : [])
    .find((show) => String(show?.id || '') === requestedId);
  return catalogShow || loadShow(requestedId);
}

export async function resolveNearestBookableWorkspace(shows, loadSchedules, now = Date.now()) {
  const activeShows = Array.isArray(shows) ? shows : [];
  const results = await Promise.allSettled(activeShows.map(async (show) => {
    const schedules = await loadSchedules(show.id);
    const schedule = chooseBookableSchedule(schedules, '', now);
    return schedule ? { show, schedule } : null;
  }));
  const failures = results.flatMap((result, index) => (
    result.status === 'rejected'
      ? [{ showId: String(activeShows[index]?.id || ''), reason: result.reason }]
      : []
  ));
  if (failures.length > 0) {
    const error = new Error('Could not confirm schedules for every active show. Please try again.');
    error.failures = failures;
    throw error;
  }
  const selected = results
    .map((result) => result.value)
    .filter(Boolean)
    .sort((first, second) => (
      new Date(first.schedule.startTime).getTime() - new Date(second.schedule.startTime).getTime()
    ))[0];
  return selected
    ? { show: selected.show, scheduleId: String(selected.schedule.id || selected.schedule.scheduleId || '') }
    : null;
}

export function createTicketWorkspaceResolution({
  shows,
  requestedShowId = '',
  requestedScheduleId = '',
  fallbackShow = null,
  loadShow,
  loadSchedules,
}) {
  const intent = {
    requestedShowId: String(requestedShowId || ''),
    requestedScheduleId: String(requestedScheduleId || ''),
  };
  return {
    intent,
    resolve: () => resolveTicketWorkspaceShow(
      shows,
      intent.requestedShowId,
      fallbackShow,
      loadShow,
    ),
    resolveTarget: async () => {
      if (!intent.requestedShowId) {
        return resolveNearestBookableWorkspace(shows, loadSchedules);
      }
      const show = await resolveTicketWorkspaceShow(
        shows,
        intent.requestedShowId,
        fallbackShow,
        loadShow,
      );
      return show ? { show, scheduleId: intent.requestedScheduleId } : null;
    },
  };
}
