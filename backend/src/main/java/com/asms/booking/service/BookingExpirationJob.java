package com.asms.booking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BookingExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(BookingExpirationJob.class);

    private final BookingExpirationService bookingExpirationService;

    public BookingExpirationJob(BookingExpirationService bookingExpirationService) {
        this.bookingExpirationService = bookingExpirationService;
    }

    @Scheduled(fixedDelayString = "${asms.booking.expiration-delay-ms:60000}")
    public void expireOverdueBookings() {
        try {
            int expired = bookingExpirationService.expireOverdueBookings();
            if (expired > 0) {
                log.info("Expired {} overdue pending bookings", expired);
            }
        } catch (RuntimeException exception) {
            log.error("Automatic booking expiration run failed", exception);
        }
    }
}
