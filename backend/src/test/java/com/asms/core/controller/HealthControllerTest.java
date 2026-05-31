package com.asms.core.controller;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class HealthControllerTest {

    @Test
    void healthShouldReturnPublicSuccessResponse() throws Exception {
        Class<?> controllerClass = Class.forName("com.asms.core.controller.HealthController");
        Object controller = controllerClass.getDeclaredConstructor().newInstance();
        Object response = controllerClass.getMethod("health").invoke(controller);

        Method success = response.getClass().getMethod("success");
        Method message = response.getClass().getMethod("message");
        Method data = response.getClass().getMethod("data");

        assertThat(success.invoke(response)).isEqualTo(true);
        assertThat(message.invoke(response)).isEqualTo("ASMS backend is running");
        assertThat(data.invoke(response)).isNull();
    }
}
