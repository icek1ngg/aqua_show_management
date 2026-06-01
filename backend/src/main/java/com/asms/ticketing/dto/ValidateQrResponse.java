package com.asms.ticketing.dto;

import com.asms.ticketing.enums.TicketStatus;

import java.time.Instant;
import java.util.UUID;

public record ValidateQrResponse(
        String result,
        String message,
        TicketInfo ticket,
        BookingInfo booking,
        ShowInfo show,
        Instant checkedInAt,
        UUID checkInLogId
) {

    public record TicketInfo(
            UUID id,
            String qrCode,
            TicketStatus status,
            Instant issuedAt,
            Instant usedAt
    ) {
    }

    public record BookingInfo(
            UUID id,
            String status,
            Integer totalQuantity
    ) {
    }

    public record ShowInfo(
            String title,
            String venueName,
            Instant startTime,
            Instant endTime
    ) {
    }
}
