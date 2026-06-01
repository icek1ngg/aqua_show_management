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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class TicketValidationServiceImpl implements TicketValidationService {

    private final TicketRepository ticketRepository;
    private final CheckInLogRepository checkInLogRepository;

    public TicketValidationServiceImpl(TicketRepository ticketRepository, CheckInLogRepository checkInLogRepository) {
        this.ticketRepository = ticketRepository;
        this.checkInLogRepository = checkInLogRepository;
    }

    @Override
    @Transactional
    public ValidateQrResponse validateQr(ValidateQrRequest request, User staff) {
        String qrCode = request.qrCode().trim();
        Optional<Ticket> optionalTicket = ticketRepository.findByQrCode(qrCode);

        if (optionalTicket.isEmpty()) {
            CheckInLog log = checkInLogRepository.save(new CheckInLog(null, staff, CheckInResult.INVALID_QR, "Ticket QR code was not found"));
            return new ValidateQrResponse("INVALID_QR", "Ticket QR code was not found", null, null, null, log.getCheckInTime(), log.getId());
        }

        Ticket ticket = optionalTicket.get();

        if (ticket.getBooking().getStatus() != BookingStatus.PAID) {
            return failure(ticket, staff, CheckInResult.BOOKING_NOT_PAID, "Booking is not paid");
        }

        if (ticket.getStatus() == TicketStatus.USED) {
            return failure(ticket, staff, CheckInResult.ALREADY_USED, "Ticket has already been used");
        }

        if (ticket.getStatus() == TicketStatus.EXPIRED || ticket.getShowEndTime().isBefore(Instant.now())) {
            ticket.setStatus(TicketStatus.EXPIRED);
            ticketRepository.save(ticket);
            return failure(ticket, staff, CheckInResult.EXPIRED, "Ticket or show schedule has expired");
        }

        ticket.setStatus(TicketStatus.USED);
        ticket.setUsedAt(Instant.now());
        ticketRepository.save(ticket);
        CheckInLog log = checkInLogRepository.save(new CheckInLog(ticket, staff, CheckInResult.SUCCESS, null));

        return toResponse(ticket, log, "SUCCESS", "Ticket checked in successfully");
    }

    private ValidateQrResponse failure(Ticket ticket, User staff, CheckInResult result, String message) {
        CheckInLog log = checkInLogRepository.save(new CheckInLog(ticket, staff, result, message));
        return toResponse(ticket, log, result.name(), message);
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
