export function detailWorkspaceNotice({ requestedDateUnavailable, requestedDate }) {
  return requestedDateUnavailable && requestedDate
    ? `No tickets remain for ${requestedDate}. Choose another available date or time.`
    : '';
}

export function createWorkspaceRequestTracker() {
  let current = 0;
  return {
    begin() {
      current += 1;
      return current;
    },
    invalidate() {
      current += 1;
    },
    isCurrent(requestId) {
      return current === requestId;
    },
  };
}
