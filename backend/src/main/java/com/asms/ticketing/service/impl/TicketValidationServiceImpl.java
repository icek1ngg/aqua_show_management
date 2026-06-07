package com.asms.ticketing.service.impl;

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
import com.asms.ticketing.service.TicketValidationService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class TicketValidationServiceImpl implements TicketValidationService {

    private static final Logger log = LoggerFactory.getLogger(TicketValidationServiceImpl.class);
    private static final long DUPLICATE_FAILURE_LOG_COOLDOWN_SECONDS = 8;

    private final TicketRepository ticketRepository;
    private final CheckInLogRepository checkInLogRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public TicketValidationServiceImpl(TicketRepository ticketRepository, CheckInLogRepository checkInLogRepository) {
        this.ticketRepository = ticketRepository;
        this.checkInLogRepository = checkInLogRepository;
    }

    @Override
    @Transactional
    public ValidateQrResponse validateQr(ValidateQrRequest request, User staff) {
        long startedAt = System.nanoTime();
        String outcome = "UNKNOWN";

        try {
            String qrCode = request == null || request.qrCode() == null ? "" : request.qrCode().trim();
            if (qrCode.isBlank()) {
                CheckInLog checkInLog = checkInLogRepository.save(new CheckInLog(null, staff, CheckInResult.INVALID_QR, "QR code is required"));
                outcome = CheckInResult.INVALID_QR.name();
                return new ValidateQrResponse("INVALID_QR", "QR code is required", null, null, null, checkInLog.getCheckInTime(), checkInLog.getId());
            }

            Optional<Ticket> optionalTicket = ticketRepository.findByQrCodeWithBooking(qrCode);

            if (optionalTicket.isEmpty()) {
                CheckInLog checkInLog = checkInLogRepository.save(new CheckInLog(null, staff, CheckInResult.INVALID_QR, "Ticket QR code was not found"));
                outcome = "TICKET_NOT_FOUND";
                return new ValidateQrResponse("TICKET_NOT_FOUND", "Ticket QR code was not found", null, null, null, checkInLog.getCheckInTime(), checkInLog.getId());
            }

            Ticket ticket = optionalTicket.get();

            if (ticket.getBooking().getStatus() != BookingStatus.PAID) {
                outcome = CheckInResult.BOOKING_NOT_PAID.name();
                return failure(ticket, staff, CheckInResult.BOOKING_NOT_PAID, "Booking is not paid");
            }

            if (ticket.getStatus() == TicketStatus.USED) {
                outcome = CheckInResult.ALREADY_USED.name();
                return failure(ticket, staff, CheckInResult.ALREADY_USED, "Ticket has already been used");
            }

            Instant now = Instant.now();
            if (ticket.getStatus() == TicketStatus.EXPIRED || ticket.getShowEndTime().isBefore(now)) {
                ticket.setStatus(TicketStatus.EXPIRED);
                ticketRepository.save(ticket);
                outcome = CheckInResult.EXPIRED.name();
                return failure(ticket, staff, CheckInResult.EXPIRED, "Ticket or show schedule has expired");
            }

            if (ticket.getStatus() != TicketStatus.VALID) {
                outcome = "INVALID_STATUS";
                return failure(ticket, staff, CheckInResult.INVALID_QR, "INVALID_STATUS", "Ticket status is not valid for check-in");
            }

            int updatedRows = ticketRepository.markUsedIfValid(ticket.getId(), TicketStatus.VALID, TicketStatus.USED, now);
            if (updatedRows == 0) {
                entityManager.refresh(ticket);
                CheckInResult result;
                String message;
                if (ticket.getStatus() == TicketStatus.USED) {
                    result = CheckInResult.ALREADY_USED;
                    message = "Ticket has already been used";
                } else if (ticket.getStatus() == TicketStatus.EXPIRED) {
                    result = CheckInResult.EXPIRED;
                    message = "Ticket or show schedule has expired";
                } else {
                    result = CheckInResult.INVALID_QR;
                    message = "Ticket status changed before check-in completed";
                }
                String responseCode = result == CheckInResult.INVALID_QR ? "INVALID_STATUS" : result.name();
                outcome = responseCode;
                return failure(ticket, staff, result, responseCode, message);
            }

            ticket.setStatus(TicketStatus.USED);
            ticket.setUsedAt(now);
            CheckInLog checkInLog = checkInLogRepository.save(new CheckInLog(ticket, staff, CheckInResult.SUCCESS, null));

            outcome = CheckInResult.SUCCESS.name();
            return toResponse(ticket, checkInLog, "SUCCESS", "Ticket valid - Allow entry");
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Ticket QR validation outcome={} elapsedMs={}", outcome, elapsedMs);
        }
    }

    private ValidateQrResponse failure(Ticket ticket, User staff, CheckInResult result, String message) {
        return failure(ticket, staff, result, result.name(), message);
    }

    private ValidateQrResponse failure(Ticket ticket, User staff, CheckInResult logResult, String responseCode, String message) {
        Instant checkedAfter = Instant.now().minusSeconds(DUPLICATE_FAILURE_LOG_COOLDOWN_SECONDS);
        Optional<CheckInLog> recentDuplicate = checkInLogRepository
                .findFirstByTicket_IdAndStaff_IdAndResultAndCheckInTimeAfterOrderByCheckInTimeDesc(
                        ticket.getId(),
                        staff.getId(),
                        logResult,
                        checkedAfter
                );
        CheckInLog checkInLog = recentDuplicate.orElseGet(
                () -> checkInLogRepository.save(new CheckInLog(ticket, staff, logResult, message))
        );
        return toResponse(ticket, checkInLog, responseCode, message);
    }

    private ValidateQrResponse toResponse(Ticket ticket, CheckInLog log, String result, String message) {
        return new ValidateQrResponse(
                result,
                message,
                new ValidateQrResponse.TicketInfo(
                        ticket.getId(),
                        ticket.getQrCode(),
                        ticket.getStatus(),
                        ticket.getIssuedAt(),
                        ticket.getUsedAt()
                ),
                new ValidateQrResponse.BookingInfo(
                        ticket.getBooking().getId(),
                        ticket.getBooking().getStatus().name(),
                        ticket.getBooking().getQuantity()
                ),
                new ValidateQrResponse.ShowInfo(
                        ticket.getShowName(),
                        ticket.getVenueName(),
                        ticket.getShowStartTime(),
                        ticket.getShowEndTime()
                ),
                log.getCheckInTime(),
                log.getId()
        );
    }
}
