package com.asms.payment.messaging;

import java.time.Instant;
import java.util.UUID;

public record PaymentCompletedMessage(
        UUID bookingId,
        UUID paymentId,
        String payosOrderCode,
        Instant paidAt
) {
}
