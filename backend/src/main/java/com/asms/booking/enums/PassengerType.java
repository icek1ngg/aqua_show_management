package com.asms.booking.enums;

import com.asms.core.exception.BadRequestException;

import java.util.Locale;

public enum PassengerType {
    ADULT,
    CHILD,
    SENIOR;

    public static PassengerType parse(String value) {
        if (value == null || value.isBlank()) return ADULT;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unknown passenger type");
        }
    }
}
