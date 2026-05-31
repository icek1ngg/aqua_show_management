package com.asms.booking.dto;

import com.asms.booking.enums.BookingStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
            Instant expiresAt
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
}
