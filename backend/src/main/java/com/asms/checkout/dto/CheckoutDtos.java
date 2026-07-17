package com.asms.checkout.dto;

import com.asms.payment.dto.CreatePaymentResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class CheckoutDtos {
    private CheckoutDtos() {}

    public record CheckoutItemRequest(
            @NotNull(message = "Schedule ID is required") String scheduleId,
            @NotNull(message = "Ticket type is required") String ticketType,
            @NotNull(message = "Quantity is required") Integer quantity,
            @NotNull(message = "Expected unit price is required") BigDecimal expectedUnitPrice
    ) {}

    public record StartPaymentRequest(
            @NotNull(message = "Idempotency key is required") String idempotencyKey,
            @NotEmpty(message = "Items are required") @Size(max = 20) List<@Valid CheckoutItemRequest> items
    ) {}

    public record StartPaymentResponse(
            String bookingId,
            String bookingStatus,
            Instant expiresAt,
            List<Object> items,
            Integer totalQuantity,
            BigDecimal totalAmount,
            CreatePaymentResponse payment
    ) {}

    public record CheckoutReviewItem(
            String scheduleId,
            String ticketType,
            Integer requestedQuantity,
            Integer availableQuantity,
            BigDecimal expectedUnitPrice,
            BigDecimal currentUnitPrice
    ) {}

    public record CheckoutReviewRequiredData(
            List<CheckoutReviewItem> items
    ) {}
}
