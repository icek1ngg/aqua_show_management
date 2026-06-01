package com.asms.payment.dto;

import com.asms.payment.enums.PaymentStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePaymentResponse(
        UUID bookingId,
        UUID paymentId,
        String payosOrderCode,
        String paymentUrl,
        String checkoutUrl,
        String qrCode,
        String paymentLinkId,
        String bankBin,
        String accountNumber,
        String accountName,
        BigDecimal amount,
        String description,
        PaymentStatus status,
        long expiresInSeconds
) {
}
