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
