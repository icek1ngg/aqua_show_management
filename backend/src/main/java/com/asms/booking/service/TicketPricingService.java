package com.asms.booking.service;

import com.asms.booking.enums.TicketType;
import com.asms.core.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class TicketPricingService {
    public BigDecimal unitPrice(BigDecimal standardPrice, TicketType type) {
        if (standardPrice == null || standardPrice.signum() <= 0) {
            throw new BadRequestException("Standard price must be greater than 0");
        }
        return standardPrice.multiply(type.multiplier()).setScale(2, RoundingMode.HALF_UP);
    }
}
