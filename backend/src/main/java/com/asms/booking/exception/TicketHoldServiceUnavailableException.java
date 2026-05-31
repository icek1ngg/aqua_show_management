package com.asms.booking.exception;

import com.asms.core.exception.ServiceUnavailableException;

public class TicketHoldServiceUnavailableException extends ServiceUnavailableException {

    public TicketHoldServiceUnavailableException(String message) {
        super(message);
    }
}
