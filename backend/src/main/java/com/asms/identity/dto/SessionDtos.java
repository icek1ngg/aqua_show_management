package com.asms.identity.dto;

import com.asms.identity.entity.User;

import java.time.Instant;
import java.util.UUID;

public final class SessionDtos {

    private SessionDtos() {
    }

    public record ClientContext(
            String userAgent,
            String ipAddress
    ) {
    }

    public record SessionIssue(
            String token,
            long cookieMaxAgeSeconds
    ) {
    }

    public record SessionRotation(
            String token,
            long cookieMaxAgeSeconds,
            User user
    ) {
    }

    public record SessionView(
            UUID id,
            Instant createdAt,
            Instant lastSeenAt,
            String device,
            String ipPrefix,
            boolean isCurrent
    ) {
    }
}
