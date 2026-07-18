package com.asms.booking;

/** Shared booking limits enforced by every production booking entry point. */
public final class BookingPolicy {

    public static final int MAX_TICKETS_PER_BOOKING = 10;
    public static final int MAX_BOOKING_LINES = 20;

    private BookingPolicy() {
    }
}
