function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function getRoutedPaymentSession(routeState, bookingId) {
  const candidate = routeState?.paymentSession;

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return null;
  }

  const matchesBooking = hasText(candidate.bookingId)
    && hasText(bookingId)
    && candidate.bookingId === bookingId;
  const hasIdentity = hasText(candidate.paymentId) && hasText(candidate.payosOrderCode);
  const hasPaymentDetails = Number.isFinite(Number(candidate.amount))
    && Number(candidate.amount) > 0
    && hasText(candidate.status);

  if (!matchesBooking || !hasIdentity || !hasPaymentDetails) {
    return null;
  }

  return candidate;
}
