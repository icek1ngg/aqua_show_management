package com.asms.booking;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class BookingDtosValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createBookingRequestRejectsMissingRequiredFields() {
        Object request = createBookingRequest("", "", "", null, "", 1);

        assertThat(fieldErrors(request))
                .contains("showId", "scheduleId", "showName", "showDate", "ticketType");
    }

    @Test
    void createBookingRequestRequiresScheduleId() {
        Object request = createBookingRequest(
                "show-1",
                "",
                "Ocean Dreams",
                LocalDate.now(),
                "Standard Entry",
                1
        );

        assertThat(validator.validate(request))
                .anySatisfy(violation -> {
                    assertThat(violation.getPropertyPath().toString()).isEqualTo("scheduleId");
                    assertThat(violation.getMessage()).isEqualTo("Schedule ID is required");
                });
    }

    @Test
    void createBookingRequestRejectsPastDateAndInvalidQuantity() {
        assertThat(fieldErrors(createBookingRequest(
                "show-1",
                "schedule-1",
                "Ocean Dreams",
                LocalDate.now().minusDays(1),
                "Standard Entry",
                1
        ))).contains("showDate");

        assertThat(fieldErrors(createBookingRequest(
                "show-1",
                "schedule-1",
                "Ocean Dreams",
                LocalDate.now(),
                "Standard Entry",
                0
        ))).contains("quantity");

        assertThat(fieldErrors(createBookingRequest(
                "show-1",
                "schedule-1",
                "Ocean Dreams",
                LocalDate.now(),
                "Standard Entry",
                11
        ))).contains("quantity");
    }

    @Test
    void createBookingRequestAcceptsTodayOrFutureDateAndValidQuantity() {
        assertThat(fieldErrors(createBookingRequest(
                "show-1",
                "schedule-1",
                "Ocean Dreams",
                LocalDate.now(),
                "Standard Entry",
                1
        ))).isEmpty();

        assertThat(fieldErrors(createBookingRequest(
                "show-1",
                "schedule-1",
                "Ocean Dreams",
                LocalDate.now().plusDays(1),
                "Standard Entry",
                10
        ))).isEmpty();
    }

    private Object createBookingRequest(
            String showId,
            String scheduleId,
            String showName,
            LocalDate showDate,
            String ticketType,
            Integer quantity
    ) {
        return newRecord(
                "com.asms.booking.dto.BookingDtos$CreateBookingRequest",
                new Class<?>[]{String.class, String.class, String.class, LocalDate.class, String.class, Integer.class},
                showId,
                scheduleId,
                showName,
                showDate,
                ticketType,
                quantity
        );
    }

    private Object newRecord(String className, Class<?>[] parameterTypes, Object... values) {
        try {
            Class<?> recordClass = Class.forName(className);
            Constructor<?> constructor = recordClass.getDeclaredConstructor(parameterTypes);
            return constructor.newInstance(values);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private Set<String> fieldErrors(Object request) {
        return validator.validate(request)
                .stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(java.util.stream.Collectors.toSet());
    }
}
