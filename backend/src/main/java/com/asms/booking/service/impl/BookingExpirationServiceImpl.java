package com.asms.booking.service.impl;

import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.BookingExpirationProcessor;
import com.asms.booking.service.BookingExpirationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class BookingExpirationServiceImpl implements BookingExpirationService {

    private static final Logger log = LoggerFactory.getLogger(BookingExpirationServiceImpl.class);

    private final BookingRepository bookingRepository;
    private final BookingExpirationProcessor processor;
    private final int batchSize;

    public BookingExpirationServiceImpl(
            BookingRepository bookingRepository,
            BookingExpirationProcessor processor,
            @Value("${asms.booking.expiration-batch-size:100}") int batchSize
    ) {
        this.bookingRepository = bookingRepository;
        this.processor = processor;
        this.batchSize = Math.max(1, batchSize);
    }

    @Override
    public int expireOverdueBookings() {
        Instant now = Instant.now();
        int expired = 0;
        for (UUID bookingId : bookingRepository.findExpirationCandidateIds(now, PageRequest.of(0, batchSize))) {
            try {
                if (processor.expireIfOverdue(bookingId, now)) {
                    expired++;
                }
            } catch (RuntimeException exception) {
                log.warn("Failed to expire overdue booking: bookingId={}", bookingId, exception);
            }
        }
        return expired;
    }
}
