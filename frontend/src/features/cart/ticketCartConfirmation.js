import {
  reconcileSelectorState,
  selectedTicketSummary,
  SELECTOR_TICKET_TYPES,
} from './ticketSelectorState.js';

function selectionChanged(state, reconciledState) {
  return SELECTOR_TICKET_TYPES.some((type) => (
    Number(state?.quantities?.[type] || 0) !== Number(reconciledState.quantities[type] || 0)
  ));
}

export async function confirmTicketSelection({
  schedule,
  state,
  loadSchedule,
  isCurrent,
  commit,
}) {
  const scheduleId = String(schedule?.scheduleId || schedule?.id || '');
  const freshSchedule = await loadSchedule(scheduleId);
  if (!isCurrent()) return { status: 'stale' };

  const reconciledState = reconcileSelectorState(state, freshSchedule);
  const summary = selectedTicketSummary(freshSchedule, reconciledState);
  if (selectionChanged(state, reconciledState)) {
    return {
      status: 'changed',
      state: reconciledState,
      summary,
      notice: 'Ticket availability changed. Review the updated selection, then click Add to Cart again.',
    };
  }
  if (!isCurrent()) return { status: 'stale' };
  commit(summary.lines);
  return { status: 'committed', summary };
}
