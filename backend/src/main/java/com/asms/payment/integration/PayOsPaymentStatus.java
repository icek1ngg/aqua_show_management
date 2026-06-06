package com.asms.payment.integration;

import com.asms.payment.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record PayOsPaymentStatus(
        String orderCode,
        String providerStatus,
        PaymentStatus paymentStatus,
        String transactionId,
        Instant paidAt,
        BigDecimal amount
) {
}
