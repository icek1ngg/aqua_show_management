package com.asms.ticketing.dto;

import com.asms.booking.enums.TicketType;
import com.asms.booking.enums.PassengerType;
import com.asms.ticketing.enums.TicketStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class MyTicketDtos {
    private MyTicketDtos() {
    }

    public record MyTicketResponse(
            UUID id,
            UUID bookingId,
            String bookingCode,
            UUID bookingItemId,
            String qrCode,
            TicketStatus status,
            String showName,
            String venueName,
            String scheduleId,
            TicketType ticketType,
            PassengerType passengerType,
            Instant showStartTime,
            Instant showEndTime,
            Instant issuedAt,
            Instant usedAt
    ) {
    }

    public record PageMyTicketResponse(
            List<MyTicketResponse> items,
            int page,
            int size,
            long totalItems,
            int totalPages,
            boolean hasNext,
            boolean hasPrevious
    ) {
    }
}
