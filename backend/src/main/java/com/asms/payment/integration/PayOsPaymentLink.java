package com.asms.payment.integration;

import java.math.BigDecimal;

public record PayOsPaymentLink(
        String checkoutUrl,
        String qrCode,
        String paymentLinkId,
        String bin,
        String accountNumber,
        String accountName,
        BigDecimal amount,
        String description
) {
}
