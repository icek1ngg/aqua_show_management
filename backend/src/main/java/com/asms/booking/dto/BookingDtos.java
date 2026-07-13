package com.asms.booking.dto;

import com.asms.booking.enums.BookingStatus;
import com.asms.booking.enums.TicketType;
import com.asms.notification.enums.EmailNotificationStatus;
import com.asms.notification.enums.EmailNotificationType;
import com.asms.payment.enums.PaymentStatus;
import com.asms.ticketing.enums.TicketStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class BookingDtos {

    private BookingDtos() {
    }

    public record CreateBookingItemRequest(
            @NotBlank(message = "Schedule ID is required")
            String scheduleId,

            @NotBlank(message = "Ticket type is required")
            String ticketType,

            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 10, message = "Quantity must not exceed 10")
            Integer quantity
    ) {
    }

    public record CreateBookingRequest(
            @NotBlank(message = "Idempotency key is required")
            String idempotencyKey,

            @NotEmpty(message = "At least one booking item is required")
            @Size(max = 20, message = "Booking must not contain more than 20 items")
            List<@Valid CreateBookingItemRequest> items
    ) {
        /** Temporary source-compatibility constructor for older tests/clients. */
        public CreateBookingRequest(
                String showId,
                String scheduleId,
                String showName,
                LocalDate showDate,
                String ticketType,
                Integer quantity
        ) {
            this(
                    "legacy:" + UUID.randomUUID(),
                    List.of(new CreateBookingItemRequest(scheduleId, ticketType, quantity))
            );
        }
    }

    public record CreateBookingResponse(
            UUID requestId,
            UUID bookingId,
            String holdId,
            BookingStatus status,
            String message,
            Instant expiresAt,
            List<BookingItemResponse> items,
            Integer totalQuantity,
            BigDecimal totalAmount
    ) {
        public CreateBookingResponse(
                UUID requestId,
                UUID bookingId,
                String holdId,
                BookingStatus status,
                String message,
                Instant expiresAt
        ) {
            this(requestId, bookingId, holdId, status, message, expiresAt, List.of(), 0, BigDecimal.ZERO);
        }
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
            EmailNotificationSummary emailNotification,
            List<BookingItemResponse> items,
            Integer totalQuantity
    ) {
        public BookingResponse(
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
            this(
                    id,
                    bookingCode,
                    holdId,
                    showId,
                    scheduleId,
                    showName,
                    showDate,
                    ticketType,
                    quantity,
                    unitPrice,
                    totalAmount,
                    status,
                    createdAt,
                    expiresAt,
                    payment,
                    tickets,
                    emailNotification,
                    List.of(),
                    quantity
            );
        }
    }

    public record BookingItemResponse(
            UUID id,
            String showId,
            String scheduleId,
            String showName,
            String imageUrl,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String venueName,
            TicketType ticketType,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal
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
