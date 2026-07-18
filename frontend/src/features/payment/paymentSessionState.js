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

export function shouldPollPayment(booking, paymentSession) {
  const hasPaymentContext = Boolean(paymentSession || booking?.payment);
  if (!hasPaymentContext) {
    return false;
  }

  const bookingStatus = String(booking?.status || '').trim().toUpperCase();
  const paymentStatus = String(paymentSession?.status || booking?.payment?.status || '').trim().toUpperCase();
  return !['PAID', 'EXPIRED', 'FAILED'].includes(bookingStatus)
    && !['EXPIRED', 'FAILED'].includes(paymentStatus);
}

export async function pollPaymentOnce({ bookingId, reconcile, loadBooking }) {
  try {
    await reconcile(bookingId);
  } catch {
    // Webhook or backend reconciliation may still have updated PostgreSQL.
  }

  return loadBooking();
}
