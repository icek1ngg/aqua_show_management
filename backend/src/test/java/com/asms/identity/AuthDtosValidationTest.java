package com.asms.identity;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AuthDtosValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void registerRejectsInvalidPhoneInput() {
        assertThat(fieldErrors(registerRequest("Nguyen", "Van A", "user@example.com", "a", "abc123")))
                .contains("phoneNumber");
        assertThat(fieldErrors(registerRequest("Nguyen", "Van A", "user@example.com", "09a123456", "abc123")))
                .contains("phoneNumber");
        assertThat(fieldErrors(registerRequest("Nguyen", "Van A", "user@example.com", "090-123-456", "abc123")))
                .contains("phoneNumber");
        assertThat(fieldErrors(registerRequest("Nguyen", "Van A", "user@example.com", "", "abc123")))
                .contains("phoneNumber");
    }

    @Test
    void registerRejectsInvalidNamesAndEmailAndPassword() {
        assertThat(fieldErrors(registerRequest("Nguyen1", "Van A", "user@example.com", "0909123456", "abc123")))
                .contains("lastName");
        assertThat(fieldErrors(registerRequest("Nguyen", "Van@", "user@example.com", "0909123456", "abc123")))
                .contains("firstMiddleName");
        assertThat(fieldErrors(registerRequest("Nguyen", "Van A", "abc", "0909123456", "abc123")))
                .contains("email");
        assertThat(fieldErrors(registerRequest("Nguyen", "Van A", "user@example.com", "0909123456", "123")))
                .contains("password");
    }

    @Test
    void loginRejectsInvalidEmailAndBlankPassword() {
        assertThat(fieldErrors(loginRequest("abc", "")))
                .contains("email", "password");
    }

    @Test
    void updateProfileRejectsInvalidValues() {
        assertThat(fieldErrors(updateProfileRequest("Nguyen1", "Van A", "MALE", "0909123456", "Ho Chi Minh City")))
                .contains("lastName");
        assertThat(fieldErrors(updateProfileRequest("Nguyen", "Van A", "MALE", "abc", "Ho Chi Minh City")))
                .contains("phoneNumber");
        assertThat(fieldErrors(updateProfileRequest("Nguyen", "Van A", "MALE", "0909123456", "x".repeat(256))))
                .contains("address");
    }

    @Test
    void validRegisterAndProfilePayloadsPassValidation() {
        assertThat(fieldErrors(registerRequest("Nguyen", "Van A", "user@example.com", "0909123456", "abc123")))
                .isEmpty();
        assertThat(fieldErrors(updateProfileRequest("Nguyen", "Van A", "MALE", "0909123456", "Ho Chi Minh City")))
                .isEmpty();
        assertThat(fieldErrors(updateProfileRequest("Nguyen", "Van A", "MALE", "   ", "Ho Chi Minh City")))
                .isEmpty();
        assertThat(fieldErrors(updateProfileRequest("Nguyen", "Van A", "MALE", "", "Ho Chi Minh City")))
                .isEmpty();
    }

    @Test
    void updateProfileRejectsTodayAndFutureDateOfBirth() {
        assertThat(fieldErrors(updateProfileRequest("Nguyen", "Van A", "MALE", "0909123456", "Ho Chi Minh City", java.time.LocalDate.now())))
                .contains("dateOfBirth");
        assertThat(fieldErrors(updateProfileRequest("Nguyen", "Van A", "MALE", "0909123456", "Ho Chi Minh City", java.time.LocalDate.now().plusDays(1))))
                .contains("dateOfBirth");
        assertThat(fieldErrors(updateProfileRequest("Nguyen", "Van A", "MALE", "0909123456", "Ho Chi Minh City", java.time.LocalDate.now().minusDays(1))))
                .isEmpty();
    }

    private Object registerRequest(
            String lastName,
            String firstMiddleName,
            String email,
            String phoneNumber,
            String password
    ) {
        return newRecord(
                "com.asms.identity.dto.AuthDtos$RegisterRequest",
                new Class<?>[]{String.class, String.class, String.class, String.class, String.class},
                lastName,
                firstMiddleName,
                email,
                phoneNumber,
                password
        );
    }

    private Object loginRequest(String email, String password) {
        return newRecord(
                "com.asms.identity.dto.AuthDtos$LoginRequest",
                new Class<?>[]{String.class, String.class},
                email,
                password
        );
    }

    private Object updateProfileRequest(
            String lastName,
            String firstMiddleName,
            String gender,
            String phoneNumber,
            String address
    ) {
        return updateProfileRequest(lastName, firstMiddleName, gender, phoneNumber, address, null);
    }

    private Object updateProfileRequest(
            String lastName,
            String firstMiddleName,
            String gender,
            String phoneNumber,
            String address,
            java.time.LocalDate dateOfBirth
    ) {
        try {
            Class<?> genderClass = Class.forName("com.asms.identity.enums.Gender");
            Object genderValue = gender != null ? Enum.valueOf((Class<? extends Enum>) genderClass.asSubclass(Enum.class), gender) : null;
            return newRecord(
                    "com.asms.identity.dto.AuthDtos$UpdateProfileRequest",
                    new Class<?>[]{String.class, String.class, genderClass, String.class, String.class, java.time.LocalDate.class},
                    lastName,
                    firstMiddleName,
                    genderValue,
                    phoneNumber,
                    address,
                    dateOfBirth
            );
        } catch (ClassNotFoundException exception) {
            throw new IllegalStateException(exception);
        }
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
