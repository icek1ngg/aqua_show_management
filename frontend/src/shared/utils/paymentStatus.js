const TERMINAL_BOOKING_STATUSES = new Set(['PAID', 'EXPIRED', 'FAILED']);
const PAID_STATUSES = new Set(['PAID', 'SUCCESS', 'SUCCESSFUL']);

function normalizeStatus(value) {
  return value ? String(value).trim().toUpperCase() : '';
}

export function isPaidStatus(status) {
  return PAID_STATUSES.has(normalizeStatus(status));
}

export function isTerminalBookingStatus(status) {
  const normalized = typeof status === 'object' ? status?.status : status;
  return TERMINAL_BOOKING_STATUSES.has(normalizeStatus(normalized));
}

export function normalizeBookingPaymentStatus(booking, payment = booking?.payment) {
  const bookingStatus = normalizeStatus(booking?.status) || 'PROCESSING';
  const paymentStatus = normalizeStatus(payment?.status);

  // PostgreSQL detail/history responses are authoritative; this only keeps temporary UI state consistent.
  if (isPaidStatus(bookingStatus)) {
    return {
      status: 'PAID',
      bookingStatus,
      paymentStatus: paymentStatus || 'SUCCESS',
      label: 'Paid',
    };
  }

  if (isPaidStatus(paymentStatus) && bookingStatus === 'PROCESSING') {
    return {
      status: 'PROCESSING',
      bookingStatus,
      paymentStatus,
      label: 'Payment received, processing',
    };
  }

  if (bookingStatus === 'EXPIRED' || paymentStatus === 'EXPIRED') {
    return {
      status: 'EXPIRED',
      bookingStatus,
      paymentStatus: paymentStatus || 'EXPIRED',
      label: 'Expired',
    };
  }

  if (bookingStatus === 'FAILED' || paymentStatus === 'FAILED') {
    return {
      status: 'FAILED',
      bookingStatus,
      paymentStatus: paymentStatus || 'FAILED',
      label: 'Failed',
    };
  }

  if (bookingStatus === 'PENDING_PAYMENT' || paymentStatus === 'PENDING') {
    return {
      status: 'PENDING_PAYMENT',
      bookingStatus,
      paymentStatus: paymentStatus || 'PENDING',
      label: 'Pending payment',
    };
  }

  return {
    status: bookingStatus,
    bookingStatus,
    paymentStatus: paymentStatus || 'PENDING',
    label: bookingStatus.replaceAll('_', ' ').toLowerCase(),
  };
}
