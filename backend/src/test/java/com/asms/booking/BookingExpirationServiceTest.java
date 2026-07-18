package com.asms.booking;

import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.BookingExpirationProcessor;
import com.asms.booking.service.impl.BookingExpirationServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingExpirationServiceTest {

    @Test
    void batchContinuesAfterOneCandidateFails() {
        BookingRepository bookingRepository = mock(BookingRepository.class);
        BookingExpirationProcessor processor = mock(BookingExpirationProcessor.class);
        BookingExpirationServiceImpl service = new BookingExpirationServiceImpl(
                bookingRepository,
                processor,
                2
        );
        UUID failedId = UUID.randomUUID();
        UUID expiredId = UUID.randomUUID();
        when(bookingRepository.findExpirationCandidateIds(any(Instant.class), any(Pageable.class)))
                .thenReturn(List.of(failedId, expiredId));
        when(processor.expireIfOverdue(any(UUID.class), any(Instant.class)))
                .thenThrow(new IllegalStateException("lock timeout"))
                .thenReturn(true);

        int expired = service.expireOverdueBookings();

        assertThat(expired).isEqualTo(1);
        verify(processor).expireIfOverdue(eq(failedId), any(Instant.class));
        verify(processor).expireIfOverdue(eq(expiredId), any(Instant.class));
    }
}
