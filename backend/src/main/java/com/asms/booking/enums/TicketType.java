package com.asms.booking.enums;

import com.asms.core.exception.BadRequestException;

import java.math.BigDecimal;
import java.util.Locale;

public enum TicketType {
    STANDARD("1.0"), VIP("2.5"), FAMILY("1.5");

    private final BigDecimal multiplier;

    TicketType(String multiplier) {
        this.multiplier = new BigDecimal(multiplier);
    }

    public BigDecimal multiplier() {
        return multiplier;
    }

    public static TicketType parse(String value) {
        String normalized = String.valueOf(value).trim().toUpperCase(Locale.ROOT)
                .replace(" ENTRY", "").replace(" EXPERIENCE", "").replace(" PACKAGE", "").replace(" PASS", "");
        try {
            return TicketType.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unknown ticket type");
        }
    }
}
