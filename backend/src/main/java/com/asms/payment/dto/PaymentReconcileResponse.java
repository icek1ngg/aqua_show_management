package com.asms.payment.dto;

import com.asms.booking.enums.BookingStatus;
import com.asms.payment.enums.PaymentStatus;

import java.time.Instant;
import java.util.UUID;

public record PaymentReconcileResponse(
        UUID bookingId,
        UUID paymentId,
        String orderCode,
        String providerStatus,
        PaymentStatus paymentStatus,
        BookingStatus bookingStatus,
        Instant paidAt,
        boolean reconciled,
        String message
) {
}
