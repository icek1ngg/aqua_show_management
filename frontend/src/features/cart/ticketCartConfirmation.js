import {
  reconcileSelectorState,
  selectedTicketSummary,
  SELECTOR_TICKET_TYPES,
} from './ticketSelectorState.js';

function selectionChanged(state, reconciledState) {
  return SELECTOR_TICKET_TYPES.some((type) => {
    const original = state?.quantities?.[type] || { adult: 0, child: 0, senior: 0 };
    const reconciled = reconciledState.quantities[type] || { adult: 0, child: 0, senior: 0 };
    return original.adult !== reconciled.adult ||
           original.child !== reconciled.child ||
           original.senior !== reconciled.senior;
  });
}

export function createConfirmationLifecycle() {
  let active = true;
  let operation = 0;
  return {
    activate() {
      active = true;
    },
    begin() {
      operation += 1;
      return operation;
    },
    invalidate() {
      operation += 1;
    },
    dispose() {
      active = false;
      operation += 1;
    },
    isCurrent(operationId) {
      return active && operation === operationId;
    },
  };
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
      schedule: freshSchedule,
      state: reconciledState,
      summary,
      notice: 'Ticket availability changed. Review the updated selection, then click Add to Cart again.',
    };
  }
  if (!isCurrent()) return { status: 'stale' };
  commit(summary.lines);
  return { status: 'committed', summary };
}
