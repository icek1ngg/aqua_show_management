package com.asms.ticketing;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.identity.entity.User;
import com.asms.ticketing.dto.ValidateQrRequest;
import com.asms.ticketing.dto.ValidateQrResponse;
import com.asms.ticketing.entity.CheckInLog;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.enums.CheckInResult;
import com.asms.ticketing.enums.TicketStatus;
import com.asms.ticketing.repository.CheckInLogRepository;
import com.asms.ticketing.repository.TicketRepository;
import com.asms.ticketing.service.impl.TicketValidationServiceImpl;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TicketValidationServiceImplTest {

    private TicketRepository ticketRepository;
    private CheckInLogRepository checkInLogRepository;
    private EntityManager entityManager;
    private TicketValidationServiceImpl service;
    private User staff;

    @BeforeEach
    void setUp() {
        ticketRepository = mock(TicketRepository.class);
        checkInLogRepository = mock(CheckInLogRepository.class);
        entityManager = mock(EntityManager.class);
        service = new TicketValidationServiceImpl(ticketRepository, checkInLogRepository);
        ReflectionTestUtils.setField(service, "entityManager", entityManager);
        staff = mock(User.class);
        when(staff.getId()).thenReturn(UUID.randomUUID());
    }

    @Test
    void returnsTicketNotFoundWithStableCode() {
        CheckInLog log = mockLog();
        when(ticketRepository.findByQrCodeWithBooking("missing")).thenReturn(Optional.empty());
        when(checkInLogRepository.save(any(CheckInLog.class))).thenReturn(log);

        ValidateQrResponse response = service.validateQr(new ValidateQrRequest("missing"), staff);

        assertThat(response.result()).isEqualTo("TICKET_NOT_FOUND");
        assertThat(response.checkInLogId()).isEqualTo(log.getId());
    }

    @Test
    void reusesRecentAlreadyUsedLogDuringBackendCooldown() {
        Ticket ticket = mockTicket(TicketStatus.USED);
        CheckInLog recentLog = mockLog();
        UUID ticketId = ticket.getId();
        UUID staffId = staff.getId();
        when(ticketRepository.findByQrCodeWithBooking("used-qr")).thenReturn(Optional.of(ticket));
        when(checkInLogRepository.findFirstByTicket_IdAndStaff_IdAndResultAndCheckInTimeAfterOrderByCheckInTimeDesc(
                eq(ticketId),
                eq(staffId),
                eq(CheckInResult.ALREADY_USED),
                any(Instant.class)
        )).thenReturn(Optional.of(recentLog));

        ValidateQrResponse response = service.validateQr(new ValidateQrRequest("used-qr"), staff);

        assertThat(response.result()).isEqualTo("ALREADY_USED");
        assertThat(response.checkInLogId()).isEqualTo(recentLog.getId());
        verify(checkInLogRepository, never()).save(any(CheckInLog.class));
    }

    @Test
    void marksValidTicketUsedWithSingleAtomicUpdate() {
        Ticket ticket = mockTicket(TicketStatus.VALID);
        CheckInLog successLog = mockLog();
        UUID ticketId = ticket.getId();
        when(ticketRepository.findByQrCodeWithBooking("valid-qr")).thenReturn(Optional.of(ticket));
        when(ticketRepository.markUsedIfValid(eq(ticketId), eq(TicketStatus.VALID), eq(TicketStatus.USED), any(Instant.class))).thenReturn(1);
        when(checkInLogRepository.save(any(CheckInLog.class))).thenReturn(successLog);

        ValidateQrResponse response = service.validateQr(new ValidateQrRequest("valid-qr"), staff);

        assertThat(response.result()).isEqualTo("SUCCESS");
        verify(ticketRepository).markUsedIfValid(eq(ticketId), eq(TicketStatus.VALID), eq(TicketStatus.USED), any(Instant.class));
    }

    @Test
    void concurrentSecondScanReturnsAlreadyUsed() {
        Ticket ticket = mockTicket(TicketStatus.VALID);
        CheckInLog alreadyUsedLog = mockLog();
        UUID ticketId = ticket.getId();
        when(ticket.getStatus()).thenReturn(
                TicketStatus.VALID,
                TicketStatus.VALID,
                TicketStatus.VALID,
                TicketStatus.USED,
                TicketStatus.USED
        );
        when(ticketRepository.findByQrCodeWithBooking("race-qr")).thenReturn(Optional.of(ticket));
        when(ticketRepository.markUsedIfValid(eq(ticketId), eq(TicketStatus.VALID), eq(TicketStatus.USED), any(Instant.class))).thenReturn(0);
        doAnswer(invocation -> null).when(entityManager).refresh(ticket);
        when(checkInLogRepository.save(any(CheckInLog.class))).thenReturn(alreadyUsedLog);

        ValidateQrResponse response = service.validateQr(new ValidateQrRequest("race-qr"), staff);

        assertThat(response.result()).isEqualTo("ALREADY_USED");
    }

    private Ticket mockTicket(TicketStatus status) {
        Ticket ticket = mock(Ticket.class);
        Booking booking = mock(Booking.class);
        when(ticket.getId()).thenReturn(UUID.randomUUID());
        when(ticket.getQrCode()).thenReturn("qr-code");
        when(ticket.getStatus()).thenReturn(status);
        when(ticket.getIssuedAt()).thenReturn(Instant.now().minusSeconds(60));
        when(ticket.getShowStartTime()).thenReturn(Instant.now().minusSeconds(60));
        when(ticket.getShowEndTime()).thenReturn(Instant.now().plusSeconds(3600));
        when(ticket.getShowName()).thenReturn("Aqua Show");
        when(ticket.getVenueName()).thenReturn("Main Pool");
        when(ticket.getBooking()).thenReturn(booking);
        when(booking.getId()).thenReturn(UUID.randomUUID());
        when(booking.getStatus()).thenReturn(BookingStatus.PAID);
        when(booking.getQuantity()).thenReturn(1);
        return ticket;
    }

    private CheckInLog mockLog() {
        CheckInLog log = mock(CheckInLog.class);
        when(log.getId()).thenReturn(UUID.randomUUID());
        when(log.getCheckInTime()).thenReturn(Instant.now());
        return log;
    }
}
