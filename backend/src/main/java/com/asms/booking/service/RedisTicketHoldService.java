package com.asms.booking.service;

import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.booking.dto.TicketHoldDtos.TicketHoldInfo;
import com.asms.booking.enums.TicketType;

import java.util.Optional;
import java.util.UUID;

public interface RedisTicketHoldService {

    void initializeInventory(String scheduleId, TicketType type, int persistentAvailable);

    HoldResult holdTickets(String scheduleId, TicketType type, int quantity, UUID userId);

    /** Compatibility bridge for callers migrated in a later booking-service task. */
    void initializeInventory(String scheduleId, String ticketType, Integer persistentAvailable);

    /** Compatibility bridge for callers migrated in a later booking-service task. */
    HoldResult holdTickets(String scheduleId, String ticketType, Integer quantity, UUID userId);

    int effectiveAvailability(String scheduleId, TicketType type, int persistentAvailable);

    void releaseHold(String holdId);

    Optional<TicketHoldInfo> getHold(String holdId);

    boolean isHoldValid(String holdId);
}
