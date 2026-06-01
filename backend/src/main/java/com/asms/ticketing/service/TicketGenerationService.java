package com.asms.ticketing.service;

import com.asms.booking.entity.Booking;
import com.asms.ticketing.entity.Ticket;

import java.util.List;

public interface TicketGenerationService {

    List<Ticket> generateTicketsIfMissing(Booking booking);
}
