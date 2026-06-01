export const mockBookingDetail = {
  id: '00000000-0000-4000-8000-000000088219',
  status: 'PENDING_PAYMENT',
  totalQuantity: 4,
  totalAmount: 156,
  createdAt: '2026-05-31T10:30:00Z',
  expiredAt: new Date(Date.now() + 13 * 60 * 1000).toISOString(),
  show: {
    id: 'show-midnight-aqua',
    title: 'Midnight Aqua Symphony',
    description:
      'A cinematic water performance with synchronized fountains, light choreography, and immersive sound.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBQJ-Fo4HDO72JbLax0CiFqctWCGXvU4YEfKNT6BKoii53LhvXYm3tK9deyNpu3SQhQuDwXH4brHWFob4XTMXC0igb1FTIelijgurjSK40wqc_V-h4hB2iXApJSw4tuIL9RRKwcdhGhhcgV9V5pOtwPQGvlVc5CRVwmmWl5xWGLSkDEXdqrpRF327LZc7RzHHIIOK5u5seDmxx49urrFLxksqEEDJ5_xPJn8EULd2-53B3FmPiCpcXrt3oMMoWR8T3lZdXTQe3xXQ',
    durationMinutes: 45,
    basePrice: 39,
  },
  schedule: {
    id: 'schedule-midnight-aqua',
    startTime: '2026-06-15T13:00:00Z',
    endTime: '2026-06-15T13:45:00Z',
    venueName: 'Main Plaza Pool',
    venueAddress: 'AquaPulse Main Gate',
  },
  payment: {
    id: 'payment-mock',
    payosOrderCode: 'ASMSMOCK88219',
    transactionId: null,
    amount: 156,
    paymentLink: null,
    status: 'PENDING',
    paidAt: null,
    createdAt: '2026-05-31T10:31:00Z',
  },
  tickets: {
    total: 0,
    valid: 0,
    used: 0,
    expired: 0,
  },
  emailNotification: {
    type: 'QR_TICKET',
    status: 'PENDING',
    sentAt: null,
    createdAt: '2026-05-31T10:31:00Z',
  },
};

export function getMockBookingDetail(bookingId, status = 'PENDING_PAYMENT') {
  const normalizedStatus = status?.toUpperCase?.() || 'PENDING_PAYMENT';
  const paid = normalizedStatus === 'PAID' || normalizedStatus === 'SUCCESS';
  const failed = normalizedStatus === 'FAILED';
  const expired = normalizedStatus === 'EXPIRED';

  return {
    ...mockBookingDetail,
    id: bookingId || mockBookingDetail.id,
    status: paid ? 'PAID' : failed ? 'FAILED' : expired ? 'EXPIRED' : 'PENDING_PAYMENT',
    expiredAt: expired ? new Date(Date.now() - 60 * 1000).toISOString() : new Date(Date.now() + 13 * 60 * 1000).toISOString(),
    payment: {
      ...mockBookingDetail.payment,
      status: paid ? 'SUCCESS' : failed ? 'FAILED' : expired ? 'EXPIRED' : 'PENDING',
      paidAt: paid ? new Date().toISOString() : null,
      transactionId: paid ? 'TRX-MOCK-88219' : null,
    },
    tickets: paid ? { total: 4, valid: 4, used: 0, expired: 0 } : mockBookingDetail.tickets,
    emailNotification: {
      ...mockBookingDetail.emailNotification,
      status: paid ? 'SENT' : failed ? 'FAILED' : 'PENDING',
      sentAt: paid ? new Date().toISOString() : null,
    },
  };
}

export function getMockPaymentResponse(bookingId) {
  return {
    bookingId,
    paymentId: 'payment-mock',
    payosOrderCode: 'ASMSMOCK88219',
    paymentUrl: `/mock/payos-checkout?bookingId=${encodeURIComponent(bookingId)}&orderCode=ASMSMOCK88219&amount=156000`,
    checkoutUrl: `/mock/payos-checkout?bookingId=${encodeURIComponent(bookingId)}&orderCode=ASMSMOCK88219&amount=156000`,
    qrCode: null,
    paymentLinkId: 'mock-payment-link',
    bankBin: null,
    accountNumber: null,
    accountName: null,
    amount: 156000,
    description: 'ASMSMOCK88219',
    status: 'PENDING',
    expiresInSeconds: 13 * 60,
  };
}

export function getMockTicketValidation(qrCode) {
  const normalizedQr = qrCode.trim().toUpperCase();
  const now = new Date().toISOString();

  if (normalizedQr.includes('USED')) {
    return {
      result: 'ALREADY_USED',
      message: 'Ticket has already been used',
      ticket: { id: 'ticket-used', qrCode, status: 'USED', issuedAt: now, usedAt: now },
      booking: { id: mockBookingDetail.id, status: 'PAID', totalQuantity: 4 },
      show: { title: mockBookingDetail.show.title, venueName: mockBookingDetail.schedule.venueName, startTime: mockBookingDetail.schedule.startTime, endTime: mockBookingDetail.schedule.endTime },
      checkedInAt: now,
      checkInLogId: 'log-used',
    };
  }

  if (normalizedQr.includes('EXPIRED')) {
    return {
      result: 'EXPIRED',
      message: 'Ticket or show schedule has expired',
      ticket: { id: 'ticket-expired', qrCode, status: 'EXPIRED', issuedAt: now, usedAt: null },
      booking: { id: mockBookingDetail.id, status: 'PAID', totalQuantity: 4 },
      show: { title: mockBookingDetail.show.title, venueName: mockBookingDetail.schedule.venueName, startTime: mockBookingDetail.schedule.startTime, endTime: mockBookingDetail.schedule.endTime },
      checkedInAt: now,
      checkInLogId: 'log-expired',
    };
  }

  if (normalizedQr.includes('INVALID')) {
    return {
      result: 'INVALID_QR',
      message: 'Ticket QR code was not found',
      ticket: null,
      booking: null,
      show: null,
      checkedInAt: now,
      checkInLogId: 'log-invalid',
    };
  }

  return {
    result: 'SUCCESS',
    message: 'Ticket checked in successfully',
    ticket: { id: 'ticket-valid', qrCode, status: 'USED', issuedAt: now, usedAt: now },
    booking: { id: mockBookingDetail.id, status: 'PAID', totalQuantity: 4 },
    show: { title: mockBookingDetail.show.title, venueName: mockBookingDetail.schedule.venueName, startTime: mockBookingDetail.schedule.startTime, endTime: mockBookingDetail.schedule.endTime },
    checkedInAt: now,
    checkInLogId: 'log-success',
  };
}
