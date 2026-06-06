package com.asms.booking.dto;

import com.asms.booking.enums.BookingStatus;
import com.asms.payment.enums.PaymentStatus;
import com.asms.ticketing.enums.TicketStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ManagerBookingDtos {

    private ManagerBookingDtos() {
    }

    public record ManagerBookingResponse(
            UUID id,
            String bookingCode,
            String showId,
            String scheduleId,
            String showName,
            LocalDate showDate,
            String customerEmail,
            String customerName,
            Integer quantity,
            BigDecimal totalAmount,
            BookingStatus status,
            PaymentStatus paymentStatus,
            Instant createdAt,
            Instant expiresAt
    ) {
    }

    public record ManagerBookingDetailResponse(
            ManagerBookingResponse booking,
            PaymentDetail payment,
            List<TicketDetail> tickets
    ) {
    }

    public record PaymentDetail(
            UUID id,
            String payosOrderCode,
            String transactionId,
            BigDecimal amount,
            PaymentStatus status,
            Instant paidAt,
            Instant createdAt
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
}
