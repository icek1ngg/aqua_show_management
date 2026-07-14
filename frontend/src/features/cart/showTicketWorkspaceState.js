export function ticketWorkspaceContentState({ loading, error, schedule }) {
  if (loading) return 'loading';
  if (error) return 'error';
  if (!schedule) return 'empty';
  return 'ready';
}
