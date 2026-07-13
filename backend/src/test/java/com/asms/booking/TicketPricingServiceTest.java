package com.asms.booking;

import com.asms.booking.enums.TicketType;
import com.asms.booking.service.TicketPricingService;
import com.asms.core.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TicketPricingServiceTest {
    private final TicketPricingService pricing = new TicketPricingService();

    @ParameterizedTest
    @CsvSource({"STANDARD,2500,2500.00", "VIP,2500,6250.00", "FAMILY,2500,3750.00"})
    void calculatesPriceFromScheduleBasePrice(String rawType, String base, String expected) {
        assertThat(pricing.unitPrice(new BigDecimal(base), TicketType.parse(rawType)))
                .isEqualByComparingTo(expected);
    }

    @Test
    void rejectsUnknownTicketType() {
        assertThatThrownBy(() -> TicketType.parse("GOLD"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Unknown ticket type");
    }
}
