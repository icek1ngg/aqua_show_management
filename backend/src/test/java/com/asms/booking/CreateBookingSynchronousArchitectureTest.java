package com.asms.booking;

import com.asms.booking.service.impl.BookingServiceImpl;
import com.asms.payment.config.PaymentRabbitConfig;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.support.converter.MessageConverter;

import java.lang.reflect.Method;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class CreateBookingSynchronousArchitectureTest {

    @Test
    void bookingServiceHasNoRabbitMqDependency() {
        boolean hasBookingRabbitDependency = Arrays.stream(BookingServiceImpl.class.getDeclaredConstructors())
                .flatMap(constructor -> Arrays.stream(constructor.getParameterTypes()))
                .map(Class::getName)
                .anyMatch(name -> name.contains("RabbitMQBooking") || name.contains("BookingPublisher"));

        assertThat(hasBookingRabbitDependency).isFalse();
    }

    @Test
    void paymentRabbitConfigOwnsTheJsonMessageConverter() {
        Method converterFactory = Arrays.stream(PaymentRabbitConfig.class.getDeclaredMethods())
                .filter(method -> MessageConverter.class.isAssignableFrom(method.getReturnType()))
                .findFirst()
                .orElse(null);

        assertThat(converterFactory).isNotNull();
    }
}
