package com.asms.booking.dto;

import java.time.Instant;
import java.util.UUID;

public final class TicketHoldDtos {

    private TicketHoldDtos() {
    }

    public record HoldResult(
            boolean success,
            String holdId,
            String message,
            Instant expiresAt,
            int remainingAvailable
    ) {
        public HoldResult(boolean success, String holdId, String message, Instant expiresAt) {
            this(success, holdId, message, expiresAt, 0);
        }
    }

    public record TicketHoldInfo(
            String holdId,
            String scheduleId,
            String ticketType,
            int quantity,
            UUID userId,
            Instant createdAt,
            Instant expiresAt
    ) {
    }
}
