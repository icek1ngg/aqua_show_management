package com.asms.booking;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class BookingEntityTest {

    @Test
    void prePersistInitializesIdAndTimestamps() throws Exception {
        Object booking = newBooking();

        invoke(booking, "prePersist");

        assertThat(invoke(booking, "getId")).isNotNull();
        assertThat(invoke(booking, "getCreatedAt")).isNotNull();
        assertThat(invoke(booking, "getUpdatedAt")).isNotNull();
    }

    @Test
    void preUpdateRefreshesUpdatedAt() throws Exception {
        Object booking = newBooking();
        invoke(booking, "prePersist");
        Object originalUpdatedAt = invoke(booking, "getUpdatedAt");

        Thread.sleep(2);
        invoke(booking, "preUpdate");

        assertThat((Comparable) invoke(booking, "getUpdatedAt")).isGreaterThan((Comparable) originalUpdatedAt);
    }

    private Object newBooking() throws Exception {
        Class<?> bookingClass = Class.forName("com.asms.booking.entity.Booking");
        var constructor = bookingClass.getDeclaredConstructor();
        constructor.setAccessible(true);
        return constructor.newInstance();
    }

    private Object invoke(Object target, String methodName) throws Exception {
        Method method = target.getClass().getDeclaredMethod(methodName);
        method.setAccessible(true);
        return method.invoke(target);
    }
}
