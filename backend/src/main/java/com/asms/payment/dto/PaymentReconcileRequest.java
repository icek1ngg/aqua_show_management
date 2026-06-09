package com.asms.payment.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PaymentReconcileRequest(
        @NotNull UUID bookingId
) {
}
