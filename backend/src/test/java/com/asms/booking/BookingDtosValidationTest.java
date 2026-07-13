package com.asms.booking;

import com.asms.booking.dto.BookingDtos.CreateBookingItemRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class BookingDtosValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createBookingRequestRequiresIdempotencyKeyAndItems() {
        CreateBookingRequest request = new CreateBookingRequest("", List.of());

        assertThat(fieldErrors(request)).contains("idempotencyKey", "items");
    }

    @Test
    void createBookingRequestValidatesNestedScheduleAndTicketType() {
        CreateBookingRequest request = new CreateBookingRequest(
                "checkout-1", List.of(new CreateBookingItemRequest("", "", 1)));

        assertThat(fieldErrors(request))
                .contains("items[0].scheduleId", "items[0].ticketType");
    }

    @Test
    void createBookingRequestRejectsInvalidItemQuantity() {
        assertThat(fieldErrors(requestWithQuantity(0))).contains("items[0].quantity");
        assertThat(fieldErrors(requestWithQuantity(11))).contains("items[0].quantity");
    }

    @Test
    void createBookingRequestAcceptsOneToTenTickets() {
        assertThat(fieldErrors(requestWithQuantity(1))).isEmpty();
        assertThat(fieldErrors(requestWithQuantity(10))).isEmpty();
    }

    private CreateBookingRequest requestWithQuantity(int quantity) {
        return new CreateBookingRequest(
                "checkout-1",
                List.of(new CreateBookingItemRequest("schedule-1", "STANDARD", quantity))
        );
    }

    private Set<String> fieldErrors(Object request) {
        return validator.validate(request)
                .stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(java.util.stream.Collectors.toSet());
    }
}
