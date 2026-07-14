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

export function createTicketWorkspaceResolution({
  shows,
  requestedShowId = '',
  requestedScheduleId = '',
  fallbackShow = null,
  loadShow,
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
  };
}
