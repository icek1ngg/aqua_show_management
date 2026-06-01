package com.asms.booking.dto;

import com.asms.booking.enums.BookingStatus;
import com.asms.notification.enums.EmailNotificationStatus;
import com.asms.notification.enums.EmailNotificationType;
import com.asms.payment.enums.PaymentStatus;
import com.asms.ticketing.enums.TicketStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class BookingDtos {

    private BookingDtos() {
    }

    public record CreateBookingRequest(
            @NotBlank(message = "Show ID is required")
            String showId,

            @NotBlank(message = "Schedule ID is required")
            String scheduleId,

            @NotBlank(message = "Show name is required")
            String showName,

            @NotNull(message = "Show date is required")
            @FutureOrPresent(message = "Show date must be today or in the future")
            LocalDate showDate,

            @NotBlank(message = "Ticket type is required")
            String ticketType,

            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 10, message = "Quantity must not exceed 10")
            Integer quantity
    ) {
    }

    public record CreateBookingResponse(
            UUID requestId,
            String holdId,
            BookingStatus status,
            String message,
            Instant expiresAt
    ) {
    }

    public record BookingResponse(
            UUID id,
            String bookingCode,
            String holdId,
            String showId,
            String scheduleId,
            String showName,
            LocalDate showDate,
            String ticketType,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal totalAmount,
            BookingStatus status,
            Instant createdAt,
            Instant expiresAt,
            PaymentSummary payment,
            TicketSummary tickets,
            EmailNotificationSummary emailNotification
    ) {
    }

    public record PaymentSummary(
            UUID id,
            String payosOrderCode,
            String transactionId,
            BigDecimal amount,
            PaymentStatus status,
            Instant paidAt,
            Instant createdAt
    ) {
    }

    public record TicketSummary(
            int total,
            int valid,
            int used,
            int expired,
            List<TicketDetail> items
    ) {
    }

    public record TicketDetail(
            UUID id,
            String qrCode,
            TicketStatus status,
            Instant issuedAt,
            Instant usedAt
    ) {
    }

    public record EmailNotificationSummary(
            UUID id,
            EmailNotificationType emailType,
            EmailNotificationStatus status,
            Instant sentAt,
            Instant createdAt
    ) {
    }

    public record PageBookingResponse(
            List<BookingResponse> items,
            int page,
            int size,
            long totalItems,
            int totalPages,
            boolean hasNext,
            boolean hasPrevious
    ) {
    }

    public record BookingMessage(
            UUID requestId,
            String holdId,
            UUID userId,
            String userEmail,
            String showId,
            String scheduleId,
            String showName,
            LocalDate showDate,
            String ticketType,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal totalAmount,
            Instant expiresAt,
            Instant createdAt
    ) {
    }

    public record DevSampleBookingRequest(
            @NotNull(message = "Amount is required")
            @Positive(message = "Amount must be positive")
            BigDecimal amount,

            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 10, message = "Quantity must not exceed 10")
            Integer quantity,

            @Min(value = 5, message = "Expiration must be at least 5 minutes")
            @Max(value = 1440, message = "Expiration must not exceed 1440 minutes")
            Integer expiresInMinutes
    ) {
    }

    public record DevSampleBookingBatchRequest(
            @NotNull(message = "Amounts are required")
            List<@Positive(message = "Amount must be positive") BigDecimal> amounts,

            @Min(value = 5, message = "Expiration must be at least 5 minutes")
            @Max(value = 1440, message = "Expiration must not exceed 1440 minutes")
            Integer expiresInMinutes
    ) {
    }

    public record DevSampleBookingResponse(
            BookingResponse booking,
            String paymentPageUrl,
            String createPaymentApi
    ) {
    }
}
