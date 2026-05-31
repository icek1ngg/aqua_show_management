package com.asms.booking.service;

import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.booking.dto.TicketHoldDtos.TicketHoldInfo;

import java.util.Optional;
import java.util.UUID;

public interface RedisTicketHoldService {

    HoldResult holdTickets(String scheduleId, String ticketType, int quantity, UUID userId);

    void releaseHold(String holdId);

    Optional<TicketHoldInfo> getHold(String holdId);

    boolean isHoldValid(String holdId);
}
