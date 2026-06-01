package com.asms.payment.dto;

import com.asms.booking.enums.BookingStatus;
import com.asms.payment.enums.PaymentStatus;

import java.util.UUID;

public record PaymentCallbackResponse(
        UUID bookingId,
        String payosOrderCode,
        PaymentStatus paymentStatus,
        BookingStatus bookingStatus,
        int generatedTickets
) {
}
