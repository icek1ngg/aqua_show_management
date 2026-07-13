package com.asms.ticketing.service.impl;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.repository.TicketRepository;
import com.asms.ticketing.service.TicketGenerationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Service
public class TicketGenerationServiceImpl implements TicketGenerationService {

    private final TicketRepository ticketRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public TicketGenerationServiceImpl(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Override
    @Transactional
    public List<Ticket> generateTicketsIfMissing(Booking booking) {
        if (ticketRepository.existsByBooking_Id(booking.getId())) {
            return ticketRepository.findByBooking_Id(booking.getId());
        }

        List<Ticket> tickets = new ArrayList<>();
        for (BookingItem item : booking.getItems()) {
            for (int index = 1; index <= item.getQuantity(); index++) {
                tickets.add(new Ticket(booking, item, buildQrCode(booking, item, index)));
            }
        }

        return ticketRepository.saveAll(tickets);
    }

    private String buildQrCode(Booking booking, BookingItem item, int index) {
        byte[] randomBytes = new byte[8];
        secureRandom.nextBytes(randomBytes);
        return "ASMS:" + booking.getId() + ":" + item.getId() + ":" + index + ":"
                + HexFormat.of().formatHex(randomBytes);
    }
}
