package com.asms.ticketing.service;

import com.asms.identity.entity.User;
import com.asms.ticketing.dto.MyTicketDtos.PageMyTicketResponse;

import java.util.UUID;

public interface UserTicketService {
    PageMyTicketResponse getMyTickets(User user, int page, int size, String keyword, String status, UUID bookingId);
}
